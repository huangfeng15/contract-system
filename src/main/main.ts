import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { APP_CONFIG } from '@shared/constants/config'
import { initializeHandlers } from './ipc/handlers'
import { initializeDatabaseHandlers, cleanupDatabaseHandlers } from './ipc/databaseHandlers'
import { DatabaseInitializer } from './database/DatabaseInitializer'
import { ElectronOptimizer, getOptimizedWindowConfig } from './utils/electronOptimizer'

// 禁用安全警告
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// 应用Electron优化
ElectronOptimizer.optimize()

class Application {
  private mainWindow: BrowserWindow | null = null
  private isDev = process.env.NODE_ENV === 'development'
  private dbInitializer: DatabaseInitializer

  constructor() {
    this.dbInitializer = new DatabaseInitializer()
    this.init()
  }

  private async init(): Promise<void> {
    // 等待应用准备就绪
    await app.whenReady()

    // 初始化数据库
    await this.initializeDatabase()

    // 创建主窗口
    this.createMainWindow()

    // 设置IPC处理器
    initializeHandlers()

    // 清理可能存在的数据库处理器，然后重新初始化
    cleanupDatabaseHandlers()
    initializeDatabaseHandlers()

    // 设置应用事件监听
    this.setupAppEvents()
  }

  private createMainWindow(): void {
    // 获取优化的窗口配置
    const optimizedConfig = getOptimizedWindowConfig(this.isDev)

    // 创建浏览器窗口
    this.mainWindow = new BrowserWindow({
      width: APP_CONFIG.WINDOW.DEFAULT_WIDTH,
      height: APP_CONFIG.WINDOW.DEFAULT_HEIGHT,
      minWidth: APP_CONFIG.WINDOW.MIN_WIDTH,
      minHeight: APP_CONFIG.WINDOW.MIN_HEIGHT,
      show: false,
      autoHideMenuBar: true,
      icon: join(__dirname, '../../build/icon.png'),
      webPreferences: {
        preload: join(__dirname, '../preload/preload.cjs'),
        ...optimizedConfig.webPreferences
      }
    })

    // 加载应用
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:3000')
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
    }

    // 窗口准备好后显示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()

      if (this.isDev) {
        this.mainWindow?.webContents.openDevTools()
      }
    })

    // 窗口关闭事件
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  private setupAppEvents(): void {
    // 所有窗口关闭时退出应用 (macOS除外)
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // 应用激活时创建窗口 (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow()
      }
    })

    // 应用退出前清理
    app.on('before-quit', () => {
      // 清理资源
      this.cleanup()
    })
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log('开始初始化数据库...')
      const result = await this.dbInitializer.initialize()

      if (result.success) {
        console.log('数据库初始化成功')
      } else {
        console.error('数据库初始化失败:', result.error)
        // 显示错误对话框
        const { dialog } = require('electron')
        await dialog.showErrorBox(
          '数据库初始化失败',
          `应用无法启动，数据库初始化失败：\n${result.error}`
        )
        app.quit()
      }
    } catch (error) {
      console.error('数据库初始化异常:', error)
      // 显示错误对话框
      const { dialog } = require('electron')
      await dialog.showErrorBox(
        '数据库初始化异常',
        `应用无法启动，数据库初始化异常：\n${error}`
      )
      app.quit()
    }
  }

  private cleanup(): void {
    // 清理数据库IPC监听器
    cleanupDatabaseHandlers()

    // 清理其他IPC监听器
    ipcMain.removeAllListeners()

    // 关闭数据库连接
    try {
      const dbManager = (this.dbInitializer as any).dbManager
      if (dbManager) {
        dbManager.close()
      }
    } catch (error) {
      console.error('关闭数据库连接失败:', error)
    }

    console.log('Application cleanup completed')
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }
}

// 创建应用实例
const application = new Application()

// 导出应用实例供其他模块使用
export { application }
