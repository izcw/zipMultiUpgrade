// lib-entry.js
import { UpgradePackage,ProgressLog } from '@/index.js'

const components = [UpgradePackage,ProgressLog]

// 定义 install 方法
const install = (app, options = {}) => {
  components.forEach(component => {
    app.component(component.component.name, component.component)
  })
  
  // 全局配置
  if (options.config) {
    app.config.globalProperties.$upgradePackageConfig = options.config
  }
}

// 自动注册
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

// 只使用命名导出，避免混合导出
export {
  install,
  UpgradePackage,
  ProgressLog
}

// 默认导出 install 方法，符合 Vue 插件标准
export default install