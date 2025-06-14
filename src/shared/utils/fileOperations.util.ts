/**
 * 文件操作工具类
 * 遵循开发规范：严禁硬编码，所有配置通过常量管理
 */

import { APP_CONFIG } from '@shared/constants/config'

// 文件操作配置常量
export const FILE_OPERATION_CONFIG = {
  // 导出文件配置
  EXPORT: {
    DEFAULT_DIR: 'exports',
    FIELD_DIR: 'fields',
    PROJECT_DIR: 'projects', 
    CONTRACT_DIR: 'contracts',
    PROCUREMENT_DIR: 'procurements',
    DATA_IMPORT_DIR: 'data-imports'
  },
  
  // 导入文件配置
  IMPORT: {
    ALLOWED_EXTENSIONS: ['.json'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ENCODING: 'utf-8'
  },
  
  // 文件名格式
  FILENAME_FORMAT: {
    TIMESTAMP_FORMAT: 'YYYY-MM-DD_HH-mm-ss',
    FIELD_PREFIX: 'fields_export_',
    PROJECT_PREFIX: 'projects_export_',
    CONTRACT_PREFIX: 'contracts_export_',
    PROCUREMENT_PREFIX: 'procurements_export_',
    DATA_IMPORT_PREFIX: 'data_import_export_'
  }
} as const

// 文件操作错误消息
export const FILE_OPERATION_ERRORS = {
  INVALID_FILE_FORMAT: '不支持的文件格式，仅支持JSON文件',
  FILE_TOO_LARGE: '文件大小超出限制',
  FILE_READ_ERROR: '文件读取失败',
  FILE_WRITE_ERROR: '文件写入失败',
  INVALID_JSON_FORMAT: 'JSON格式无效',
  EMPTY_DATA: '没有可导出的数据',
  PERMISSION_DENIED: '文件访问权限不足'
} as const

/**
 * 文件操作接口定义
 */
export interface IFileOperationResult {
  success: boolean
  filePath?: string
  error?: string
  data?: any
}

export interface IExportOptions {
  fileName?: string
  directory?: string
  data: any[]
  type: 'field' | 'project' | 'contract' | 'procurement' | 'data-import'
}

export interface IImportOptions {
  filePath: string
  validateSchema?: boolean
  expectedFields?: string[]
}

/**
 * 字段数据接口
 */
export interface IFieldData {
  id?: number
  name: string
  type: string
  aliases: string[]
  fieldType?: 'contract' | 'procurement'
  isVisible?: boolean
  displayOrder?: number
  isRequired?: boolean
  defaultValue?: string
  validationRule?: string
}

/**
 * 项目数据接口
 */
export interface IProjectData {
  id?: number
  projectCode: string
  projectName: string
  projectAlias?: string
  description?: string
  status?: string
  contractCount?: number
  procurementCount?: number
  createdAt?: string
  updatedAt?: string
}

/**
 * 合同数据接口
 */
export interface IContractData {
  id?: number
  contractNumber: string
  projectName?: string
  partyA: string
  partyB: string
  signDate: string
  amount: number
  status?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 采购数据接口
 */
export interface IProcurementData {
  id?: number
  procurementNumber: string
  projectName?: string
  supplier: string
  content: string
  amount: number
  date: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 文件操作工具类
 */
export class FileOperationsUtil {
  /**
   * 生成带时间戳的文件名
   */
  static generateFileName(type: string, prefix: string, extension: string = '.json'): string {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0]
    
    return `${prefix}${timestamp}${extension}`
  }

  /**
   * 获取导出目录路径
   */
  static getExportDirectory(type: string): string {
    const baseDir = FILE_OPERATION_CONFIG.EXPORT.DEFAULT_DIR
    
    switch (type) {
      case 'field':
        return `${baseDir}/${FILE_OPERATION_CONFIG.EXPORT.FIELD_DIR}`
      case 'project':
        return `${baseDir}/${FILE_OPERATION_CONFIG.EXPORT.PROJECT_DIR}`
      case 'contract':
        return `${baseDir}/${FILE_OPERATION_CONFIG.EXPORT.CONTRACT_DIR}`
      case 'procurement':
        return `${baseDir}/${FILE_OPERATION_CONFIG.EXPORT.PROCUREMENT_DIR}`
      case 'data-import':
        return `${baseDir}/${FILE_OPERATION_CONFIG.EXPORT.DATA_IMPORT_DIR}`
      default:
        return baseDir
    }
  }

  /**
   * 获取文件名前缀
   */
  static getFilePrefix(type: string): string {
    switch (type) {
      case 'field':
        return FILE_OPERATION_CONFIG.FILENAME_FORMAT.FIELD_PREFIX
      case 'project':
        return FILE_OPERATION_CONFIG.FILENAME_FORMAT.PROJECT_PREFIX
      case 'contract':
        return FILE_OPERATION_CONFIG.FILENAME_FORMAT.CONTRACT_PREFIX
      case 'procurement':
        return FILE_OPERATION_CONFIG.FILENAME_FORMAT.PROCUREMENT_PREFIX
      case 'data-import':
        return FILE_OPERATION_CONFIG.FILENAME_FORMAT.DATA_IMPORT_PREFIX
      default:
        return 'export_'
    }
  }

  /**
   * 验证导入文件格式
   */
  static validateImportFile(filePath: string, fileSize: number): { valid: boolean; error?: string } {
    // 检查文件扩展名
    const extension = filePath.toLowerCase().split('.').pop()
    if (!FILE_OPERATION_CONFIG.IMPORT.ALLOWED_EXTENSIONS.includes(`.${extension}`)) {
      return {
        valid: false,
        error: FILE_OPERATION_ERRORS.INVALID_FILE_FORMAT
      }
    }

    // 检查文件大小
    if (fileSize > FILE_OPERATION_CONFIG.IMPORT.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: FILE_OPERATION_ERRORS.FILE_TOO_LARGE
      }
    }

    return { valid: true }
  }

  /**
   * 验证JSON数据格式
   */
  static validateJsonData(data: any, expectedFields?: string[]): { valid: boolean; error?: string } {
    if (!Array.isArray(data)) {
      return {
        valid: false,
        error: 'JSON数据必须是数组格式'
      }
    }

    if (data.length === 0) {
      return {
        valid: false,
        error: FILE_OPERATION_ERRORS.EMPTY_DATA
      }
    }

    // 验证必需字段
    if (expectedFields && expectedFields.length > 0) {
      const firstItem = data[0]
      const missingFields = expectedFields.filter(field => !(field in firstItem))
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `缺少必需字段: ${missingFields.join(', ')}`
        }
      }
    }

    return { valid: true }
  }

  /**
   * 格式化导出数据
   */
  static formatExportData(data: any[], type: string): any[] {
    switch (type) {
      case 'field':
        return data.map((field: IFieldData) => ({
          字段名称: field.name,
          字段类型: field.type,
          别名列表: Array.isArray(field.aliases) ? field.aliases.join(', ') : field.aliases,
          字段分类: field.fieldType || 'contract',
          是否显示: field.isVisible !== false,
          显示顺序: field.displayOrder || 0,
          是否必需: field.isRequired || false,
          默认值: field.defaultValue || '',
          验证规则: field.validationRule || ''
        }))
      
      case 'project':
        return data.map((project: IProjectData) => ({
          项目编号: project.projectCode,
          项目名称: project.projectName,
          项目别名: project.projectAlias || '',
          项目描述: project.description || '',
          项目状态: project.status || '进行中',
          合同数量: project.contractCount || 0,
          采购数量: project.procurementCount || 0,
          创建时间: project.createdAt || '',
          更新时间: project.updatedAt || ''
        }))
      
      case 'contract':
        return data.map((contract: IContractData) => ({
          合同编号: contract.contractNumber,
          关联项目: contract.projectName || '未关联',
          甲方单位: contract.partyA,
          乙方单位: contract.partyB,
          签约日期: contract.signDate,
          合同金额: contract.amount,
          合同状态: contract.status || '执行中',
          创建时间: contract.createdAt || '',
          更新时间: contract.updatedAt || ''
        }))
      
      case 'procurement':
        return data.map((procurement: IProcurementData) => ({
          采购编号: procurement.procurementNumber,
          关联项目: procurement.projectName || '未关联',
          供应商: procurement.supplier,
          采购内容: procurement.content,
          采购金额: procurement.amount,
          采购日期: procurement.date,
          采购状态: procurement.status || '进行中',
          创建时间: procurement.createdAt || '',
          更新时间: procurement.updatedAt || ''
        }))
      
      default:
        return data
    }
  }
}
