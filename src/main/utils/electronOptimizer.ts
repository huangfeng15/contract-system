/**
 * Electron优化工具
 * 减少启动错误和警告信息
 */

import { app } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'

export class ElectronOptimizer {

  /**
   * 优化Electron启动参数
   */
  public static optimizeCommandLine(): void {
    // GPU相关优化
    app.commandLine.appendSwitch('--disable-gpu-sandbox')
    app.commandLine.appendSwitch('--disable-software-rasterizer')
    app.commandLine.appendSwitch('--disable-gpu-process-crash-limit')
    app.commandLine.appendSwitch('--disable-dev-shm-usage')
    app.commandLine.appendSwitch('--no-sandbox')

    // 缓存相关优化
    app.commandLine.appendSwitch('--disable-gpu-memory-buffer-compositor-resources')
    app.commandLine.appendSwitch('--disable-gpu-memory-buffer-video-frames')
    app.commandLine.appendSwitch('--disable-features=VizDisplayCompositor')

    // 网络相关优化
    app.commandLine.appendSwitch('--disable-background-networking')
    app.commandLine.appendSwitch('--disable-background-timer-throttling')
    app.commandLine.appendSwitch('--disable-renderer-backgrounding')

    // 安全相关（开发环境）
    if (process.env.NODE_ENV === 'development') {
      app.commandLine.appendSwitch('--disable-web-security')
      app.commandLine.appendSwitch('--allow-running-insecure-content')
    }
  }

  /**
   * 设置缓存目录
   */
  public static setupCacheDirectory(): void {
    try {
      const cacheDir = join(tmpdir(), 'contract-management-cache')
      app.setPath('userData', cacheDir)
      app.setPath('cache', join(cacheDir, 'cache'))
      app.setPath('temp', join(cacheDir, 'temp'))
    } catch (error) {
      console.warn('设置缓存目录失败:', error)
    }
  }

  /**
   * 过滤控制台错误信息
   */
  public static filterConsoleErrors(): void {
    // 重写process.stderr.write来过滤Electron内部错误
    const originalStderrWrite = process.stderr.write

    process.stderr.write = function(chunk: any, encoding?: any, callback?: any): boolean {
      const message = chunk.toString()

      // 需要过滤的错误模式
      const shouldFilter =
        message.includes('disk_cache') ||
        message.includes('gpu_disk_cache') ||
        message.includes('Unable to move the cache') ||
        message.includes('Gpu Cache Creation failed') ||
        message.includes('Unable to create cache') ||
        message.includes('cache_util_win.cc') ||
        message.includes('Autofill.enable') ||
        message.includes('Autofill.setAddresses') ||
        message.includes('protocol_client.js') ||
        message.includes('network_change_notifier') ||
        message.includes('WSALookupServiceBegin failed') ||
        message.includes('devtools_app.html') ||
        message.includes('Unexpected token \'H\'')

      if (!shouldFilter) {
        return originalStderrWrite.call(this, chunk, encoding, callback)
      }

      // 对于过滤的错误，返回true但不输出
      if (typeof callback === 'function') {
        callback()
      }
      return true
    }

    // 同时过滤console.error
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ')

      const shouldFilter =
        message.includes('disk_cache') ||
        message.includes('gpu_disk_cache') ||
        message.includes('Unable to move the cache') ||
        message.includes('Gpu Cache Creation failed') ||
        message.includes('Unable to create cache') ||
        message.includes('Autofill.enable') ||
        message.includes('Autofill.setAddresses') ||
        message.includes('protocol_client.js')

      if (!shouldFilter) {
        originalConsoleError.apply(console, args)
      }
    }
  }

  /**
   * 设置进程错误处理
   */
  public static setupProcessErrorHandling(): void {
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error)
    })

    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason)
    })

    // 处理警告
    process.on('warning', (warning) => {
      // 过滤某些警告
      if (warning.name === 'DeprecationWarning' &&
          warning.message.includes('legacy-js-api')) {
        return // 忽略Sass警告
      }
      console.warn('进程警告:', warning)
    })
  }

  /**
   * 完整的Electron优化
   */
  public static optimize(): void {
    this.optimizeCommandLine()
    this.setupCacheDirectory()
    this.filterConsoleErrors()
    this.setupProcessErrorHandling()

    console.log('✅ Electron优化配置完成')
  }
}

/**
 * 获取优化的BrowserWindow配置
 */
export function getOptimizedWindowConfig(isDev: boolean) {
  return {
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev, // 开发环境禁用以减少错误
      allowRunningInsecureContent: isDev,
      experimentalFeatures: false,
      offscreen: false,
      devTools: isDev,
      // 禁用某些功能以减少错误
      plugins: false,
      java: false,
      webgl: false,
      // 缓存相关
      partition: isDev ? 'persist:dev' : 'persist:main'
    }
  }
}
