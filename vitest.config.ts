import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',

    // 测试文件匹配模式
    include: [
      'tests/**/*.test.{js,ts}',
      'tests/**/*-test.{js,ts}',
      'tests/**/*.spec.{js,ts}'
    ],

    // 排除文件
    exclude: [
      'node_modules/**',
      'dist/**',
      'dist-electron/**',
      'build/**'
    ],

    // 测试超时时间
    testTimeout: 30000,
    hookTimeout: 30000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/main/services/**/*.ts',
        'src/main/database/**/*.ts',
        'src/main/ipc/**/*.ts'
      ],
      exclude: [
        'src/main/main.ts',
        'src/main/preload.ts',
        '**/*.d.ts',
        '**/node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },

    // 并发设置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },

    // 报告器配置
    reporter: ['verbose', 'json', 'html'],

    // 输出目录
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})
