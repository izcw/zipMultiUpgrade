<!-- src\components\UpgradePackage\index.vue -->
<template>
    <div class="File-Panel">
        <!-- 1. 上传 -->
        <div class="upload-section">
            <div class="file-upload">
                <div class="file-upload-button">
                    <input class="file-input" type="file" :accept="acceptExt" @change="onFileChange"
                        ref="fileInputRef" />
                    <svg t="1761289411334" class="icon" viewBox="0 0 1024 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg" p-id="8752" width="32" height="32">
                        <path
                            d="M867.705263 485.519719v359.298246h-718.596491v-359.298246h-71.859649v395.22807c0 19.761404 16.168421 35.929825 35.929824 35.929825h790.456141c19.761404 0 35.929825-16.168421 35.929824-35.929825v-395.22807h-71.859649z"
                            p-id="8753" fill="currentColor"></path>
                        <path
                            d="M472.477193 212.453053v452.715789h71.859649v-452.715789l154.498246 154.498245 50.301754-50.301754-215.578947-215.578948c-14.37193-14.37193-35.929825-14.37193-50.301755 0l-215.578947 215.578948 50.301754 50.301754 154.498246-154.498245z"
                            p-id="8754" fill="currentColor"></path>
                    </svg>
                    <p v-if="filezip">{{ filezip.name }} ({{ formatSize(filezip.size) }})</p>
                    <p v-else>点击上传文件</p>
                </div>
                <div class="delete" v-if="filezip" @click="clearFiles">
                    <svg t="1761288962731" class="icon" viewBox="0 0 1025 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg" p-id="4671" width="32" height="32">
                        <path
                            d="M937.008958 1007.935101L512.072972 583.426523 87.213142 1007.860499c-19.761826 19.736959-51.834578 19.878392-71.663235 0.074602-19.729187-19.7152-19.618838-51.815927 0.105687-71.568428L440.552725 511.932697 15.655594 87.461421c-19.76338-19.736959-19.724525-51.882758 0-71.590187 19.797573-19.77426 51.870325-19.74473 71.667897 0.037301l424.85983 424.433976L937.044705 15.908535c19.799127-19.782031 51.833024-19.782031 71.591741-0.037301 19.834874 19.819332 19.764934 51.741325-0.032638 71.515585L583.739315 511.836336l424.939095 424.500807c19.828657 19.782031 19.828657 51.815927 0.02953 71.552886-19.726079 19.848862-51.864108 19.848862-71.698982 0.045072z"
                            fill="currentColor" p-id="4672"></path>
                    </svg>
                </div>
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
    </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick, getCurrentInstance, onMounted } from 'vue'
import JSZip from 'jszip'
import FileList from '@/components/UpgradePackage/components/FileList.vue'

// 定义事件
const emit = defineEmits(['files-ready', 'files-selected', 'panel-closed', 'error'])

// 默认配置
const defaultConfig = {
    // 选择配置
    defaultSelectAll: true,
    caseSensitive: true,

    // 版本配置
    versionComparison: true,
    showLowVersion: false,

    // 文件过滤配置
    showExceptFiles: true,
    sortCheckedFiles: true,

    // 文件处理配置
    priorityRules: [
        { suffix: 'BIN', namingformat: 'SWITCH', min: 0, max: 819200, cmd: 'SWITCH-CMD' },
        { suffix: 'APP', namingformat: 'MCU', cmd: 'RxConnect' },
        { suffix: 'BIN', namingformat: 'EDID', size: [128, 256], cmd: 'EDIDUpload' }
    ],

    // 版本过滤配置
    currentVersions: [],

    // 上传配置
    uploadConfig: {
        zip: { ext: ['zip'], mime: ['application/zip', 'application/x-zip-compressed'], allow: true },
        rar: { ext: ['rar'], mime: ['application/x-rar-compressed', 'application/vnd.rar'], allow: false },
        tar: { ext: ['tar'], mime: ['application/x-tar'], allow: false },
        '7z': { ext: ['7z'], mime: ['application/x-7z-compressed'], allow: false },
    },
    maxFileSize: 5 * 1024 * 1024, // 5 MB

    // 解析规则配置
    parseRuleAndVersion: (fileName) => {
        const segs = fileName.replace(/\.[A-Z]{3}$/i, '').split('_')
        const rule = segs.at(-1)?.toUpperCase()
        const vSeg = segs.at(-2)
        const version = vSeg?.match(/^v(\d+\.\d+\.\d+)$/i)?.[1] || null
        const suffix = fileName.split('.').pop().toUpperCase()
        return { rule, version, suffix }
    },

    // 版本比较配置
    versionComparator: (a, b) => {
        const toVerArr = (v) => v ? v.split('.').map(Number) : [0, 0, 0]
        const aa = toVerArr(a), bb = toVerArr(b)
        for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i]
        return 0
    },

    // 文件名截断配置
    ellipsisName: (n, max = 60) => {
        if (n.length <= max) return n
        const i = n.lastIndexOf('.')
        const ext = i === -1 ? '' : n.slice(i)
        const name = n.slice(0, i === -1 ? max : i)
        return name.slice(0, Math.max(max - ext.length - 1, 1)) + '…' + ext
    }
}

