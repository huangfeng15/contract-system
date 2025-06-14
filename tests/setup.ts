/**
 * 测试环境设置文件
 * 在所有测试运行前执行的全局设置
 */

import { vi } from 'vitest'
import fs from 'fs'
import path from 'path'

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.TEST_MODE = 'true'

// 创建测试目录
const testDirs = [
  './test-results',
  './coverage',
  './tests/temp'
]

testDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Mock Electron相关模块
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => './tests/temp'),
    getName: vi.fn(() => 'test-app'),
    getVersion: vi.fn(() => '1.0.0')
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn()
  },
  BrowserWindow: vi.fn(() => ({
    loadFile: vi.fn(),
    webContents: {
      send: vi.fn()
    }
  }))
}))

// Mock 文件系统操作
const originalWriteFileSync = fs.writeFileSync
const originalReadFileSync = fs.readFileSync

// 全局测试配置
global.testConfig = {
  timeout: 30000,
  retryCount: 3,
  tempDir: './tests/temp',
  testDbPath: './tests/temp/test.db'
}

// 测试前清理
beforeAll(() => {
  console.log('🧪 开始测试环境初始化...')
  
  // 清理临时文件
  const tempDir = './tests/temp'
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
  fs.mkdirSync(tempDir, { recursive: true })
  
  console.log('✅ 测试环境初始化完成')
})

// 测试后清理
afterAll(() => {
  console.log('🧹 开始测试环境清理...')
  
  // 清理临时文件
  const tempDir = './tests/temp'
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
  
  console.log('✅ 测试环境清理完成')
})

// 扩展expect匹配器
expect.extend({
  toBeValidDatabaseResult(received) {
    const pass = received && 
                 typeof received === 'object' && 
                 typeof received.success === 'boolean'
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid database result`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid database result with success property`,
        pass: false
      }
    }
  },
  
  toHaveValidId(received) {
    const pass = received && 
                 received.id && 
                 (typeof received.id === 'number' || typeof received.id === 'string')
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have a valid id`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to have a valid id property`,
        pass: false
      }
    }
  }
})

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

console.log('📋 测试设置文件加载完成')
