import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  
  if (isLib) {
    // 库模式配置
    return {
      plugins: [
        vue(),
        vueDevTools(),
      ],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        },
      },
      build: {
        lib: {
          entry: fileURLToPath(new URL('./lib-entry.js', import.meta.url)),
          name: 'UpgradePackageManager',
          fileName: (format) => `upgrade-package-manager.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          // 确保外部化处理那些你不想打包进库的依赖
          external: ['vue', 'element-plus', 'jszip'],
          output: {
            // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
            globals: {
              vue: 'Vue',
              'element-plus': 'ElementPlus',
              jszip: 'JSZip'
            },
            // 配置最小化
            compact: true
          }
        },
        // 清空输出目录
        emptyOutDir: true,
        // 输出目录
        outDir: 'dist'
      }
    }
  } else {
    // 开发模式配置
    return {
      plugins: [
        vue(),
        vueDevTools(),
      ],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        },
      },
    }
  }
})