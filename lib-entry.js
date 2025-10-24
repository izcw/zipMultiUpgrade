// lib-entry.js
import { UpgradePackage } from './src/upgradePackage/install.js'

const components = [UpgradePackage]

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

export default {
  install,
  UpgradePackage
}

export { UpgradePackage }