// src\index.js
import UpgradePackage from '@/components/UpgradePackage/index.vue'
import ProgressLog from '@/components/ProgressLog/index.vue'

// 定义 install 方法
const install = (app, options = {}) => {
  app.component('UpgradePackage', UpgradePackage)
  app.component('ProgressLog', ProgressLog)
  
  // 可以在这里提供全局配置
  if (options.config) {
    app.config.globalProperties.$upgradePackageConfig = options.config
  }
}

// 自动安装（当在浏览器环境中通过 script 标签引入时）
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

// 命名导出
export {
  install,
  UpgradePackage,
  ProgressLog
}

// 默认导出组件
export default UpgradePackage