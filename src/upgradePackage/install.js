// src/upgradePackage/install.js
import UpgradePackage from './index.vue'

// 定义 install 方法
const install = (app, options = {}) => {
  app.component('UpgradePackage', UpgradePackage)
  
  // 可以在这里提供全局配置
  if (options.config) {
    app.config.globalProperties.$upgradePackageConfig = options.config
  }
}

// 自动安装（当在浏览器环境中通过 script 标签引入时）
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

// 导出组件和 install 方法
export default {
  install,
  component: UpgradePackage
}

// 单独导出组件，支持按需引入
export { UpgradePackage }