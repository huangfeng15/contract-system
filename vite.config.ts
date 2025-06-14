import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // 主进程入口文件
        entry: 'src/main/main.ts',
        onstart(options) {
          if (options.startup) {
            options.startup()
          }
        },
        vite: {
          build: {
            sourcemap: true,
            minify: false,
            outDir: 'dist-electron/main',
            lib: {
              entry: 'src/main/main.ts',
              formats: ['cjs'],
              fileName: 'main'
            },
            rollupOptions: {
              external: ['electron', 'better-sqlite3']
            }
          },
          resolve: {
            alias: {
              '@shared': resolve(__dirname, 'src/shared'),
              '@main': resolve(__dirname, 'src/main'),
              '@renderer': resolve(__dirname, 'src/renderer')
            }
          }
        }
      },
      {
        // 预加载脚本
        entry: 'src/main/preload.ts',
        onstart(options) {
          // 通知渲染进程重新加载页面
          options.reload()
        },
        vite: {
          build: {
            sourcemap: 'inline',
            minify: false,
            outDir: 'dist-electron/preload',
            lib: {
              entry: 'src/main/preload.ts',
              formats: ['cjs'],
              fileName: 'preload'
            },
            rollupOptions: {
              external: ['electron']
            }
          },
          resolve: {
            alias: {
              '@shared': resolve(__dirname, 'src/shared'),
              '@main': resolve(__dirname, 'src/main'),
              '@renderer': resolve(__dirname, 'src/renderer')
            }
          }
        }
      }
    ]),
    // 使用Node.js API在渲染进程中
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer')
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
})
