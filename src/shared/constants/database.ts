/**
 * 数据库配置常量
 * 遵循开发规范：严禁硬编码，所有配置通过常量管理
 */

// 数据库配置
export const DATABASE_CONFIG = {
  // 数据库文件名
  DB_NAME: 'contracts.db',

  // 数据库版本
  DB_VERSION: 3,

  // 连接配置
  CONNECTION: {
    MAX_CONNECTIONS: 5,
    TIMEOUT: 10000,
    BUSY_TIMEOUT: 5000,
  },

  // 加密配置
  ENCRYPTION: {
    KEY_LENGTH: 32,
    DEFAULT_KEY: 'dev-encryption-key-32-characters',
  },

  // 备份配置
  BACKUP: {
    INTERVAL: 86400000, // 24小时
    RETENTION_DAYS: 7,
    AUTO_BACKUP: true,
  },

  // 性能配置
  PERFORMANCE: {
    CACHE_SIZE: 2000,
    PAGE_SIZE: 4096,
    JOURNAL_MODE: 'WAL',
    SYNCHRONOUS: 'NORMAL',
  },
} as const;

// 表名常量
export const TABLE_NAMES = {
  PROJECTS: 'projects',
  CONTRACTS: 'contracts',
  PROCUREMENTS: 'procurements',
} as const;

// 项目状态常量
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

// 数据类型常量
export const DATA_TYPES = {
  CONTRACT: 'contract',
  PROCUREMENT: 'procurement',
} as const;

// 处理状态常量
export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;



// SQL查询常量
export const SQL_QUERIES = {
  // 检查表是否存在
  CHECK_TABLE_EXISTS: `
    SELECT name FROM sqlite_master
    WHERE type='table' AND name=?
  `,
} as const;

// 错误消息常量
export const DB_ERROR_MESSAGES = {
  CONNECTION_FAILED: '数据库连接失败',
  TABLE_NOT_EXISTS: '数据表不存在',
  MIGRATION_FAILED: '数据库迁移失败',
  BACKUP_FAILED: '数据库备份失败',
  VALIDATION_FAILED: '数据验证失败',
  TRANSACTION_FAILED: '事务执行失败',
} as const;
