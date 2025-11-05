<!-- src\components\UpgradePackage\index.vue -->
<template>
  <div class="File-Panel">
    <!-- 上传区域 -->
    <div class="upload-section">
      <div class="file-upload">
        <div class="file-upload-button">
          <input
            class="file-input"
            type="file"
            :accept="acceptExtensions"
            @change="handleFileSelect"
            ref="fileInputRef"
          />
          <div class="upload-icon">
            <slot name="upload-icon">
              <div class="default-icon">
                <svg
                  t="1761533624000"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="4538"
                  width="32"
                  height="32"
                >
                  <path
                    d="M1024 693.248q0 25.6-8.704 48.128t-24.576 40.448-36.864 30.208-45.568 16.384l1.024 1.024-17.408 0-4.096 0-4.096 0-675.84 0q-5.12 1.024-16.384 1.024-39.936 0-74.752-15.36t-60.928-41.472-40.96-60.928-14.848-74.752 14.848-74.752 40.96-60.928 60.928-41.472 74.752-15.36l1.024 0q-1.024-8.192-1.024-15.36l0-16.384q0-72.704 27.648-137.216t75.776-112.128 112.128-75.264 136.704-27.648 137.216 27.648 112.64 75.264 75.776 112.128 27.648 137.216q0 37.888-8.192 74.24t-22.528 69.12q5.12-1.024 10.752-1.536t10.752-0.512q27.648 0 52.736 10.752t43.52 29.696 29.184 44.032 10.752 53.76zM665.6 571.392q20.48 0 26.624-4.608t-8.192-22.016q-14.336-18.432-31.744-48.128t-36.352-60.416-38.4-57.344-37.888-38.912q-18.432-13.312-27.136-14.336t-25.088 12.288q-18.432 15.36-35.84 38.912t-35.328 50.176-35.84 52.224-36.352 45.056q-18.432 18.432-13.312 32.768t25.6 14.336l16.384 0q9.216 0 19.968 0.512t20.992 0.512l17.408 0q14.336 1.024 18.432 9.728t4.096 24.064q0 17.408-0.512 30.72t-0.512 25.6-0.512 25.6-0.512 30.72q0 7.168 1.536 15.36t5.632 15.36 12.288 11.776 21.504 4.608l23.552 0q9.216 0 27.648 1.024 24.576 0 28.16-12.288t3.584-38.912q0-23.552 0.512-42.496t0.512-51.712q0-23.552 4.608-36.352t19.968-12.8q11.264 0 32.256-0.512t32.256-0.512z"
                    p-id="4539"
                  ></path>
                </svg>
              </div>
            </slot>
          </div>
          <p v-if="uploadedZip">
            {{ uploadedZip.name }} ({{ formatSize(uploadedZip.size) }})
          </p>
          <p v-else>点击上传文件</p>
        </div>
        <div class="delete-icon" v-if="uploadedZip" @click="clearAll">
          <slot name="delete-icon">
            <div class="default-icon">
              <svg
                t="1761288962731"
                class="icon"
                viewBox="0 0 1025 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="4671"
                width="32"
                height="32"
              >
                <path
                  d="M937.008958 1007.935101L512.072972 583.426523 87.213142 1007.860499c-19.761826 19.736959-51.834578 19.878392-71.663235 0.074602-19.729187-19.7152-19.618838-51.815927 0.105687-71.568428L440.552725 511.932697 15.655594 87.461421c-19.76338-19.736959-19.724525-51.882758 0-71.590187 19.797573-19.77426 51.870325-19.74473 71.667897 0.037301l424.85983 424.433976L937.044705 15.908535c19.799127-19.782031 51.833024-19.782031 71.591741-0.037301 19.834874 19.819332 19.764934 51.741325-0.032638 71.515585L583.739315 511.836336l424.939095 424.500807c19.828657 19.782031 19.828657 51.815927 0.02953 71.552886-19.726079 19.848862-51.864108 19.848862-71.698982 0.045072z"
                  fill="currentColor"
                  p-id="4672"
                ></path>
              </svg>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="file-section" v-if="hasFiles">
      <div class="select-all-control" @click="toggleSelectAll">
        <input
          class="item-checkbox"
          type="checkbox"
          :checked="isAllSelected"
          @click.stop
        />
        全选（{{ checkedFiles.length }} / {{ displayFiles.length }}）
      </div>
      <FileList
        :files="displayFiles"
        :checked-files="checkedFiles"
        :show-details="false"
        @toggle-check="toggleFileCheck"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { loadAsync } from "jszip";
