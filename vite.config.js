import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
          entry: fileURLToPath(new URL('./lib-entry.js', import.meta.url)),
          name: 'UpgradePackageManager',
          fileName: (format) => `upgrade-package-manager.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          external: ['vue','jszip'],
          output: {
            globals: {
              vue: 'Vue',
              jszip: 'JSZip'
            },
            exports: 'named',
            compact: true
          }
        },
        emptyOutDir: true,
        outDir: 'dist',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
          },
          format: {
            comments: false
          }
        }
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
    }
  }
})