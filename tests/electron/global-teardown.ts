import { FullConfig } from '@playwright/test'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

/**
 * Playwright Electron测试全局清理
 * 在所有测试结束后执行，清理测试环境
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始Electron测试环境清理...')

  try {
    // 清理测试数据库文件
    await cleanupTestDatabase()

    // 清理临时文件
    await cleanupTempFiles()

    // 重置环境变量
    delete process.env.NODE_ENV
    delete process.env.DB_PATH
    delete process.env.LOG_LEVEL
    delete process.env.ENABLE_DEV_TOOLS

    console.log('✅ Electron测试环境清理完成')
  } catch (error) {
    console.error('❌ Electron测试环境清理失败:', error)
    // 不抛出错误，避免影响测试结果报告
  }
}

/**
 * 清理测试数据库文件
 */
async function cleanupTestDatabase(): Promise<void> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')

    const testDbPath = path.resolve(__dirname, '../../test.db')

    try {
      await fs.access(testDbPath)
      await fs.unlink(testDbPath)
      console.log('✅ 测试数据库文件已清理')
    } catch (error) {
      // 文件不存在，无需清理
    }
  } catch (error) {
    console.warn('⚠️ 清理测试数据库时出错:', error)
  }
}

/**
 * 清理临时文件
 */
async function cleanupTempFiles(): Promise<void> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')

    const tempDir = path.resolve(__dirname, '../../temp')

    try {
      await fs.access(tempDir)
      await fs.rm(tempDir, { recursive: true, force: true })
      console.log('✅ 临时文件已清理')
    } catch (error) {
      // 目录不存在，无需清理
    }
  } catch (error) {
    console.warn('⚠️ 清理临时文件时出错:', error)
  }
}

export default globalTeardown