// 定义 props
const props = defineProps({
    config: {
        type: Object,
        default: () => ({})
    }
})

// 合并配置
const config = computed(() => ({
    ...defaultConfig,
    ...props.config
}))

/* **************** 响应式 **************** */
const fileInputRef = ref(null)
const filezip = ref(null)
const fileList = ref([])
const checkedFiles = ref([])
const zipInstance = ref(null)

/* **************** 计算属性 **************** */
const hasFiles = computed(() => fileList.value.length > 0)
const hasPreviewFiles = computed(() => checkedFiles.value.length > 0)

// 计算允许上传的后缀
const acceptExt = computed(() => {
    const arr = Object.entries(config.value.uploadConfig)
        .filter(([, cfg]) => cfg.allow)
        .flatMap(([, cfg]) => cfg.ext.map(e => `.${e}`))
    return arr.join(',')
})

// 显示列表计算
const displayList = computed(() => {
    let list = fileList.value.filter(f => config.value.showExceptFiles ? f.hitRule : !f.hitRule)
    if (config.value.versionComparison && !config.value.showLowVersion) {
        list = list.filter(f => f.needUpgrade !== false)
    }
    return list
})

// 排序预览列表
const sortedPreviewList = computed(() => {
    if (!config.value.sortCheckedFiles) return checkedFiles.value
    return [...checkedFiles.value].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
})

// 全选状态
const isAllSelected = computed(() => {
    const available = displayList.value.filter(f => f.needUpgrade !== false)
    return available.length > 0 && available.every(f => checkedFiles.value.includes(f))
})

// 暴露给使用者的文件数据
const processedFiles = computed(() => {
    return sortedPreviewList.value.map(file => ({
        name: file.name,
        ext: file.ext,
        version: file.version,
        rule: file.rule,
        size: file.size,
        cmd: file.cmd,
        priority: file.priority,
        needUpgrade: file.needUpgrade,
        curVersion: file.curVersion,
        hitRule: file.hitRule,
        shortName: file.shortName,
        originalEntry: file.entry,
        getFileData: async () => {
            if (file.entry && zipInstance.value) {
                return await file.entry.async('uint8array')
            }
            return null
        }
    }))
})

/* **************** 文件处理 **************** */
function isAllowedFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const mime = file.type || ''
    for (const [key, cfg] of Object.entries(config.value.uploadConfig)) {
        if (!cfg.allow) continue
        if (cfg.ext.includes(ext)) return true
        if (mime && cfg.mime.includes(mime)) return true
    }
    return false
}

async function onFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!isAllowedFile(f)) {
        showError(`只允许 ${acceptExt.value} 格式`)
        return
    }
    if (f.size > config.value.maxFileSize) {
        showError(`文件大小不能超过 ${formatSize(config.value.maxFileSize)}`)
        return
    }
    filezip.value = f
    try {
        await processZipFile(f)
        emit('files-ready', {
            files: fileList.value,
            selectedFiles: processedFiles.value,
            zipFile: f
        })
    }
    catch (error) {
        showError('文件处理失败')
        clearFiles()
        emit('files-ready', { error: error.message })
    }
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

    if (config.value.versionComparison) {
        files.forEach(f => {
            const cur = config.value.currentVersions.find(v => v.namingformat === f.rule && v.suffix === f.ext)
            if (!cur || !cur.version) {
                f.needUpgrade = true;
                f.curVersion = null
            } else {
                f.curVersion = cur.version;
                f.needUpgrade = config.value.versionComparator(f.version, cur.version) > 0
            }
        })
    } else {
        files.forEach(f => f.needUpgrade = true)
    }

    refreshFileList()
}

function createFileObject(name, entry) {
    const ext = getFileExt(name)
    const { rule, version } = config.value.parseRuleAndVersion(name)
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
        const idx = config.value.priorityRules.findIndex(r => {
            // 1. 首先检查后缀
            if (f.ext !== r.suffix) {
                return false
            }

            // 2. 检查命名格式
            const key = config.value.caseSensitive.value ? r.namingformat : r.namingformat.toUpperCase()
            let ruleSeg = f.name.replace(/\.[A-Z]{3}$/i, '').split('_').at(-1) ?? ''
            if (!config.value.caseSensitive.value) ruleSeg = ruleSeg.toUpperCase()

            if (ruleSeg !== key) {
                return false
            }

            // 3. 检查文件大小（只有命名和后缀都匹配后才检查大小）
            let sizeValid = true

            // 如果有 size 数组，检查是否在数组中
            if (r.size && r.size.length > 0) {
                sizeValid = r.size.includes(f.size)
            }
            // 否则检查 min/max 范围
            else {
                if (r.min !== undefined && f.size < r.min) {
                    sizeValid = false
                }
                if (r.max !== undefined && f.size > r.max) {
                    sizeValid = false
                }
            }

            return sizeValid
        })

        f.hitRule = idx !== -1
        f.priority = idx === -1 ? Infinity : idx
        f.cmd = config.value.priorityRules[idx]?.cmd || ''
        f.shortName = config.value.ellipsisName(f.name)
    })

    files.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
}

