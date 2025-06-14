import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/constants/ipcChannels'
import type { IApiResponse, IPaginationParams, IPaginationResponse } from '@shared/types/common'

/**
 * 安全的API接口，暴露给渲染进程
 */
const electronAPI = {
  // 系统相关
  system: {
    getVersion: (): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_VERSION),
    minimize: (): void =>
      ipcRenderer.send(IPC_CHANNELS.SYSTEM_MINIMIZE),
    maximize: (): void =>
      ipcRenderer.send(IPC_CHANNELS.SYSTEM_MAXIMIZE),
    close: (): void =>
      ipcRenderer.send(IPC_CHANNELS.SYSTEM_CLOSE)
  },

  // 合同管理
  contract: {
    getList: (params: IPaginationParams): Promise<IApiResponse<IPaginationResponse<any>>> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONTRACT_GET_LIST, params),
    getDetail: (id: number): Promise<IApiResponse<any>> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONTRACT_GET_DETAIL, id),
    updateProject: (contractId: number, projectId: number): Promise<IApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONTRACT_UPDATE_PROJECT, contractId, projectId)
  },

  // 项目管理
  project: {
    getList: (params?: IPaginationParams): Promise<IApiResponse<IPaginationResponse<any>>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_LIST, params),
    create: (project: any): Promise<IApiResponse<any>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_CREATE, project),
    update: (id: number, project: any): Promise<IApiResponse<any>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_UPDATE, id, project),
    delete: (id: number): Promise<IApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_DELETE, id)
  },

  // 数据导入
  import: {
    selectFiles: (): Promise<IApiResponse<string[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_SELECT_FILES),
    start: (filePaths: string[], settings?: any): Promise<IApiResponse<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_START, filePaths, settings),
    getProgress: (importId: string): Promise<IApiResponse<any>> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_GET_PROGRESS, importId),
    parseFile: (filePath: string): Promise<IApiResponse<any>> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PARSE_FILE, filePath),
    clearProgress: (importId: string): Promise<IApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_CLEAR_PROGRESS, importId),
    getAllProgress: (): Promise<IApiResponse<any[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_GET_ALL_PROGRESS),
    clearProgressByFile: (filePath: string): Promise<IApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_CLEAR_PROGRESS_BY_FILE, filePath)
  },

  // 字段管理
  field: {
    getConfig: (): Promise<IApiResponse<any[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FIELD_GET_CONFIG),
    updateConfig: (config: any[]): Promise<IApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FIELD_UPDATE_CONFIG, config),
    syncColumns: (): Promise<IApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FIELD_SYNC_COLUMNS),
    importJson: (filePath: string): Promise<IApiResponse<any[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FIELD_IMPORT_JSON, filePath),
    exportJson: (data: any[], type: string): Promise<IApiResponse<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FIELD_EXPORT_JSON, data, type)
  },

  // 文件操作
  file: {
    exportJson: (data: any[], type: string, fileName?: string): Promise<IApiResponse<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FILE_EXPORT_JSON, data, type, fileName),
    importJson: (filePath: string): Promise<IApiResponse<any[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FILE_IMPORT_JSON, filePath),
    selectImport: (): Promise<IApiResponse<string[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FILE_SELECT_IMPORT),
    selectExportDir: (): Promise<IApiResponse<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.FILE_SELECT_EXPORT_DIR)
  },

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void): void => {
    ipcRenderer.on(channel, callback)
  },

  // 移除事件监听
  off: (channel: string, callback: (...args: any[]) => void): void => {
    ipcRenderer.removeListener(channel, callback)
  },

  // 通用IPC调用方法
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    return ipcRenderer.invoke(channel, ...args)
  }
}

// 类型定义
export type ElectronAPI = typeof electronAPI

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 声明全局类型
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
