import { FullConfig } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

/**
 * Playwright Electron测试全局设置
 * 在所有测试开始前执行，准备测试环境
 */

let electronProcess: ChildProcess | null = null

async function globalSetup(config: FullConfig) {
  console.log('🚀 开始Electron测试环境设置...')

  try {
    // 设置测试环境变量
    process.env.NODE_ENV = 'test'
    process.env.DB_PATH = ':memory:'
    process.env.LOG_LEVEL = 'error'
    process.env.ENABLE_DEV_TOOLS = 'false'

    console.log('✅ 环境变量设置完成')

    // 构建应用（如果需要）
    if (process.env.CI || !process.env.SKIP_BUILD) {
      console.log('🔨 构建Electron应用...')
      await buildElectronApp()
      console.log('✅ 应用构建完成')
    }

    // 等待一段时间确保所有资源准备就绪
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('✅ Electron测试环境设置完成')
  } catch (error) {
    console.error('❌ Electron测试环境设置失败:', error)
    throw error
  }
}

/**
 * 构建Electron应用
 */
async function buildElectronApp(): Promise<void> {
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: true,
      cwd: resolve(__dirname, '../..')
    })

    let stdout = ''
    let stderr = ''

    buildProcess.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    buildProcess.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('构建成功')
        resolve()
      } else {
        console.error('构建失败:', stderr)
        reject(new Error(`构建失败，退出码: ${code}`))
      }
    })

    buildProcess.on('error', (error) => {
      console.error('构建进程错误:', error)
      reject(error)
    })
  })
}

export default globalSetup
