/**
 * 数据导入相关类型定义
 */

export interface ImportFile {
  id: string;
  name: string;
  path: string;
  size: number;
  sheetCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface WorksheetInfo {
  id: string;
  fileId: string;
  sheetName: string;
  sheetType: 'contract' | 'procurement' | 'unknown';
  totalRows: number;
  dataRows: number;
  headerRow: number;
  matchedFields: string[];
  matchedFieldsCount: number;
  recognitionStatus: 'recognized' | 'unrecognized';
  failureReason?: string;
  rawData?: any[][];
}

export interface ImportProgress {
  importId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  processedFiles: number;
  totalSheets: number;
  processedSheets: number;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  progress: number;
  currentStep: string;
  errors: ImportError[];
}

export interface ImportError {
  type: 'file' | 'sheet' | 'row' | 'field';
  message: string;
  details?: any;
}

export interface ImportSettings {
  matchMode: 'strict' | 'fuzzy';
  minMatchFields: number;
  skipEmptyRows: boolean;
  trimWhitespace: boolean;
  validateData: boolean;
  autoUpdateEnabled: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface ImportStatistics {
  total: number;
  totalSheets: number;
  recognized: number;
  unrecognized: number;
  imported: number;
  failed: number;
}

// API请求和响应类型
export interface ImportSelectFilesRequest {
  // 无参数
}

export interface ImportSelectFilesResponse {
  filePaths: string[];
}

export interface ImportStartRequest {
  filePaths: string[];
  settings: ImportSettings;
}

export interface ImportStartResponse {
  importId: string;
}

export interface ImportGetProgressRequest {
  importId: string;
}

export interface ImportGetProgressResponse {
  progress: ImportProgress;
}

export interface ImportParseFileRequest {
  filePath: string;
}

export interface ImportParseFileResponse {
  worksheets: WorksheetInfo[];
}

// 前端组件使用的类型
export interface ImportFileListItem {
  id: string;
  name: string;
  size: string;
  sheetCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface ImportSettingsForm {
  matchMode: 'strict' | 'fuzzy';
  minMatchFields: number;
  skipEmptyRows: boolean;
  trimWhitespace: boolean;
  validateData: boolean;
  autoUpdateEnabled: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface WorksheetDetailInfo {
  id: string;
  sheetName: string;
  sheetType: 'contract' | 'procurement' | 'unknown';
  totalRows: number;
  dataRows: number;
  headerRow: number;
  matchedFields: string[];
  recognitionStatus: 'recognized' | 'unrecognized';
  failureReason?: string;
  previewData?: any[][];
}
