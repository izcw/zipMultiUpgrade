import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  
  if (isLib) {
    return {
      plugins: [
        vue(),
        // 启用构建分析（建议仅在需要分析时启用，避免每次构建都打开）
        process.env.ANALYZE ? visualizer({
          open: true, // 打包完成后自动打开分析页面
          gzipSize: true, // 显示gzip后的大小
          filename: 'dist/stats.html' // 将分析报告输出到dist目录
        }) : null
      ].filter(Boolean), // 过滤掉为null的插件
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        },
      },
      // 新增：依赖预构建优化
      optimizeDeps: {
        include: ['jszip'] // 如果你的库源码中使用了jszip的ESM模块，可以在此预构建
      },
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.js'),
          name: 'ZipMultiUpgrade',
          formats: ['es'], // 仅输出ES模块格式，利于Tree-shaking
          fileName: () => 'zip-multi-upgrade.es.js'
        },
        rollupOptions: {
          external: ['vue', 'jszip'],
          output: {
            assetFileNames: 'index.css'
            // 可以考虑为chunk文件也命名
            // chunkFileNames: 'chunks/[name]-[hash].js',
          }
        },
        emptyOutDir: true,
        outDir: 'dist',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'] // 明确移除console.log，即使忘记删除console也行
          },
          format: {
            comments: false
          },
          // 新增：混淆选项，可进一步减小体积
          mangle: {
            properties: false // 库模式不建议混淆属性名，以免影响外部使用
          }
        },
        sourcemap: true,
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