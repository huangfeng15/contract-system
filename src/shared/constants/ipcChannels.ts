/**
 * IPC通道常量定义
 * 用于主进程和渲染进程之间的通信
 */
export const IPC_CHANNELS = {
  // 合同管理
  CONTRACT_GET_LIST: 'contract:getList',
  CONTRACT_GET_DETAIL: 'contract:getDetail',
  CONTRACT_UPDATE_PROJECT: 'contract:updateProject',
  CONTRACT_FIND_ALL: 'contract:findAll',
  CONTRACT_DELETE_BY_FILE_PATH: 'contract:deleteByFilePath',

  // 项目管理
  PROJECT_GET_LIST: 'project:getList',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',

  // 数据导入
  IMPORT_SELECT_FILES: 'import:selectFiles',
  IMPORT_START: 'import:start',
  IMPORT_GET_PROGRESS: 'import:getProgress',
  IMPORT_PARSE_FILE: 'import:parseFile',
  IMPORT_CLEAR_PROGRESS: 'import:clearProgress',
  IMPORT_GET_ALL_PROGRESS: 'import:getAllProgress',
  IMPORT_CLEAR_PROGRESS_BY_FILE: 'import:clearProgressByFile',

  // 采购管理
  PROCUREMENT_FIND_ALL: 'procurement:findAll',
  PROCUREMENT_DELETE_BY_FILE_PATH: 'procurement:deleteByFilePath',

  // 字段管理
  FIELD_GET_CONFIG: 'field:getConfig',
  FIELD_UPDATE_CONFIG: 'field:updateConfig',
  FIELD_SYNC_COLUMNS: 'field:syncColumns',
  FIELD_IMPORT_JSON: 'field:importJson',
  FIELD_EXPORT_JSON: 'field:exportJson',

  // 文件操作
  FILE_EXPORT_JSON: 'file:exportJson',
  FILE_IMPORT_JSON: 'file:importJson',
  FILE_SELECT_IMPORT: 'file:selectImport',
  FILE_SELECT_EXPORT_DIR: 'file:selectExportDir',

  // 系统相关
  SYSTEM_GET_VERSION: 'system:getVersion',
  SYSTEM_MINIMIZE: 'system:minimize',
  SYSTEM_MAXIMIZE: 'system:maximize',
  SYSTEM_CLOSE: 'system:close'
} as const

export type IpcChannelType = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]
