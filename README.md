### 打包

```sh
pnpm run build:lib
```

### 首先要登录npm
```sh
npm login
```

### 推送到npm
```sh
npm publish --access=public
```


### 本地调试

```sh
pnpm link
```

### 本地调试

```sh
pnpm link @izcw404/upgrade-package-manager
```

### 本地调试

```sh
pnpm run build:watch
```


```javascript
<template>
    <div class="app">
        <h1>Firmware upgrade</h1>

        <!-- 文件处理 -->
        <UpgradePackage :config="config" @files-ready="onFilesReady" @files-selected="onFilesSelected"
            @panel-closed="onPanelClosed" @error="onError" ref="upgradePackageRef" />

        <!-- 控制 -->
        <div class="upgrade-controls">
            <button @click="startUpgrade" :disabled="!canUpgrade">
                开始升级 ({{ selectedFiles.length }})
            </button>
            <button @click="checkFiles">检查文件</button>
        </div>

        <hr>
        <!-- 日志 -->
        <ProgressLog v-if="showProgressLog" :files="upgradeFiles" :upgrade-function="useMockUpgrade" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UpgradePackage, ProgressLog } from '@izcw404/upgrade-package-manager'

const upgradePackageRef = ref(null)
const selectedFiles = ref([])

// 统一配置对象
const config = ref({
    // 选择配置
    defaultSelectAll: true, // 是否默认全选
    caseSensitive: true, // 是否区分大小写

    // 文件过滤配置
    showExceptFiles: true, // 是否显示被排除的文件
    sortCheckedFiles: true,

    // 版本配置
    versionComparison: true, // 是否开启版本比较
    showLowVersion: true, // 是否显示低版本文件

    // 版本过滤配置
    currentVersions: [
        { suffix: 'BIN', namingformat: 'SWITCH', version: '1.1.0' },
        { suffix: 'APP', namingformat: 'MCU', version: '1.1.4' }
    ],

    // zip压缩包文件大小限制
    maxFileSize: 10 * 1024 * 1024, // 10MB

    // 自定义优先级规则
    priorityRules: [
        { suffix: 'BIN', namingformat: 'SWITCH', min: 0, max: 819200, cmd: 'SWITCH-CMD' },
        { suffix: 'APP', namingformat: 'MCU', cmd: 'RxConnect' },
        { suffix: 'BIN', namingformat: 'EDID', cmd: 'BOOT-CMD' },
    ],

    // 自定义解析规则
    parseRuleAndVersion: (fileName) => {
        // 自定义解析逻辑
        const segs = fileName.replace(/\.[A-Za-z0-9]{1,5}$/i, '').split('_')
        const rule = segs.at(-1)?.toUpperCase() || 'UNKNOWN'
        const vSeg = segs.at(-2)
        const version = vSeg?.match(/^v?(\d+\.\d+\.\d+)$/i)?.[1] || null
        const suffix = fileName.split('.').pop().toUpperCase()
        return { rule, version, suffix }
    }
})

const canUpgrade = computed(() => selectedFiles.value.length > 0)

// 事件处理
const onFilesReady = (data) => {
    console.log('文件已处理完成:', data)
    selectedFiles.value = data.selectedFiles || []
}

const onFilesSelected = (data) => {
    console.log('文件选择变化:', data)
    selectedFiles.value = data.selectedFiles
}

const onPanelClosed = () => {
    console.log('文件面板已关闭')
    selectedFiles.value = []
}

const onError = (errorMsg) => {
    console.error('组件错误:', errorMsg)
    alert(`错误: ${errorMsg}`)
}

// 升级操作
const showProgressLog = ref(false);
const upgradeFiles = ref([])
const startUpgrade = async () => {
    if (!selectedFiles.value.length) return

    const fileBinaries = await upgradePackageRef.value.getAllSelectedFilesBinary()
    console.log("点击升级按钮，获取到的文件二进制数据:", fileBinaries);



    showProgressLog.value = true;
    upgradeFiles.value = upgradePackageRef.value.getSelectedFiles()
}

const checkFiles = () => {
    const files = upgradePackageRef.value.getSelectedFiles()
    console.log('选中的文件详情:', files)
}


function useMockUpgrade() {
  const SUCCESS_RATE = 0.8

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.floor(bytes / Math.pow(k, i)) + ' ' + sizes[i]
  }

  const mockApiCall = async (url, body) => {
    console.log('[Mock API]', url, body)
    await sleep(100 + Math.random() * 200)
    if (Math.random() < 0.05) throw new Error(`网络错误：${url}`)
    return { ok: true }
  }

  const simulateProgress = async (logFn, progressFn) => {
    const totalTime = 1500 + Math.random() * 1000
    let elapsed = 0
    const stepMs = 200
    let jd = '| → '
    while (elapsed < totalTime) {
      await sleep(stepMs)
      elapsed += stepMs
      const percentage = Math.floor((elapsed / totalTime) * 100)
      progressFn(percentage)
      logFn(`${jd}进度：${percentage}%`)
    }
    
    progressFn(100)
    logFn(`${jd}进度：100%`)
  }

  const mockSingleFileUpgrade = async (file, fileIndex, totalFiles, logFn, progressFn) => {
    const startTime = Date.now()
    
    try {
      logFn(`+ (${fileIndex + 1}/${totalFiles}) 开始处理: ${file.name}`)
      logFn(`+ 版本：${file.version || '-'}　大小：${formatSize(file.size)}　规则：${file.rule}　命令：${file.cmd}`)

      // 重置当前文件进度为0
      progressFn(0)

      logFn('→ 1.发送 reboot')
      await mockApiCall('/api/reboot', {})
      await sleep(800)

      logFn(`→ 2.发送升级命令：${file.cmd}`)
      await mockApiCall('/api/cmd', { cmd: file.cmd })
      await sleep(600)

      logFn('→ 3.上传文件中...')
      await sleep(800 + Math.random() * 400)
      await mockApiCall('/api/upload', { name: file.name, size: file.size })

      logFn('→ 4.轮询进度...')
      await simulateProgress(logFn, progressFn)

      const success = Math.random() > (1 - SUCCESS_RATE)
      if (!success) throw new Error('后端返回升级失败')

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      logFn(`✓ 文件 ${fileIndex + 1} 升级成功，耗时 ${duration} 秒`)
      return true

    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      logFn(`✗ 文件 ${fileIndex + 1} 升级失败：${error.message}，耗时 ${duration} 秒`)
      return false
    }
  }

  return { mockSingleFileUpgrade }
}
</script>

```