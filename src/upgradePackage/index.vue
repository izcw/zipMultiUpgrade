<template>
    <section class="panel">
        <!-- 1. 上传 -->
        <div class="upload-section">
            <div class="file-upload">
                <div class="file-upload-button">
                    <input class="file-input" type="file" :accept="acceptExt" @change="onFileChange"
                        ref="fileInputRef" />
                    <img src="@/assets/images/upload.png" alt="">
                    <p v-if="filezip">{{ filezip.name }} ({{ formatSize(filezip.size) }})</p>
                    <span v-else>点击上传文件</span>
                </div>
                <button v-if="filezip" @click="clearFiles" circle type="info">x</button>
            </div>
        </div>

        <!-- 2. 文件列表 -->
        <div class="file-section" v-if="hasFiles">
            <div class="select-all-control" @click="toggleSelectAll">
                <input class="item-checkbox" type="checkbox" :checked="isAllSelected" @click.stop />
                全选（{{ checkedFiles.length }} / {{ displayList.length }}）
            </div>
            <FileList :files="displayList" :checked-files="checkedFiles" :show-details="false"
                @toggle-check="toggleCheck" />
        </div>

        <!-- 3. 操作 -->
        <div class="action-section">
            <button type="primary" :disabled="!hasPreviewFiles" @click="submitUpgrade" :loading="isUpgrading">
                {{ isUpgrading ? '升级中...' : 'Upgrade' }}
            </button>
            <button @click="closePanel" type="info">Close</button>
        </div>

        <!-- 4. 日志：把选中的文件传给日志组件 -->
        <ProgressLog v-if="showProgressLog" :files="upgradeFiles" @all-done="onUpgradeDone" />
    </section>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import JSZip from 'jszip'
import FileList from './components/FileList.vue'
import ProgressLog from './components/ProgressLog.vue'

/* **************** 版本对比 **************** */
const versionComparison = ref(true)
const showLowVersion = ref(false)
const props = defineProps({
    CurrentVersion: { type: Array, default: () => [] }
})

/*  解析：从右拿两段，最后一段=规则，倒数第二段若是vX.Y.Z=版本  */
function parseRuleAndVersion(fileName) {
    const segs = fileName.replace(/\.[A-Z]{3}$/i, '').split('_') // 去掉扩展名
    const rule = segs.at(-1)?.toUpperCase()                    // 最后一段 = 规则
    const vSeg = segs.at(-2)                                   // 倒数第二段
    const version = vSeg?.match(/^v(\d+\.\d+\.\d+)$/i)?.[1] || null
    const suffix = fileName.split('.').pop().toUpperCase()
    return { rule, version, suffix }
}

function toVerArr(v) { return v ? v.split('.').map(Number) : [0, 0, 0] }
function cmpVersion(a, b) {
    const aa = toVerArr(a), bb = toVerArr(b)
    for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i]
    return 0
}

/* **************** 常量 **************** */
const priorityRules = Object.freeze([
    { suffix: 'BIN', namingformat: 'SWITCH', min: 0, max: 81920, cmd: 'SWITCH-CMD' },
    { suffix: 'APP', namingformat: 'MCU', cmd: 'RxConnect' },
    { suffix: 'BIN', namingformat: 'EDID', size: [128, 256], cmd: 'EDIDUpload' }
])
const separator = '_'

/* **************** 响应式 **************** */
const fileInputRef = ref(null)
const filezip = ref(null)
const fileList = ref([])
const checkedFiles = ref([])
const zipInstance = ref(null)
const progress = ref(0)
const showProgressLog = ref(false)
const upgradeFiles = ref([])
const isUpgrading = ref(false)
const showExceptFiles = ref(true)
const sortCheckedFiles = ref(true)
const caseSensitive = ref(true)
const defaultSelectAll = ref(true)
const progressLogs = ref([])

let progressInterval = null

/* **************** 计算属性 **************** */
const hasFiles = computed(() => fileList.value.length > 0)
const hasPreviewFiles = computed(() => checkedFiles.value.length > 0)

const displayList = computed(() => {
    let list = fileList.value.filter(f => showExceptFiles.value ? f.hitRule : !f.hitRule)
    if (versionComparison.value && !showLowVersion.value) list = list.filter(f => f.needUpgrade !== false)
    return list
})

