/**
 * 通用类型定义
 */

// API响应基础类型
export interface IApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页参数
export interface IPaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 分页响应
export interface IPaginationResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 筛选条件基础类型
export interface IFilterCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in'
  value: any
}

// 文件信息
export interface IFileInfo {
  path: string
  name: string
  size: number
  extension: string
  lastModified: Date
}

// 导入进度
export interface IImportProgress {
  total: number
  processed: number
  success: number
  failed: number
  percentage: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
}
