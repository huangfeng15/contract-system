/**
 * 应用配置常量
 */
export const APP_CONFIG = {
  // 应用信息
  APP_NAME: '采购合同管理系统',
  APP_VERSION: '1.0.0',
  
  // 窗口配置
  WINDOW: {
    MIN_WIDTH: 1200,
    MIN_HEIGHT: 800,
    DEFAULT_WIDTH: 1400,
    DEFAULT_HEIGHT: 900
  },
  
  // 数据库配置
  DATABASE: {
    NAME: 'contract_management.db',
    BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时
    MAX_CONNECTIONS: 10,
    TIMEOUT: 30000
  },
  
  // 文件处理配置
  FILE: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_EXTENSIONS: ['.xlsx', '.xls'],
    UPLOAD_DIR: 'uploads'
  },
  
  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
  },
  
  // UI配置
  UI: {
    THEME: 'light',
    LANGUAGE: 'zh-CN',
    TABLE_HEIGHT: 'auto'
  }
} as const