const sortedPreviewList = computed(() => {
    if (!sortCheckedFiles.value) return checkedFiles.value
    return [...checkedFiles.value].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
})

const isAllSelected = computed(() => {
    const available = displayList.value.filter(f => f.needUpgrade !== false)
    return available.length > 0 && available.every(f => checkedFiles.value.includes(f))
})

/* **************** 文件处理 **************** */
/* 可上传配置：ext=后缀数组，mime=MIME数组，allow=true 才校验 */
const UPLOAD_CONFIG = Object.freeze({
    zip: { ext: ['zip'], mime: ['application/zip', 'application/x-zip-compressed'], allow: true },
    rar: { ext: ['rar'], mime: ['application/x-rar-compressed', 'application/vnd.rar'], allow: false },
    tar: { ext: ['tar'], mime: ['application/x-tar'], allow: false },
    '7z': { ext: ['7z'], mime: ['application/x-7z-compressed'], allow: false },
})

/* 计算属性：把允许的后缀拼成 .ext,.ext 形式 */
const acceptExt = computed(() => {
  const arr = Object.entries(UPLOAD_CONFIG)
    .filter(([, cfg]) => cfg.allow)
    .flatMap(([, cfg]) => cfg.ext.map(e => `.${e}`))
  return arr.join(',')
})

function isAllowedFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const mime = file.type || '' // 部分浏览器对 tar/7z 可能返回空
    for (const [key, cfg] of Object.entries(UPLOAD_CONFIG)) {
        if (!cfg.allow) continue
        if (cfg.ext.includes(ext)) return true        // 后缀命中即可放行
        if (mime && cfg.mime.includes(mime)) return true // MIME 二次确认
    }
    return false
}

const MAX_BYTES = 5 * 1024 * 1024   // 5 MB

async function onFileChange(e) {
  const f = e.target.files[0]
  if (!f) return
  if (!isAllowedFile(f)) return showError(`只允许 ${acceptExt.value} 格式`)
  if (f.size > MAX_BYTES) return showError(`文件大小不能超过 5 MB`)
  filezip.value = f
  try { await processZipFile(f) }
  catch { showError('文件处理失败'); clearFiles() }
}

async function processZipFile(file) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    zipInstance.value = zip
    const files = []
    zip.forEach((path, entry) => {
        if (!entry.dir) files.push(createFileObject(path, entry))
    })
    sortAndMarkFiles(files)
    fileList.value = files

    if (versionComparison.value) {
        files.forEach(f => {
            const cur = props.CurrentVersion.find(v => v.namingformat === f.rule && v.suffix === f.ext)
            if (!cur || !cur.version) { f.needUpgrade = true; f.curVersion = null }
            else { f.curVersion = cur.version; f.needUpgrade = cmpVersion(f.version, cur.version) > 0 }
        })
    } else {
        files.forEach(f => f.needUpgrade = true)
    }

    refreshFileList()
    console.log(`成功加载 ${files.length} 个文件`)
}

function createFileObject(name, entry) {
    const ext = getFileExt(name)
    const { rule, version } = parseRuleAndVersion(name)
    return {
        name, ext, version, rule,
        size: entry._data?.uncompressedSize || 0,
        date: entry.date.toLocaleString(),
        entry,
        hitRule: false, cmd: '', shortName: '', priority: Infinity
    }
}

function getFileExt(n) {
    const i = n.lastIndexOf('.')
    return i === -1 ? '' : n.slice(i + 1).toUpperCase()
}

function sortAndMarkFiles(files) {
    files.forEach(f => {
        const idx = priorityRules.findIndex(r => {
            if (f.ext !== r.suffix) return false
            if (r.size && !r.size.includes(f.size)) return false
            /* ******** 大小写开关 ******** */
            const key = caseSensitive.value ? r.namingformat : r.namingformat.toUpperCase()
            let ruleSeg = f.name.replace(/\.[A-Z]{3}$/i, '').split('_').at(-1) ?? ''
            if (!caseSensitive.value) ruleSeg = ruleSeg.toUpperCase()
            return ruleSeg === key
        })
        f.hitRule = idx !== -1
        f.priority = idx === -1 ? Infinity : idx
        f.cmd = priorityRules[idx]?.cmd || ''
        f.shortName = ellipsisName(f.name)
    })
    files.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
}

