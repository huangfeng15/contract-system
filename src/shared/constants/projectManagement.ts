/**
 * 项目管理模块常量定义
 */

import type { IProjectTableColumn } from '@renderer/types/Project.types'

// 项目表格默认列配置
export const DEFAULT_PROJECT_COLUMNS: IProjectTableColumn[] = [
  {
    prop: 'projectCode',
    label: '项目编号',
    width: 150,
    sortable: true,
    filterable: true,
    visible: true,
    fixed: 'left'
  },
  {
    prop: 'projectName',
    label: '项目名称',
    minWidth: 200,
    sortable: true,
    filterable: true,
    visible: true
  },
  {
    prop: 'projectAlias',
    label: '项目别名',
    width: 150,
    filterable: true,
    visible: true
  },
  {
    prop: 'contractCount',
    label: '合同数',
    width: 100,
    sortable: true,
    visible: true
  },
  {
    prop: 'procurementCount',
    label: '采购数',
    width: 100,
    sortable: true,
    visible: true
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    width: 160,
    sortable: true,
    visible: true
  },
  {
    prop: 'actions',
    label: '操作',
    width: 150,
    visible: true,
    fixed: 'right'
  }
]

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
}

// 搜索配置
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MIN_SEARCH_LENGTH: 1,
  MAX_SEARCH_LENGTH: 100
}

// 表单验证配置
export const VALIDATION_CONFIG = {
  PROJECT_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-z0-9_-]+$/,
    PATTERN_MESSAGE: '项目编号只能包含字母、数字、下划线和横线'
  },
  PROJECT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  PROJECT_ALIAS: {
    MAX_LENGTH: 500
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000
  }
}

// 操作按钮配置
export const ACTION_BUTTONS = {
  CREATE: {
    label: '新建项目',
    type: 'primary',
    icon: 'Plus',
    permission: 'project:create'
  },
  EDIT: {
    label: '编辑',
    type: 'primary',
    icon: 'Edit',
    permission: 'project:edit'
  },
  DELETE: {
    label: '删除',
    type: 'danger',
    icon: 'Delete',
    permission: 'project:delete'
  },
  VIEW: {
    label: '详情',
    type: 'info',
    icon: 'View',
    permission: 'project:view'
  },
  REFRESH: {
    label: '刷新',
    type: 'default',
    icon: 'Refresh',
    permission: 'project:view'
  },
  EXPORT: {
    label: '导出',
    type: 'default',
    icon: 'Download',
    permission: 'project:export'
  }
}

// 消息提示配置
export const MESSAGE_CONFIG = {
  SUCCESS: {
    CREATE: '项目创建成功',
    UPDATE: '项目更新成功',
    DELETE: '项目删除成功',
    EXPORT: '项目导出成功'
  },
  ERROR: {
    CREATE: '项目创建失败',
    UPDATE: '项目更新失败',
    DELETE: '项目删除失败',
    LOAD: '加载项目数据失败',
    NETWORK: '网络连接失败',
    VALIDATION: '数据验证失败',
    PERMISSION: '权限不足',
    DUPLICATE_CODE: '项目编号已存在'
  },
  WARNING: {
    DELETE_CONFIRM: '确定要删除这个项目吗？',
    BATCH_DELETE_CONFIRM: '确定要删除选中的项目吗？',
    UNSAVED_CHANGES: '有未保存的更改，确定要离开吗？',
    NO_SELECTION: '请先选择要操作的项目'
  },
  INFO: {
    LOADING: '正在加载...',
    NO_DATA: '暂无项目数据',
    SEARCH_NO_RESULT: '没有找到匹配的项目'
  }
}

// 表格配置
export const TABLE_CONFIG = {
  ROW_HEIGHT: 48,
  HEADER_HEIGHT: 40,
  MAX_HEIGHT: 600,
  STRIPE: true,
  BORDER: true,
  HIGHLIGHT_CURRENT_ROW: true,
  SHOW_OVERFLOW_TOOLTIP: true
}

// 对话框配置
export const DIALOG_CONFIG = {
  FORM: {
    WIDTH: '500px',
    TOP: '15vh'
  },
  DETAIL: {
    WIDTH: '800px',
    TOP: '10vh'
  }
}

// 响应式断点配置
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
}

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: 300,
  EASING: 'ease-in-out'
}

// 缓存配置
export const CACHE_CONFIG = {
  PROJECT_LIST_TTL: 5 * 60 * 1000, // 5分钟
  PROJECT_STATS_TTL: 10 * 60 * 1000, // 10分钟
  SEARCH_RESULTS_TTL: 2 * 60 * 1000 // 2分钟
}

// 导出配置
export const EXPORT_CONFIG = {
  FORMATS: ['xlsx', 'csv'],
  MAX_RECORDS: 10000,
  DEFAULT_FILENAME: 'projects_export'
}

// 权限配置
export const PERMISSIONS = {
  VIEW: 'project:view',
  CREATE: 'project:create',
  EDIT: 'project:edit',
  DELETE: 'project:delete',
  EXPORT: 'project:export',
  IMPORT: 'project:import'
}


