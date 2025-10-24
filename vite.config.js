import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  
  if (isLib) {
    return {
      plugins: [vue()],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        },
      },
      build: {
        lib: {
          // 直接使用 src/index.js 作为入口
          entry: resolve(__dirname, 'src/index.js'),
          name: 'UpgradePackageManager',
          fileName: (format) => `upgrade-package-manager.${format}.js`,
          formats: ['es', 'umd', 'cjs']
        },
        rollupOptions: {
          // 外部化依赖
          external: ['vue', 'jszip'],
          output: {
            globals: {
              vue: 'Vue',
              jszip: 'JSZip'
            },
            exports: 'named',
            // 确保 CSS 也被打包
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') return 'upgrade-package-manager.css'
              return assetInfo.name
            }
          }
        },
        emptyOutDir: true,
        outDir: 'dist',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          format: {
            comments: false
          }
        },
        // 生成源映射
        sourcemap: true
      }
    }
  } else {
    return {
      plugins: [vue()],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        },
      },
      build: {
        // 开发模式构建配置
        sourcemap: true
      }
    }
  }
})