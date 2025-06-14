/**
 * 数据库相关类型定义
 */

// 基础数据库实体接口
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// 项目表接口
export interface Project extends BaseEntity {
  projectCode: string;
  projectName: string;
  projectAlias?: string; // 支持逗号分隔多个别名
  description?: string;
}



// 合同数据表接口（融入文件信息）
export interface Contract extends BaseEntity {
  projectId?: number;
  contractNumber?: string;

  // 原始数据
  data: string; // JSON字符串
  processedData?: string; // JSON字符串

  // 文件信息（原worksheets表信息）
  filePath: string;
  fileName: string;
  fileSize?: number;
  fileHash?: string;
  sheetName: string;

  // 处理状态
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  errorRows: number;

  // 匹配和验证
  matchScore: number;
  isVerified: boolean;
  hasErrors: boolean;
  errorInfo?: string; // JSON字符串
  processingLog?: string; // JSON字符串
}

// 采购数据表接口（融入文件信息）
export interface Procurement extends BaseEntity {
  projectId?: number;
  procurementNumber?: string;

  // 原始数据
  data: string; // JSON字符串
  processedData?: string; // JSON字符串

  // 文件信息（原worksheets表信息）
  filePath: string;
  fileName: string;
  fileSize?: number;
  fileHash?: string;
  sheetName: string;

  // 处理状态
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  errorRows: number;

  // 匹配和验证
  matchScore: number;
  isVerified: boolean;
  hasErrors: boolean;
  errorInfo?: string; // JSON字符串
  processingLog?: string; // JSON字符串
}



// 数据库连接配置接口
export interface DatabaseConfig {
  dbPath: string;
  encryptionKey?: string;
  maxConnections?: number;
  timeout?: number;
  busyTimeout?: number;
  cacheSize?: number;
  pageSize?: number;
  journalMode?: string;
  synchronous?: string;
}

// 数据库迁移接口
export interface Migration {
  version: number;
  description: string;
  up: string[];
  down: string[];
}

// 查询选项接口
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: Record<string, any>;
}

// 分页结果接口
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 事务回调接口
export interface TransactionCallback<T> {
  (db: any): T;
}

// 数据库操作结果接口
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
  insertId?: number;
}

// 备份配置接口
export interface BackupConfig {
  backupPath: string;
  retentionDays: number;
  autoBackup: boolean;
  interval: number;
}

// 数据验证规则接口
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

// 字段验证配置接口
export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

// 数据库统计信息接口
export interface DatabaseStats {
  tableCount: number;
  totalRecords: number;
  databaseSize: number;
  lastBackup?: string;
  version: number;
}

// 项目统计信息接口
export interface ProjectStats {
  id: number;
  projectCode: string;
  projectName: string;
  contractCount: number;
  procurementCount: number;
  lastContractDate?: string;
}

// 导入统计信息接口
export interface ImportStats {
  totalFiles: number;
  totalWorksheets: number;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  lastImportDate?: string;
}

// 错误信息接口
export interface ErrorInfo {
  code: string;
  message: string;
  field?: string;
  value?: any;
  timestamp: string;
}

// 处理日志接口
export interface ProcessingLog {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  details?: any;
}

// 匹配字段信息接口
export interface MatchedField {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  dataType: string;
}

// 数据清洗规则接口
export interface DataCleaningRule {
  field: string;
  rules: {
    trim?: boolean;
    toLowerCase?: boolean;
    toUpperCase?: boolean;
    removeSpecialChars?: boolean;
    dateFormat?: string;
    numberFormat?: string;
    replacePatterns?: Array<{ pattern: string; replacement: string }>;
  };
}

// 项目匹配配置接口
export interface ProjectMatchConfig {
  nameWeight: number;
  aliasWeight: number;
  threshold: number;
  fuzzyMatch: boolean;
  ignoreCase: boolean;
}

// 数据库事件接口
export interface DatabaseEvent {
  type: 'insert' | 'update' | 'delete' | 'backup' | 'migration';
  table: string;
  recordId?: number;
  timestamp: string;
  details?: any;
}

// 数据库监听器接口
export interface DatabaseListener {
  (event: DatabaseEvent): void;
}