import FileList from "./components/FileList.vue";
import { formatSize } from "@/utils/common.js";

// ==================== 事件定义 ====================
const emit = defineEmits(["files-ready", "files-selected", "close", "error"]);

// ==================== 默认配置 ====================
const defaultConfig = {
  defaultSelectAll: true,
  caseSensitive: true,
  versionComparison: true,
  showLowVersion: false,
  showExceptFiles: true,
  sortCheckedFiles: true,
  priorityRules: [
    {
      suffix: "BIN",
      namingformat: "SWITCH",
      min: 0,
      max: 819200,
      cmd: "SWITCH-CMD",
    },
    { suffix: "APP", namingformat: "MCU", cmd: "RxConnect" },
    {
      suffix: "BIN",
      namingformat: "EDID",
      size: [128, 256],
      cmd: "EDIDUpload",
    },
  ],
  currentVersions: [],
  uploadConfig: {
    zip: {
      ext: ["zip"],
      mime: ["application/zip", "application/x-zip-compressed"],
      allow: true,
    },
    rar: { ext: ["rar"], mime: ["application/x-rar-compressed"], allow: false },
    tar: { ext: ["tar"], mime: ["application/x-tar"], allow: false },
    "7z": { ext: ["7z"], mime: ["application/x-7z-compressed"], allow: false },
  },
  maxFileSize: 5 * 1024 * 1024,
  parseRuleAndVersion: (name) => {
    const segs = name.replace(/\.[A-Z]{3}$/i, "").split("_");
    const rule = segs.at(-1)?.toUpperCase();
    const vSeg = segs.at(-2);
    const version = vSeg?.match(/^v(\d+\.\d+\.\d+)$/i)?.[1] || null;
    const suffix = name.split(".").pop().toUpperCase();
    return { rule, version, suffix };
  },
  versionComparator: (a, b) => {
    const toArr = (v) => (v ? v.split(".").map(Number) : [0, 0, 0]);
    const aa = toArr(a),
      bb = toArr(b);
    for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
    return 0;
  },
  ellipsisName: (n, max = 60) => {
    if (n.length <= max) return n;
    const i = n.lastIndexOf(".");
    const ext = i === -1 ? "" : n.slice(i);
    const name = n.slice(0, i === -1 ? max : i);
    return name.slice(0, Math.max(max - ext.length - 1, 1)) + "..." + ext;
  },
};

// ==================== Props ====================
const props = defineProps({
  config: { type: Object, default: () => ({}) },
});

// ==================== 合并配置 ====================
const config = computed(() => ({ ...defaultConfig, ...props.config }));

// ==================== 响应式状态 ====================
const fileInputRef = ref(null);
const uploadedZip = ref(null);
const zipInstance = ref(null);
const fileList = ref([]);
const checkedFiles = ref([]);
const isParsing = ref(false); // 防止重复解析 ZIP

// ==================== 计算属性 ====================
const hasFiles = computed(() => fileList.value.length > 0);

const acceptExtensions = computed(() => {
  return Object.entries(config.value.uploadConfig)
    .filter(([, cfg]) => cfg.allow)
    .flatMap(([, cfg]) => cfg.ext.map((e) => `.${e}`))
    .join(",");
});

const displayFiles = computed(() => {
  let list = fileList.value;
  if (!config.value.showExceptFiles) {
    list = list.filter((f) => f.hitRule);
  }
  if (config.value.versionComparison && !config.value.showLowVersion) {
    list = list.filter((f) => f.needUpgrade !== false);
  }
  return list;
});

