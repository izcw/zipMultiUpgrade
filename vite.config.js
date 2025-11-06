// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import VitePluginCssInjectedByJs from 'vite-plugin-css-injected-by-js'

let visualizer
try {
  visualizer = (await import('rollup-plugin-visualizer')).visualizer
} catch {
  visualizer = null
}

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  if (isLib) {
    return {
      plugins: [
        vue(),
        VitePluginCssInjectedByJs(),
        process.env.ANALYZE && visualizer
          ? visualizer({ open: true, gzipSize: true, filename: 'dist/stats.html' })
          : null
      ].filter(Boolean),

      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      },

      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.js'),
          name: 'ZipMultiUpgrade',
          formats: ['es'],
          fileName: () => 'index.js'
        },

        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            passes: 5,
            pure_funcs: ['console.log', 'console.info'],
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            unsafe_proto: true
          },
          mangle: {
            toplevel: true
          },
          format: {
            comments: false,
            beautify: false,
            semicolons: false,
            braces: false,
            indent_level: 0,
            ascii_only: true,
            quote_style: 3
          }
        },

        rollupOptions: {
          external: ['vue', 'jszip'],
          output: {
            compact: true,
            assetFileNames: (assetInfo) => {
              return assetInfo.name === 'style.css' ? 'index.css' : assetInfo.name
            }
          },
          treeshake: { moduleSideEffects: false }
        },

        emptyOutDir: false, // 监听更快
        outDir: 'dist',
        sourcemap: false,
        reportCompressedSize: true
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