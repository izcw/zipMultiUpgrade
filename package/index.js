// package/index.js
import UpgradePackage from '@/components/UpgradePackage/index.vue'
import ProgressLog from '@/components/ProgressLog/index.vue'

const components = [
  UpgradePackage,
  ProgressLog
]

// 定义 install 方法
const install = function(Vue) {
  components.forEach(component => {
    Vue.component(component.name, component)
  })
}

// 自动注册
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default {
  install,
  UpgradePackage,
  ProgressLog
}