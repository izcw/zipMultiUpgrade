import { ref } from 'vue'

export function useMockUpgrade() {
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