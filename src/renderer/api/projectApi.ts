/**
 * 项目管理API接口
 * 提供项目的CRUD操作和相关功能
 */

import type { Project } from '@shared/types/database'
import { ApiAdapter } from '@renderer/services/ApiAdapter'

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: number
}

// 项目表单数据类型
export interface ProjectFormData {
  projectCode: string
  projectName: string
  projectAlias?: string
  description?: string
  status: 'active' | 'inactive' | 'archived'
}

// 项目搜索参数类型
export interface ProjectSearchParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 项目列表响应类型
export interface ProjectListResponse {
  items: Project[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 项目统计响应类型
export interface ProjectStatsResponse {
  total: number
  active: number
  inactive: number
  archived: number
}

export class ProjectApi {
  /**
   * 获取项目列表
   */
  static async getProjectList(params?: ProjectSearchParams): Promise<ApiResponse<ProjectListResponse>> {
    try {
      console.log('ProjectApi: 调用获取项目列表', params)
      const response = await ApiAdapter.getProjectList(params)
      console.log('ProjectApi: 获取项目列表响应', response)

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        }
      }

      return {
        success: false,
        error: response.error || '获取项目列表失败'
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return {
        success: false,
        error: '获取项目列表失败'
      }
    }
  }

  /**
   * 获取项目统计信息
   */
  static async getProjectStats(): Promise<ApiResponse<ProjectStatsResponse>> {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.invoke('project:stats')
        return response
      }

      return {
        success: false,
        error: 'Electron API 不可用'
      }
    } catch (error) {
      console.error('获取项目统计失败:', error)
      return {
        success: false,
        error: '获取项目统计失败'
      }
    }
  }

  /**
   * 创建项目
   */
  static async createProject(projectData: ProjectFormData): Promise<ApiResponse<Project>> {
    try {
      console.log('ProjectApi: 调用创建项目', projectData)
      const response = await ApiAdapter.createProject(projectData)
      console.log('ProjectApi: 创建项目响应', response)

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message
        }
      }

      return {
        success: false,
        error: response.error || '创建项目失败'
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      return {
        success: false,
        error: '创建项目失败'
      }
    }
  }

  /**
   * 更新项目
   */
  static async updateProject(id: number, projectData: ProjectFormData): Promise<ApiResponse<Project>> {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.project.update(id, projectData)
        return response
      }

      return {
        success: false,
        error: 'Electron API 不可用'
      }
    } catch (error) {
      console.error('更新项目失败:', error)
      return {
        success: false,
        error: '更新项目失败'
      }
    }
  }

  /**
   * 删除项目
   */
  static async deleteProject(id: number): Promise<ApiResponse<void>> {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.project.delete(id)
        return response
      }

      return {
        success: false,
        error: 'Electron API 不可用'
      }
    } catch (error) {
      console.error('删除项目失败:', error)
      return {
        success: false,
        error: '删除项目失败'
      }
    }
  }

  /**
   * 根据ID获取项目详情
   */
  static async getProjectById(id: number): Promise<ApiResponse<Project>> {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.invoke('project:findById', id)
        return response
      }

      return {
        success: false,
        error: 'Electron API 不可用'
      }
    } catch (error) {
      console.error('获取项目详情失败:', error)
      return {
        success: false,
        error: '获取项目详情失败'
      }
    }
  }

  /**
   * 检查项目编号是否存在
   */
  static async checkProjectCodeExists(code: string, excludeId?: number): Promise<ApiResponse<boolean>> {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.invoke('project:findByCode', code)
        if (response.success && response.data) {
          // 如果是编辑模式，排除当前项目ID
          if (excludeId && response.data.id === excludeId) {
            return { success: true, data: false }
          }
          return { success: true, data: true }
        }
        return { success: true, data: false }
      }

      return {
        success: false,
        error: 'Electron API 不可用'
      }
    } catch (error) {
      console.error('检查项目编号失败:', error)
      return {
        success: false,
        error: '检查项目编号失败'
      }
    }
  }

  /**
   * 批量删除项目
   */
  static async batchDeleteProjects(ids: number[]): Promise<ApiResponse<void>> {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.invoke('project:batchDelete', ids)
        return response
      }

      return {
        success: false,
        error: 'Electron API 不可用'
      }
    } catch (error) {
      console.error('批量删除项目失败:', error)
      return {
        success: false,
        error: '批量删除项目失败'
      }
    }
  }

  /**
   * 导出项目数据
   */
  static async exportProjects(params?: ProjectSearchParams): Promise<ApiResponse<string>> {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.invoke('project:export', params)
        return response
      }

      return {
        success: false,
        error: 'Electron API 不可用'
      }
    } catch (error) {
      console.error('导出项目数据失败:', error)
      return {
        success: false,
        error: '导出项目数据失败'
      }
    }
  }
}