const isAllSelected = computed(() => {
  const available = displayFiles.value.filter((f) => f.needUpgrade !== false);
  return (
    available.length > 0 &&
    available.every((f) => checkedFiles.value.includes(f))
  );
});

const processedFiles = computed(() => {
  const sorted = config.value.sortCheckedFiles
    ? [...checkedFiles.value].sort(
        (a, b) => a.priority - b.priority || a.name.localeCompare(b.name)
      )
    : checkedFiles.value;

  return sorted.map((file) => ({
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
    // 修复：File 是 Promise<File>
    File: (async () => {
      if (file.entry && zipInstance.value) {
        const uint8 = await file.entry.async("uint8array");
        return new File([uint8], file.name, {
          type: "application/octet-stream",
          lastModified: Date.now(),
        });
      }
      return null;
    })(),
    getFileData: () => file.entry?.async("uint8array") || null,
  }));
});

// ==================== 文件处理 ====================
const isFileAllowed = (file) => {
  const ext = file.name.split(".").pop().toLowerCase();
  const mime = file.type || "";
  for (const [key, cfg] of Object.entries(config.value.uploadConfig)) {
    if (!cfg.allow) continue;
    if (cfg.ext.includes(ext) || (mime && cfg.mime.includes(mime))) return true;
  }
  return false;
};

const handleFileSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!isFileAllowed(file)) {
    emitError(`只允许 ${acceptExtensions.value} 格式`);
    return;
  }
  if (file.size > config.value.maxFileSize) {
    emitError(`文件大小不能超过 ${formatSize(config.value.maxFileSize)}`);
    return;
  }

  uploadedZip.value = file;
  await parseZipFile(file);
};

const parseZipFile = async (file) => {
  if (isParsing.value) {
    console.warn("正在解析 ZIP 文件，请勿重复操作");
    return;
  }
  isParsing.value = true;

  try {
    const zip = await loadAsync(await file.arrayBuffer());
    zipInstance.value = zip;

    const files = [];
    zip.forEach((path, entry) => {
      if (!entry.dir) files.push(createFileEntry(path, entry));
    });

    applyRulesAndSort(files);
    fileList.value = files;
    applyVersionCheck();
    autoSelectFiles();
    emitFilesReady();
  } catch (err) {
    emitError("文件处理失败");
    clearAll();
    emit("files-ready", { error: err.message });
  } finally {
    isParsing.value = false;
  }
};

const createFileEntry = (name, entry) => {
  const ext = name.split(".").pop().toUpperCase();
  const { rule, version } = config.value.parseRuleAndVersion(name);
  return {
    name,
    ext,
    version,
    rule,
    size: entry._data?.uncompressedSize || 0,
    date: entry.date,
    entry,
    hitRule: false,
    cmd: "",
    shortName: "",
    priority: Infinity,
    needUpgrade: true,
    curVersion: null,
  };
};

const applyRulesAndSort = (files) => {
  files.forEach((file) => {
    const idx = config.value.priorityRules.findIndex((rule) => {
      if (file.ext !== rule.suffix) return false;
      const key = config.value.caseSensitive
        ? rule.namingformat
        : rule.namingformat.toUpperCase();
      let seg =
        file.name
          .replace(/\.[A-Z]{3}$/i, "")
          .split("_")
          .at(-1) || "";
      if (!config.value.caseSensitive) seg = seg.toUpperCase();
      if (seg !== key) return false;
      if (rule.size) return rule.size.includes(file.size);
      if (rule.min !== undefined && file.size < rule.min) return false;
      if (rule.max !== undefined && file.size > rule.max) return false;
      return true;
    });

    file.hitRule = idx !== -1;
    file.priority = idx === -1 ? Infinity : idx;
    file.cmd = config.value.priorityRules[idx]?.cmd || "";
    file.shortName = config.value.ellipsisName(file.name);
  });

  files.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
};

