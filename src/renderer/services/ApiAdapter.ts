/**
 * API适配器
 * 根据环境自动选择真实API或模拟API
 */

import { MockDataService } from './MockDataService'
import type {
  IProjectFormData,
  IProjectSearchParams,
  IProjectListResponse,
  IProjectStats
} from '@renderer/types/Project.types'
import type { Project } from '@shared/types/database'

export class ApiAdapter {
  /**
   * 检查是否在Electron环境中
   */
  private static isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' &&
           window.electronAPI !== undefined &&
           typeof window.electronAPI.invoke === 'function'
  }

  /**
   * 获取项目列表
   */
  static async getProjectList(params?: IProjectSearchParams): Promise<{
    success: boolean
    data?: IProjectListResponse
    error?: string
    timestamp: number
  }> {
    const timestamp = Date.now()

    if (this.isElectronEnvironment()) {
      // Electron环境：使用真实API
      try {
        const response = await window.electronAPI!.invoke('project:findPaginated',
          params?.page || 1,
          params?.pageSize || 20,
          {
            where: this.buildWhereCondition(params),
            orderBy: params?.sortBy || 'createdAt',
            orderDirection: params?.sortOrder?.toUpperCase() || 'DESC'
          }
        )

        if (!response.success) {
          throw new Error(response.error || '获取项目列表失败')
        }

        return {
          success: true,
          data: response.data,
          timestamp
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    } else {
      // Web环境：使用模拟API
      try {
        console.log('ApiAdapter: 使用Web环境模拟API获取项目列表', params)
        const response = await MockDataService.findPaginated(
          params?.page || 1,
          params?.pageSize || 20,
          {
            where: this.buildWhereCondition(params),
            orderBy: params?.sortBy || 'createdAt',
            orderDirection: params?.sortOrder?.toUpperCase() || 'DESC'
          }
        )
        console.log('ApiAdapter: 模拟API响应', response)

        return {
          success: response.success,
          data: response.data,
          error: response.error,
          timestamp
        }
      } catch (error) {
        console.error('ApiAdapter: Web环境获取项目列表失败', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    }
  }

  /**
   * 获取项目统计
   */
  static async getProjectStats(): Promise<{
    success: boolean
    data?: IProjectStats
    error?: string
    timestamp: number
  }> {
    const timestamp = Date.now()

    if (this.isElectronEnvironment()) {
      // Electron环境：使用真实API
      try {
        const response = await window.electronAPI!.invoke('project:getStats')

        if (!response.success) {
          throw new Error(response.error || '获取项目统计失败')
        }

        return {
          success: true,
          data: response.data,
          timestamp
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    } else {
      // Web环境：使用模拟API
      const response = await MockDataService.getStats()
      return {
        success: response.success,
        data: response.data,
        error: response.error,
        timestamp
      }
    }
  }

  /**
   * 创建项目
   */
  static async createProject(projectData: IProjectFormData): Promise<{
    success: boolean
    data?: Project
    message?: string
    error?: string
    timestamp: number
  }> {
    const timestamp = Date.now()

    if (this.isElectronEnvironment()) {
      // Electron环境：使用真实API
      try {
        const response = await window.electronAPI!.invoke('project:create', projectData)

        if (!response.success) {
          throw new Error(response.error || '创建项目失败')
        }

        return {
          success: true,
          data: response.data,
          message: '项目创建成功',
          timestamp
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    } else {
      // Web环境：使用模拟API
      console.log('ApiAdapter: 使用Web环境模拟API创建项目', projectData)
      const response = await MockDataService.create(projectData)
      console.log('ApiAdapter: 创建项目响应', response)
      return {
        success: response.success,
        data: response.data,
        message: response.success ? '项目创建成功' : undefined,
        error: response.error,
        timestamp
      }
    }
  }

  /**
   * 更新项目
   */
  static async updateProject(id: number, projectData: Partial<IProjectFormData>): Promise<{
    success: boolean
    data?: Project
    message?: string
    error?: string
    timestamp: number
  }> {
    const timestamp = Date.now()

    if (this.isElectronEnvironment()) {
      // Electron环境：使用真实API
      try {
        const response = await window.electronAPI!.invoke('project:update', id, projectData)

        if (!response.success) {
          throw new Error(response.error || '更新项目失败')
        }

        return {
          success: true,
          data: response.data,
          message: '项目更新成功',
          timestamp
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    } else {
      // Web环境：使用模拟API
      const response = await MockDataService.update(id, projectData)
      return {
        success: response.success,
        data: response.data,
        message: response.success ? '项目更新成功' : undefined,
        error: response.error,
        timestamp
      }
    }
  }

  /**
   * 删除项目
   */
  static async deleteProject(id: number): Promise<{
    success: boolean
    data?: boolean
    message?: string
    error?: string
    timestamp: number
  }> {
    const timestamp = Date.now()

    if (this.isElectronEnvironment()) {
      // Electron环境：使用真实API
      try {
        const response = await window.electronAPI!.invoke('project:delete', id)

        if (!response.success) {
          throw new Error(response.error || '删除项目失败')
        }

        return {
          success: true,
          data: true,
          message: '项目删除成功',
          timestamp
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    } else {
      // Web环境：使用模拟API
      const response = await MockDataService.delete(id)
      return {
        success: response.success,
        data: response.success ? true : undefined,
        message: response.success ? '项目删除成功' : undefined,
        error: response.error,
        timestamp
      }
    }
  }

  /**
   * 根据ID获取项目详情
   */
  static async getProjectById(id: number): Promise<{
    success: boolean
    data?: Project
    error?: string
    timestamp: number
  }> {
    const timestamp = Date.now()

    if (this.isElectronEnvironment()) {
      // Electron环境：使用真实API
      try {
        const response = await window.electronAPI!.invoke('project:findById', id)

        if (!response.success) {
          throw new Error(response.error || '获取项目详情失败')
        }

        return {
          success: true,
          data: response.data,
          timestamp
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    } else {
      // Web环境：使用模拟API
      const response = await MockDataService.findById(id)
      return {
        success: response.success,
        data: response.data,
        error: response.error,
        timestamp
      }
    }
  }

  /**
   * 搜索项目
   */
  static async searchProjects(searchTerm: string): Promise<{
    success: boolean
    data?: Project[]
    error?: string
    timestamp: number
  }> {
    const timestamp = Date.now()

    if (this.isElectronEnvironment()) {
      // Electron环境：使用真实API
      try {
        const response = await window.electronAPI!.invoke('project:searchByName', searchTerm)

        if (!response.success) {
          throw new Error(response.error || '搜索项目失败')
        }

        return {
          success: true,
          data: response.data,
          timestamp
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp
        }
      }
    } else {
      // Web环境：使用模拟API
      const response = await MockDataService.searchByName(searchTerm)
      return {
        success: response.success,
        data: response.data,
        error: response.error,
        timestamp
      }
    }
  }



  /**
   * 检查项目编号是否存在
   */
  static async checkProjectCodeExists(projectCode: string): Promise<{
    success: boolean
    data?: boolean
    error?: string
  }> {
    try {
      if (!projectCode || projectCode.trim() === '') {
        return {
          success: false,
          error: '项目编号不能为空'
        }
      }

      if (this.isElectronEnvironment()) {
        // Electron环境：使用真实API
        const response = await window.electronAPI!.invoke('project:findByCode', projectCode.trim())

        if (response.success) {
          return {
            success: true,
            data: !!response.data
          }
        } else {
          return {
            success: true,
            data: false
          }
        }
      } else {
        // Web环境：使用模拟API
        const response = await MockDataService.findByCode(projectCode.trim())
        return {
          success: true,
          data: !!response.data
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `检查项目编号失败: ${error}`
      }
    }
  }

  /**
   * 构建查询条件
   */
  private static buildWhereCondition(params?: IProjectSearchParams): Record<string, any> {
    const where: Record<string, any> = {}

    if (params?.keyword) {
      where.keyword = params.keyword
    }

    if (params?.projectCode) {
      where.projectCode = params.projectCode
    }

    if (params?.projectName) {
      where.projectName = params.projectName
    }

    if (params?.dateRange && params.dateRange.length === 2) {
      where.createdAtStart = params.dateRange[0]
      where.createdAtEnd = params.dateRange[1]
    }

    return where
  }

  /**
   * 初始化模拟数据（仅在Web环境中）
   */
  static initializeMockData(): void {
    if (!this.isElectronEnvironment()) {
      console.log('ApiAdapter: 初始化Web环境模拟数据')
      MockDataService.initSampleData()
      console.log('ApiAdapter: 模拟数据初始化完成')
    }
  }
}