/* **************** 选择管理 **************** */
function toggleCheck(file) {
    if (file.needUpgrade === false) return
    const i = checkedFiles.value.indexOf(file)
    if (i === -1) checkedFiles.value.push(file)
    else checkedFiles.value.splice(i, 1)

    emit('files-selected', {
        selectedFiles: processedFiles.value,
        selectedCount: checkedFiles.value.length,
        totalCount: fileList.value.length
    })
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

    emit('files-selected', {
        selectedFiles: processedFiles.value,
        selectedCount: checkedFiles.value.length,
        totalCount: fileList.value.length
    })
}

/* **************** 文件就绪处理 **************** */
function handleFileReady() {
    if (!hasPreviewFiles.value) {
        showError('请先选择要处理的文件')
        return
    }

    emit('files-ready', {
        files: processedFiles.value,
        selectedCount: checkedFiles.value.length,
        zipInstance: zipInstance.value,
        originalFile: filezip.value
    })
}

/* **************** 工具 **************** */
function formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.floor(bytes / Math.pow(k, i)) + ' ' + sizes[i]
}

function showError(msg) {
    emit('error', msg)
}

function clearFiles() {
    fileList.value = []
    checkedFiles.value = []
    zipInstance.value = null
    filezip.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
    emit('panel-closed')
}

function closePanel() {
    clearFiles()
}

function refreshFileList() {
    if (!fileList.value.length) return
    sortAndMarkFiles(fileList.value)
    if (config.value.versionComparison) {
        fileList.value.forEach(f => {
            const cur = config.value.currentVersions.find(v => v.namingformat === f.rule && v.suffix === f.ext)
            if (!cur || !cur.version) { f.needUpgrade = true; f.curVersion = null }
            else { f.curVersion = cur.version; f.needUpgrade = config.value.versionComparator(f.version, cur.version) > 0 }
        })
    } else {
        fileList.value.forEach(f => f.needUpgrade = true)
    }
    if (config.value.defaultSelectAll) {
        const auto = fileList.value.filter(f => f.hitRule && f.needUpgrade)
        checkedFiles.value = auto
    }
}

function getSelectedFiles() {
    return processedFiles.value
}

// 获取单个文件的二进制数据
async function getFileBinaryData(fileName) {
    if (!zipInstance.value) return null
    const file = fileList.value.find(f => f.name === fileName)
    if (file && file.entry) {
        return await file.entry.async('uint8array')
    }
    return null
}

// 获取所有选中文件的二进制数据
async function getAllSelectedFilesBinary() {
    const result = {}
    for (const file of sortedPreviewList.value) {
        if (file.entry) {
            result[file.name] = await file.entry.async('uint8array')
        }
    }
    return result
}

defineOptions({
    name: 'UpgradePackage'
})

// 注册当前实例
const internalInstance = getCurrentInstance()

// 暴露方法给父组件
defineExpose({
    clearFiles,
    refreshFileList,
    getSelectedFiles,
    getFileBinaryData,
    getAllSelectedFilesBinary,
    closePanel,
    // 状态信息
    fileCount: computed(() => fileList.value.length),
    selectedCount: computed(() => checkedFiles.value.length),
    hasFiles: computed(() => fileList.value.length > 0),
    hasSelectedFiles: computed(() => checkedFiles.value.length > 0),
    // 配置信息
    getConfig: () => config.value
})

// 监听配置变化
watch(() => config.value.caseSensitive, refreshFileList)
onUnmounted(() => {
    // 清理工作
})
</script>

<style scoped lang="scss">
.File-Panel {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    color: #000000;
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
}

.section-base {
    // padding-bottom: 1rem;
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
    position: relative;
    overflow: hidden;

    .file-upload-button {
        width: 100%;
        height: 100%;
        border: 1px dashed #999;
        display: flex;
        align-items: center;
        padding: 0 10px;
        box-sizing: border-box;
        border-radius: 6px;
        position: relative;
        overflow: hidden;

        svg {
            width: 20px;
            height: 20px;
            min-width: 20px;
            min-height: 20px;
            margin-right: 10px;
        }

        p {
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-right: 30px;
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

    .delete {
        position: absolute;
        top: 0;
        right: 0;
        width: 40px;
        height: 100%;
        z-index: 102;
        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            width: 16px;
            height: 16px;
        }
    }

    .delete:hover,
    .delete:active {
        opacity: 0.7;
    }

}

.file-section {
    @extend .section-base;

    user-select: none;

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