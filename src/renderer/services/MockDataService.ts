/**
 * 模拟数据服务
 * 为Web环境提供数据存储和操作功能
 */

import type { Project } from '@shared/types/database'
import type {
  IProjectFormData,
  IProjectSearchParams,
  IProjectListResponse,
  IProjectStats
} from '@renderer/types/Project.types'

export class MockDataService {
  private static readonly STORAGE_KEY = 'contract_system_projects'
  private static readonly STATS_KEY = 'contract_system_project_stats'

  /**
   * 获取所有项目数据
   */
  private static getProjects(): Project[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取项目数据失败:', error)
      return []
    }
  }

  /**
   * 保存项目数据
   */
  private static saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects))
      this.updateStats(projects)
    } catch (error) {
      console.error('保存项目数据失败:', error)
      throw new Error('保存数据失败')
    }
  }

  /**
   * 更新统计数据
   */
  private static updateStats(projects: Project[]): void {
    const stats: IProjectStats = {
      total: projects.length
    }

    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats))
    } catch (error) {
      console.error('保存统计数据失败:', error)
    }
  }

  /**
   * 生成新的ID
   */
  private static generateId(): number {
    const projects = this.getProjects()
    return projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1
  }

  /**
   * 获取项目列表（分页）
   */
  static async findPaginated(
    page: number = 1,
    pageSize: number = 20,
    options: {
      where?: Record<string, any>
      orderBy?: string
      orderDirection?: string
    } = {}
  ): Promise<{ success: boolean; data?: IProjectListResponse; error?: string }> {
    try {
      let projects = this.getProjects()

      // 应用筛选条件
      if (options.where) {
        projects = this.applyFilters(projects, options.where)
      }

      // 应用排序
      if (options.orderBy) {
        projects = this.applySorting(projects, options.orderBy, options.orderDirection || 'DESC')
      }

      // 计算分页
      const total = projects.length
      const totalPages = Math.ceil(total / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const items = projects.slice(startIndex, endIndex)

      return {
        success: true,
        data: {
          items,
          total,
          page,
          pageSize,
          totalPages
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取项目列表失败'
      }
    }
  }

  /**
   * 应用筛选条件
   */
  private static applyFilters(projects: Project[], where: Record<string, any>): Project[] {
    return projects.filter(project => {
      // 关键词搜索
      if (where.keyword) {
        const keyword = where.keyword.toLowerCase()
        const searchFields = [
          project.projectCode?.toLowerCase() || '',
          project.projectName?.toLowerCase() || '',
          project.projectAlias?.toLowerCase() || ''
        ]
        if (!searchFields.some(field => field.includes(keyword))) {
          return false
        }
      }



      // 项目编号筛选
      if (where.projectCode && project.projectCode !== where.projectCode) {
        return false
      }

      // 项目名称筛选
      if (where.projectName && !project.projectName?.includes(where.projectName)) {
        return false
      }

      // 日期范围筛选
      if (where.createdAtStart || where.createdAtEnd) {
        const createdAt = new Date(project.createdAt)
        if (where.createdAtStart && createdAt < new Date(where.createdAtStart)) {
          return false
        }
        if (where.createdAtEnd && createdAt > new Date(where.createdAtEnd)) {
          return false
        }
      }

      return true
    })
  }

  /**
   * 应用排序
   */
  private static applySorting(projects: Project[], orderBy: string, orderDirection: string): Project[] {
    return projects.sort((a, b) => {
      let aValue: any = a[orderBy as keyof Project]
      let bValue: any = b[orderBy as keyof Project]

      // 处理日期字段
      if (orderBy === 'createdAt' || orderBy === 'updatedAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // 处理字符串字段
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      let result = 0
      if (aValue < bValue) result = -1
      else if (aValue > bValue) result = 1

      return orderDirection === 'DESC' ? -result : result
    })
  }

  /**
   * 创建项目
   */
  static async create(projectData: IProjectFormData): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      console.log('MockDataService: 开始创建项目', projectData)
      const projects = this.getProjects()
      console.log('MockDataService: 当前项目列表长度', projects.length)

      // 检查项目编号是否已存在
      if (projects.some(p => p.projectCode === projectData.projectCode)) {
        console.log('MockDataService: 项目编号已存在', projectData.projectCode)
        return {
          success: false,
          error: '项目编号已存在'
        }
      }

      const now = new Date().toISOString()
      const newProject: Project = {
        id: this.generateId(),
        projectCode: projectData.projectCode,
        projectName: projectData.projectName,
        projectAlias: projectData.projectAlias || null,
        description: projectData.description || null,
        createdAt: now,
        updatedAt: now
      }

      console.log('MockDataService: 新建项目数据', newProject)

      // 添加到项目列表开头，确保新项目显示在最前面
      projects.unshift(newProject)
      this.saveProjects(projects)

      console.log('MockDataService: 项目创建成功，保存后的项目列表长度', this.getProjects().length)

      return {
        success: true,
        data: newProject
      }
    } catch (error) {
      console.error('MockDataService: 创建项目失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建项目失败'
      }
    }
  }

  /**
   * 更新项目
   */
  static async update(id: number, projectData: Partial<IProjectFormData>): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const projects = this.getProjects()
      const index = projects.findIndex(p => p.id === id)

      if (index === -1) {
        return {
          success: false,
          error: '项目不存在'
        }
      }

      // 如果更新项目编号，检查是否已存在
      if (projectData.projectCode && projectData.projectCode !== projects[index].projectCode) {
        if (projects.some(p => p.projectCode === projectData.projectCode && p.id !== id)) {
          return {
            success: false,
            error: '项目编号已存在'
          }
        }
      }

      const updatedProject: Project = {
        ...projects[index],
        ...projectData,
        updatedAt: new Date().toISOString()
      }

      projects[index] = updatedProject
      this.saveProjects(projects)

      return {
        success: true,
        data: updatedProject
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新项目失败'
      }
    }
  }

  /**
   * 删除项目
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const projects = this.getProjects()
      const index = projects.findIndex(p => p.id === id)

      if (index === -1) {
        return {
          success: false,
          error: '项目不存在'
        }
      }

      projects.splice(index, 1)
      this.saveProjects(projects)

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除项目失败'
      }
    }
  }

  /**
   * 根据ID查找项目
   */
  static async findById(id: number): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const projects = this.getProjects()
      const project = projects.find(p => p.id === id)

      if (!project) {
        return {
          success: false,
          error: '项目不存在'
        }
      }

      return {
        success: true,
        data: project
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '查找项目失败'
      }
    }
  }

  /**
   * 根据项目编号查找项目
   */
  static async findByCode(projectCode: string): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const projects = this.getProjects()
      const project = projects.find(p => p.projectCode === projectCode)

      return {
        success: true,
        data: project
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '查找项目失败'
      }
    }
  }

  /**
   * 搜索项目
   */
  static async searchByName(searchTerm: string): Promise<{ success: boolean; data?: Project[]; error?: string }> {
    try {
      const projects = this.getProjects()
      const filteredProjects = projects.filter(project =>
        project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectAlias?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      return {
        success: true,
        data: filteredProjects
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '搜索项目失败'
      }
    }
  }



  /**
   * 获取项目统计
   */
  static async getStats(): Promise<{ success: boolean; data?: IProjectStats; error?: string }> {
    try {
      const projects = this.getProjects()
      const stats: IProjectStats = {
        total: projects.length
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取统计数据失败'
      }
    }
  }

  /**
   * 初始化示例数据
   */
  static initSampleData(): void {
    const projects = this.getProjects()
    if (projects.length === 0) {
      const sampleProjects: Project[] = [
        {
          id: 1,
          projectCode: 'DEMO_001',
          projectName: '示例项目一',
          projectAlias: '演示项目,测试项目',
          description: '这是一个用于演示的示例项目，支持逗号分隔的多个别名',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          projectCode: 'DEMO_002',
          projectName: '示例项目二',
          projectAlias: '项目二,第二个项目',
          description: '第二个示例项目',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      this.saveProjects(sampleProjects)
    }
  }
}