const applyVersionCheck = () => {
  if (!config.value.versionComparison) {
    fileList.value.forEach((f) => (f.needUpgrade = true));
    return;
  }

  fileList.value.forEach((file) => {
    const cur = config.value.currentVersions.find(
      (v) => v.namingformat === file.rule && v.suffix === file.ext
    );
    if (!cur || !cur.version) {
      file.needUpgrade = true;
      file.curVersion = null;
    } else {
      file.curVersion = cur.version;
      file.needUpgrade =
        config.value.versionComparator(file.version, cur.version) > 0;
    }
  });
};

const autoSelectFiles = () => {
  if (config.value.defaultSelectAll) {
    checkedFiles.value = fileList.value.filter(
      (f) => f.hitRule && f.needUpgrade
    );
  } else {
    checkedFiles.value = [];
  }
  emitFilesSelected();
};

// ==================== 选择管理 ====================
const toggleFileCheck = (file) => {
  if (file.needUpgrade === false) return;
  const i = checkedFiles.value.indexOf(file);
  i === -1 ? checkedFiles.value.push(file) : checkedFiles.value.splice(i, 1);
  emitFilesSelected();
};

const toggleSelectAll = () => {
  const available = displayFiles.value.filter((f) => f.needUpgrade !== false);
  if (!available.length) return;
  const allChecked = available.every((f) => checkedFiles.value.includes(f));
  if (allChecked) {
    checkedFiles.value = checkedFiles.value.filter(
      (f) => !available.includes(f)
    );
  } else {
    checkedFiles.value.push(
      ...available.filter((f) => !checkedFiles.value.includes(f))
    );
  }
  emitFilesSelected();
};

// ==================== 事件发射 ====================
const emitFilesReady = () => {
  emit("files-ready", {
    FilesAll: fileList.value,
    SelectedFiles: processedFiles.value,
    RawZip: uploadedZip.value,
  });
};

const emitFilesSelected = () => {
  emit("files-selected", {
    SelectedFiles: processedFiles.value,
    SelectedCount: checkedFiles.value.length,
    TotalCount: fileList.value.length,
  });
};

const emitError = (msg) => emit("error", msg);

// ==================== 工具方法 ====================
const clearAll = () => {
  fileList.value = [];
  checkedFiles.value = [];
  zipInstance.value = null;
  uploadedZip.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";
  emit("close");
};

const getFileBinary = async (name) => {
  const file = fileList.value.find((f) => f.name === name);
  return file?.entry ? await file.entry.async("uint8array") : null;
};

const getAllSelectedBinary = async () => {
  const result = {};
  for (const file of checkedFiles.value) {
    if (file.entry) result[file.name] = await file.entry.async("uint8array");
  }
  return result;
};

// ==================== 暴露方法 ====================
defineExpose({
  clearAll,
  refresh: () => {
    applyRulesAndSort(fileList.value);
    applyVersionCheck();
    autoSelectFiles();
  },
  getSelectedFiles: () => processedFiles.value,
  getFileBinary,
  getAllSelectedBinary,
  closePanel: clearAll,
  fileCount: computed(() => fileList.value.length),
  selectedCount: computed(() => checkedFiles.value.length),
  hasFiles,
  hasSelected: computed(() => checkedFiles.value.length > 0),
  getConfig: () => config.value,
});

// ==================== 监听 ====================
watch(
  () => config.value.caseSensitive,
  () => {
    applyRulesAndSort(fileList.value);
    applyVersionCheck();
    autoSelectFiles();
  }
);

onUnmounted(clearAll);
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

    p {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-right: 40px;
    }

    .upload-icon {
      width: auto;
      height: 100%;
      margin-right: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .default-icon {
      width: 20px;
      height: 20px;
      min-width: 20px;
      min-height: 20px;

      > * {
        width: 100%;
        height: 100%;
      }
    }

    .file-input {
      position: absolute;
      top: -24px;
      left: 0;
      width: 100%;
      height: calc(100% + 24px);
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

  .delete-icon {
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

    .default-icon {
      width: 16px;
      height: 16px;
      min-width: 16px;
      min-height: 16px;

      > * {
        width: 100%;
        height: 100%;
      }
    }
  }

  .delete-icon:hover,
  .delete-icon:active {
    opacity: 0.5;
  }
}

.file-section {
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
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
}
</style>