/* **************** 选择管理 **************** */
function toggleCheck(file) {
    if (file.needUpgrade === false) return
    const i = checkedFiles.value.indexOf(file)
    if (i === -1) checkedFiles.value.push(file)
    else checkedFiles.value.splice(i, 1)
}

function toggleSelectAll() {
    const available = displayList.value.filter(f => f.needUpgrade !== false)
    if (!available.length) return
    const allChecked = available.every(f => checkedFiles.value.includes(f))
    if (allChecked) {
        checkedFiles.value = checkedFiles.value.filter(f => !available.includes(f))
    } else {
        const add = available.filter(f => !checkedFiles.value.includes(f))
        checkedFiles.value.push(...add)
    }
}

/* **************** 升级流程 **************** */
function submitUpgrade() {
    if (!hasPreviewFiles.value) return

    /* 1. 强制重置日志组件状态 */
    isUpgrading.value = false
    showProgressLog.value = false
    upgradeFiles.value = []                 // 先清空引用

    nextTick(() => {
        /* 2. 再传入新引用，触发 watch 重新执行 */
        isUpgrading.value = true
        showProgressLog.value = true
        upgradeFiles.value = [...sortedPreviewList.value]   // 新数组
    })
}
function onUpgradeDone() {
    isUpgrading.value = false // '全部升级完毕！'
}



/* **************** 工具 **************** */
function formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.floor(bytes / Math.pow(k, i)) + ' ' + sizes[i]
}

function ellipsisName(n, max = 60) {
    if (n.length <= max) return n
    const i = n.lastIndexOf('.')
    const ext = i === -1 ? '' : n.slice(i)
    const name = n.slice(0, i === -1 ? max : i)
    return name.slice(0, Math.max(max - ext.length - 1, 1)) + '…' + ext
}


function showError(msg) { console.log(`错误: ${msg}`) }

function clearFiles() {
    fileList.value = []
    checkedFiles.value = []
    zipInstance.value = null
    filezip.value = null
    showProgressLog.value = false
    isUpgrading.value = false
    progress.value = 0
    progressLogs.value = []
    if (fileInputRef.value) fileInputRef.value.value = ''
    console.log('已清除所有文件')
}

function closePanel() { clearFiles() }

function refreshFileList() {
    if (!fileList.value.length) return
    sortAndMarkFiles(fileList.value)
    if (versionComparison.value) {
        fileList.value.forEach(f => {
            const cur = props.CurrentVersion.find(v => v.namingformat === f.rule && v.suffix === f.ext)
            if (!cur || !cur.version) { f.needUpgrade = true; f.curVersion = null }
            else { f.curVersion = cur.version; f.needUpgrade = cmpVersion(f.version, cur.version) > 0 }
        })
    } else {
        fileList.value.forEach(f => f.needUpgrade = true)
    }
    if (defaultSelectAll.value) {
        const auto = fileList.value.filter(f => f.hitRule && f.needUpgrade)
        checkedFiles.value = auto
    }
}


defineOptions({
  name: 'UpgradePackage'
})

// 暴露方法给父组件
defineExpose({
  clearFiles,
  refreshFileList,
  getSelectedFiles: () => [...sortedPreviewList.value]
})

watch(caseSensitive, refreshFileList)
onUnmounted(() => { progressInterval && clearInterval(progressInterval) })
</script>


<style scoped lang="scss">
.panel {
    width: 100%;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;
    color: #fff;
    background-color: #171A2D;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
}

.section-base {
    padding-bottom: 1rem;
    border-bottom: 1px solid #333;
}

.upload-section {
    @extend .section-base;
}

.file-upload {
    width: 100%;
    height: 40px;
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;

    .file-upload-button {
        width: 100%;
        height: 100%;
        border: 1px dashed #999;
        display: flex;
        align-items: center;
        padding: 0 1rem;
        box-sizing: border-box;
        border-radius: 6px;
        position: relative;
        overflow: hidden;

        img {
            width: 20px;
            margin-right: 1rem;
        }

        p {
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .file-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #20963189;
            z-index: 99;
            opacity: 0;
            cursor: pointer;
        }

        &:hover,
        &:active {
            border: 1px solid #999;
        }
    }
}


.file-section {
    @extend .section-base;

    .select-all-control {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        cursor: pointer;

        .item-checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
            margin-right: 10px;
        }
    }
}


.action-section {
    @extend .section-base;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
}

</style>