import { test as base, expect } from '@playwright/test'
import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { resolve } from 'path'

/**
 * Electron测试夹具
 * 提供Electron应用实例和页面对象，用于集成测试和端到端测试
 */

export interface ElectronTestFixtures {
  electronApp: ElectronApplication
  page: Page
}

/**
 * 扩展的Playwright测试，包含Electron应用支持
 */
export const test = base.extend<ElectronTestFixtures>({
  electronApp: async ({}, use) => {
    console.log('🚀 启动Electron应用...')
    
    // 启动Electron应用
    const electronApp = await electron.launch({
      args: [resolve(__dirname, '../../../dist-electron/main/main.cjs')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DB_PATH: ':memory:',
        LOG_LEVEL: 'error',
        ENABLE_DEV_TOOLS: 'false'
      }
    })

    // 等待应用启动
    await electronApp.evaluate(async ({ app }) => {
      return app.whenReady()
    })

    console.log('✅ Electron应用启动成功')

    await use(electronApp)

    console.log('🔄 关闭Electron应用...')
    await electronApp.close()
    console.log('✅ Electron应用已关闭')
  },

  page: async ({ electronApp }, use) => {
    console.log('📄 获取Electron页面...')
    
    // 获取第一个窗口
    const page = await electronApp.firstWindow()
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded')
    
    // 设置页面超时
    page.setDefaultTimeout(10000)
    page.setDefaultNavigationTimeout(30000)

    console.log('✅ Electron页面准备就绪')

    await use(page)
  }
})

/**
 * 导出expect用于断言
 */
export { expect }

/**
 * 测试工具函数
 */
export class ElectronTestUtils {
  constructor(private page: Page, private electronApp: ElectronApplication) {}

  /**
   * 等待应用完全加载
   */
  async waitForAppReady(): Promise<void> {
    await this.page.waitForSelector('[data-testid="app-container"]', { timeout: 30000 })
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 导航到指定页面
   */
  async navigateToPage(route: string): Promise<void> {
    await this.page.evaluate((route) => {
      window.location.hash = route
    }, route)
    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * 等待数据加载完成
   */
  async waitForDataLoaded(): Promise<void> {
    // 等待加载指示器消失
    await this.page.waitForSelector('.el-loading-mask', { state: 'hidden', timeout: 10000 })
  }

  /**
   * 截图用于调试
   */
  async takeDebugScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/debug-${name}-${Date.now()}.png`,
      fullPage: true 
    })
  }

  /**
   * 获取控制台日志
   */
  async getConsoleLogs(): Promise<string[]> {
    return await this.page.evaluate(() => {
      // @ts-ignore
      return window.testLogs || []
    })
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData(): Promise<void> {
    await this.electronApp.evaluate(async ({ ipcMain }) => {
      // 通过IPC清理测试数据
      return new Promise((resolve) => {
        ipcMain.emit('test:cleanup-data')
        resolve(true)
      })
    })
  }

  /**
   * 重置应用状态
   */
  async resetAppState(): Promise<void> {
    await this.page.evaluate(() => {
      // 清理localStorage
      localStorage.clear()
      // 清理sessionStorage
      sessionStorage.clear()
    })
    
    // 重新加载页面
    await this.page.reload()
    await this.waitForAppReady()
  }

  /**
   * 模拟文件选择
   */
  async selectFile(selector: string, filePath: string): Promise<void> {
    const fileInput = this.page.locator(selector)
    await fileInput.setInputFiles(resolve(__dirname, filePath))
  }

  /**
   * 等待通知消息
   */
  async waitForNotification(message?: string): Promise<void> {
    if (message) {
      await this.page.waitForSelector(`.el-notification:has-text("${message}")`)
    } else {
      await this.page.waitForSelector('.el-notification')
    }
  }

  /**
   * 关闭所有通知
   */
  async closeAllNotifications(): Promise<void> {
    const notifications = this.page.locator('.el-notification .el-notification__closeBtn')
    const count = await notifications.count()
    
    for (let i = 0; i < count; i++) {
      await notifications.nth(i).click()
    }
  }
}

/**
 * 创建测试工具实例
 */
export function createTestUtils(page: Page, electronApp: ElectronApplication): ElectronTestUtils {
  return new ElectronTestUtils(page, electronApp)
}
