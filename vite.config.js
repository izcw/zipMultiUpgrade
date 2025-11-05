import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
// 可选：仅在已安装 visualizer 时启用
let visualizer
try {
  visualizer = require('rollup-plugin-visualizer').visualizer
} catch {
  visualizer = null
}

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  if (isLib) {
    return {
      plugins: [
        vue(),
        process.env.ANALYZE && visualizer
          ? visualizer({
              open: true,
              gzipSize: true,
              filename: 'dist/stats.html'
            })
          : null
      ].filter(Boolean),

      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      },

      optimizeDeps: {
        include: ['jszip']
      },

      css: {
        postcss: {
          plugins: [autoprefixer(), cssnano({ preset: 'default' })]
        }
      },

      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.js'),
          name: 'ZipMultiUpgrade',
          formats: ['es'],
          fileName: () => 'index.js' // ✅ 输出 index.js
        },

        rollupOptions: {
          external: ['vue', 'jszip'],
          output: {
            assetFileNames: 'index.css',
            compact: true
          },
          treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false
          }
        },

        emptyOutDir: true,
        outDir: 'dist',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            passes: 3,
            booleans_as_integers: true,
            unsafe: true
          },
          format: { comments: false },
          mangle: { properties: { regex: /^_/ } }
        },
        sourcemap: false
      }
    }
  } else {
    return {
      plugins: [vue()],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      },
      build: { sourcemap: true }
    }
  }
})
