/**
 * 全局类型定义
 */

// Electron API 类型定义
interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>
  on: (channel: string, callback: (...args: any[]) => void) => void
  removeAllListeners: (channel: string) => void

  // 数据导入相关API
  import: {
    selectFiles: () => Promise<{ success: boolean; data?: string[]; error?: string; message?: string }>
    start: (filePaths: string[], settings?: any) => Promise<{ success: boolean; data?: string; error?: string; message?: string }>
    getProgress: (importId: string) => Promise<{ success: boolean; data?: any; error?: string; message?: string }>
    parseFile: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string; message?: string }>
    clearProgress: (importId: string) => Promise<{ success: boolean; data?: any; error?: string; message?: string }>
    getAllProgress: () => Promise<{ success: boolean; data?: any; error?: string; message?: string }>
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
