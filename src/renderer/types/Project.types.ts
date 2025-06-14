/**
 * 项目管理相关类型定义
 */

import type { Project } from '@shared/types/database'
import type { IPaginationParams, IPaginationResponse } from '@shared/types/common'

// 项目表单数据类型
export interface IProjectFormData {
  projectCode: string
  projectName: string
  projectAlias?: string // 支持逗号分隔多个别名
  description?: string
}

// 项目搜索筛选参数类型
export interface IProjectSearchParams extends IPaginationParams {
  keyword?: string
  projectCode?: string
  projectName?: string
  dateRange?: [string, string]
}

// 项目列表响应类型
export interface IProjectListResponse extends IPaginationResponse<Project> {
  stats?: IProjectStats
}

// 项目统计信息类型
export interface IProjectStats {
  total: number
  contractCount?: number
  procurementCount?: number
}

// 项目详情类型
export interface IProjectDetail extends Project {
  contractCount: number
  procurementCount: number
  contracts?: IProjectContract[]
  procurements?: IProjectProcurement[]
}

// 项目关联合同类型
export interface IProjectContract {
  id: number
  contractNumber?: string
  contractName?: string
  partyA?: string
  partyB?: string
  signDate?: string
  amount?: number
  status: string
}

// 项目关联采购类型
export interface IProjectProcurement {
  id: number
  procurementNumber?: string
  procurementName?: string
  supplier?: string
  amount?: number
  status: string
}

// 项目表格列配置类型
export interface IProjectTableColumn {
  prop: string
  label: string
  width?: number
  minWidth?: number
  sortable?: boolean
  filterable?: boolean
  visible: boolean
  fixed?: 'left' | 'right'
}

// 项目操作类型
export type ProjectAction = 'create' | 'edit' | 'delete' | 'view'

// 项目表单验证规则类型
export interface IProjectValidationRules {
  projectCode: Array<{
    required?: boolean
    message: string
    trigger?: string
    pattern?: RegExp
    validator?: (rule: any, value: any, callback: any) => void
  }>
  projectName: Array<{
    required?: boolean
    message: string
    trigger?: string
    min?: number
    max?: number
  }>
  projectAlias?: Array<{
    message: string
    trigger?: string
    max?: number
  }>
  description?: Array<{
    message: string
    trigger?: string
    max?: number
  }>
}

// 项目批量操作类型
export interface IProjectBatchOperation {
  action: 'delete' | 'export'
  projectIds: number[]
  options?: Record<string, any>
}

// 项目导出配置类型
export interface IProjectExportConfig {
  format: 'xlsx' | 'csv'
  fields: string[]
  filters?: IProjectSearchParams
  fileName?: string
}

// 项目匹配结果类型
export interface IProjectMatchResult {
  project: Project
  score: number
  matchedFields: string[]
}



// 项目组件事件类型
export interface IProjectComponentEvents {
  'project-created': (project: Project) => void
  'project-updated': (project: Project) => void
  'project-deleted': (projectId: number) => void
  'project-selected': (project: Project) => void
  'projects-selected': (projects: Project[]) => void
  'search-changed': (params: IProjectSearchParams) => void
  'page-changed': (page: number) => void
  'page-size-changed': (pageSize: number) => void
}

// 项目组件Props类型
export interface IProjectTableProps {
  data: Project[]
  loading?: boolean
  columns?: IProjectTableColumn[]
  showSelection?: boolean
  showPagination?: boolean
  pagination?: IPaginationResponse<Project>
  searchParams?: IProjectSearchParams
}

export interface IProjectFormProps {
  visible: boolean
  mode: 'create' | 'edit'
  project?: Project | null
  loading?: boolean
}

export interface IProjectDetailProps {
  visible: boolean
  project?: Project | null
  loading?: boolean
}

// 项目状态管理类型
export interface IProjectStoreState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  searchParams: IProjectSearchParams
  pagination: IPaginationResponse<Project>
  stats: IProjectStats | null
  selectedProjects: Project[]
  tableColumns: IProjectTableColumn[]
}

// 项目API响应类型
export interface IProjectApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp?: number
}
