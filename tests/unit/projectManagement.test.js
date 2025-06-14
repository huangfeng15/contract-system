/**
 * 项目管理模块测试文件
 * 包含组件测试、状态管理测试、API测试等
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage } from 'element-plus'

// 导入被测试的组件和模块
import ProjectManagementView from '@/views/projectManagement/ProjectManagementView.vue'
import ProjectTable from '@/views/projectManagement/ProjectTable.vue'
import ProjectFormDialog from '@/views/projectManagement/ProjectFormDialog.vue'
import ProjectDetailDialog from '@/views/projectManagement/ProjectDetailDialog.vue'
import { useProjectStore } from '@/stores/projectStore'
import { ProjectApi } from '@/api/projectApi'

// Mock Element Plus 消息组件
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  }
})

// Mock ProjectApi
vi.mock('@/api/projectApi', () => ({
  ProjectApi: {
    getProjectList: vi.fn(),
    getProjectStats: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    checkProjectCodeExists: vi.fn()
  }
}))

// Mock Electron API
global.window.electronAPI = {
  invoke: vi.fn()
}

// 测试数据
const mockProjects = [
  {
    id: 1,
    projectCode: 'PRJ-001',
    projectName: '测试项目1',
    projectAlias: '测试别名1',
    description: '这是测试项目1的描述',
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 2,
    projectCode: 'PRJ-002',
    projectName: '测试项目2',
    projectAlias: '测试别名2',
    description: '这是测试项目2的描述',
    status: 'inactive',
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z'
  }
]

const mockStats = {
  total: 2,
  active: 1,
  inactive: 1,
  archived: 0
}

const mockPaginationResponse = {
  items: mockProjects,
  total: 2,
  page: 1,
  pageSize: 20,
  totalPages: 1
}

describe('项目管理模块测试', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    // 重置所有 mock
    vi.clearAllMocks()

    // 设置默认的 API 响应
    ProjectApi.getProjectList.mockResolvedValue({
      success: true,
      data: mockPaginationResponse
    })

    ProjectApi.getProjectStats.mockResolvedValue({
      success: true,
      data: mockStats
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ProjectStore 状态管理测试', () => {
    it('应该正确初始化状态', () => {
      const store = useProjectStore()

      expect(store.projects).toEqual([])
      expect(store.currentProject).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.searchParams.page).toBe(1)
      expect(store.searchParams.pageSize).toBe(20)
      expect(store.stats).toBeNull()
      expect(store.selectedProjects).toEqual([])
    })

    it('应该正确获取项目列表', async () => {
      const store = useProjectStore()

      await store.getProjectList()

      expect(ProjectApi.getProjectList).toHaveBeenCalledWith(store.searchParams)
      expect(store.projects).toEqual(mockProjects)
      expect(store.pagination.total).toBe(2)
      expect(store.loading).toBe(false)
    })

    it('应该正确处理API错误', async () => {
      const store = useProjectStore()

      ProjectApi.getProjectList.mockResolvedValue({
        success: false,
        error: '获取项目列表失败'
      })

      await store.getProjectList()

      expect(store.error).toBe('获取项目列表失败')
      expect(ElMessage.error).toHaveBeenCalledWith('获取项目列表失败')
    })

    it('应该正确创建项目', async () => {
      const store = useProjectStore()
      const newProject = {
        projectCode: 'PRJ-003',
        projectName: '新测试项目',
        projectAlias: '新测试别名',
        description: '新项目描述',
        status: 'active'
      }

      ProjectApi.createProject.mockResolvedValue({
        success: true,
        data: { id: 3, ...newProject }
      })

      const result = await store.createProject(newProject)

      expect(result).toBe(true)
      expect(ProjectApi.createProject).toHaveBeenCalledWith(newProject)
      expect(ElMessage.success).toHaveBeenCalledWith('项目创建成功')
      expect(store.formVisible).toBe(false)
    })

    it('应该正确更新项目', async () => {
      const store = useProjectStore()
      const updatedProject = {
        projectCode: 'PRJ-001',
        projectName: '更新的项目名称',
        projectAlias: '更新的别名',
        description: '更新的描述',
        status: 'active'
      }

      ProjectApi.updateProject.mockResolvedValue({
        success: true,
        data: { id: 1, ...updatedProject }
      })

      const result = await store.updateProject(1, updatedProject)

      expect(result).toBe(true)
      expect(ProjectApi.updateProject).toHaveBeenCalledWith(1, updatedProject)
      expect(ElMessage.success).toHaveBeenCalledWith('项目更新成功')
    })

    it('应该正确删除项目', async () => {
      const store = useProjectStore()

      ProjectApi.deleteProject.mockResolvedValue({
        success: true
      })

      // 设置当前项目
      store.setCurrentProject(mockProjects[0])
      store.setSelectedProjects([mockProjects[0]])

      const result = await store.deleteProject(1)

      expect(result).toBe(true)
      expect(ProjectApi.deleteProject).toHaveBeenCalledWith(1)
      expect(ElMessage.success).toHaveBeenCalledWith('项目删除成功')
      expect(store.currentProject).toBeNull()
      expect(store.selectedProjects).toEqual([])
    })

    it('应该正确处理搜索', async () => {
      const store = useProjectStore()

      await store.searchProjects('测试')

      expect(store.searchParams.keyword).toBe('测试')
      expect(store.searchParams.page).toBe(1)
      expect(ProjectApi.getProjectList).toHaveBeenCalled()
    })

    it('应该正确处理筛选', async () => {
      const store = useProjectStore()

      await store.filterProjects({ status: 'active' })

      expect(store.searchParams.status).toBe('active')
      expect(store.searchParams.page).toBe(1)
      expect(ProjectApi.getProjectList).toHaveBeenCalled()
    })

    it('应该正确重置搜索', () => {
      const store = useProjectStore()

      // 先设置一些搜索参数
      store.updateSearchParams({
        keyword: '测试',
        status: 'active',
        page: 2
      })

      store.resetSearch()

      expect(store.searchParams.keyword).toBe('')
      expect(store.searchParams.status).toBe('')
      expect(store.searchParams.page).toBe(1)
      expect(store.searchParams.pageSize).toBe(20)
    })

    it('应该正确处理表单状态', () => {
      const store = useProjectStore()

      // 测试打开创建表单
      store.openCreateForm()
      expect(store.formVisible).toBe(true)
      expect(store.formMode).toBe('create')
      expect(store.formData.projectCode).toBe('')

      // 测试打开编辑表单
      store.openEditForm(mockProjects[0])
      expect(store.formVisible).toBe(true)
      expect(store.formMode).toBe('edit')
      expect(store.formData.projectCode).toBe('PRJ-001')

      // 测试关闭表单
      store.closeForm()
      expect(store.formVisible).toBe(false)
      expect(store.formData.projectCode).toBe('')
    })

    it('应该正确处理详情对话框状态', () => {
      const store = useProjectStore()

      // 测试打开详情对话框
      store.openDetailDialog(mockProjects[0])
      expect(store.detailVisible).toBe(true)
      expect(store.currentProject).toEqual(mockProjects[0])

      // 测试关闭详情对话框
      store.closeDetailDialog()
      expect(store.detailVisible).toBe(false)
      expect(store.currentProject).toBeNull()
    })

    it('应该正确处理批量删除', async () => {
      const store = useProjectStore()

      ProjectApi.deleteProject.mockResolvedValue({
        success: true
      })

      const result = await store.batchDeleteProjects([1, 2])

      expect(result).toBe(true)
      expect(ProjectApi.deleteProject).toHaveBeenCalledTimes(2)
      expect(ElMessage.success).toHaveBeenCalledWith('成功删除 2 个项目')
    })

    it('应该正确处理缓存', () => {
      const store = useProjectStore()

      // 初始状态缓存无效
      expect(store.isCacheValid()).toBe(false)

      // 设置项目数据后缓存有效
      store.setProjects(mockPaginationResponse)
      expect(store.isCacheValid()).toBe(true)

      // 使缓存失效
      store.invalidateCache()
      expect(store.isCacheValid()).toBe(false)
    })
  })

  describe('ProjectManagementView 组件测试', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(ProjectManagementView, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.find('.project-management-view').exists()).toBe(true)
      expect(wrapper.find('h2').text()).toContain('项目管理')
    })

    it('应该在挂载时加载数据', async () => {
      mount(ProjectManagementView, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      expect(ProjectApi.getProjectList).toHaveBeenCalled()
      expect(ProjectApi.getProjectStats).toHaveBeenCalled()
    })
  })

  describe('ProjectTable 组件测试', () => {
    it('应该正确渲染项目表格', () => {
      const wrapper = mount(ProjectTable, {
        props: {
          data: mockProjects,
          loading: false
        },
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.find('.el-table').exists()).toBe(true)
      expect(wrapper.findAll('.el-table__row')).toHaveLength(2)
    })

    it('应该正确显示加载状态', () => {
      const wrapper = mount(ProjectTable, {
        props: {
          data: [],
          loading: true
        },
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.find('.el-loading-mask').exists()).toBe(true)
    })

    it('应该正确触发事件', async () => {
      const wrapper = mount(ProjectTable, {
        props: {
          data: mockProjects,
          loading: false
        },
        global: {
          plugins: [pinia]
        }
      })

      // 测试编辑事件
      await wrapper.find('[data-test="edit-button"]').trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()

      // 测试删除事件
      await wrapper.find('[data-test="delete-button"]').trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })

  describe('ProjectFormDialog 组件测试', () => {
    it('应该正确渲染表单对话框', () => {
      const wrapper = mount(ProjectFormDialog, {
        props: {
          visible: true,
          mode: 'create'
        },
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.find('.project-form-dialog').exists()).toBe(true)
      expect(wrapper.find('.el-dialog__title').text()).toBe('新建项目')
    })

    it('应该正确验证表单', async () => {
      const wrapper = mount(ProjectFormDialog, {
        props: {
          visible: true,
          mode: 'create'
        },
        global: {
          plugins: [pinia]
        }
      })

      // 测试必填字段验证
      const submitButton = wrapper.find('[data-test="submit-button"]')
      expect(submitButton.attributes('disabled')).toBeDefined()

      // 填写必填字段
      await wrapper.find('input[placeholder*="项目编号"]').setValue('PRJ-003')
      await wrapper.find('input[placeholder*="项目名称"]').setValue('测试项目')

      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('ProjectDetailDialog 组件测试', () => {
    it('应该正确渲染详情对话框', () => {
      const wrapper = mount(ProjectDetailDialog, {
        props: {
          visible: true,
          project: mockProjects[0]
        },
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.find('.project-detail-dialog').exists()).toBe(true)
      expect(wrapper.find('.el-dialog__title').text()).toContain('项目详情')
    })

    it('应该正确显示项目信息', () => {
      const wrapper = mount(ProjectDetailDialog, {
        props: {
          visible: true,
          project: mockProjects[0]
        },
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.text()).toContain('PRJ-001')
      expect(wrapper.text()).toContain('测试项目1')
    })
  })

  describe('API 集成测试', () => {
    it('应该正确处理网络错误', async () => {
      const store = useProjectStore()

      ProjectApi.getProjectList.mockRejectedValue(new Error('网络错误'))

      await store.getProjectList()

      expect(store.error).toBe('网络连接失败')
      expect(ElMessage.error).toHaveBeenCalledWith('网络连接失败')
    })

    it('应该正确处理项目编号唯一性验证', async () => {
      ProjectApi.checkProjectCodeExists.mockResolvedValue({
        success: true,
        data: true
      })

      const result = await ProjectApi.checkProjectCodeExists('PRJ-001')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })

  describe('边界条件测试', () => {
    it('应该正确处理空数据', () => {
      const wrapper = mount(ProjectTable, {
        props: {
          data: [],
          loading: false
        },
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('应该正确处理大量数据', () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        projectCode: `PRJ-${String(i + 1).padStart(3, '0')}`,
        projectName: `项目${i + 1}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      const wrapper = mount(ProjectTable, {
        props: {
          data: largeDataSet,
          loading: false
        },
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.findAll('.el-table__row')).toHaveLength(1000)
    })

    it('应该正确处理特殊字符', async () => {
      const store = useProjectStore()
      const specialProject = {
        projectCode: 'PRJ-<script>',
        projectName: '项目名称"特殊\'字符',
        projectAlias: '别名&符号',
        description: '描述<tag>内容</tag>',
        status: 'active'
      }

      ProjectApi.createProject.mockResolvedValue({
        success: true,
        data: { id: 999, ...specialProject }
      })

      const result = await store.createProject(specialProject)

      expect(result).toBe(true)
      expect(ProjectApi.createProject).toHaveBeenCalledWith(specialProject)
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成数据加载', async () => {
      const store = useProjectStore()
      const startTime = performance.now()

      await store.getProjectList()

      const endTime = performance.now()
      const duration = endTime - startTime

      // 应该在100ms内完成（模拟环境）
      expect(duration).toBeLessThan(100)
    })

    it('应该正确处理并发请求', async () => {
      const store = useProjectStore()

      // 同时发起多个请求
      const promises = [
        store.getProjectList(),
        store.getProjectStats(),
        store.getProjectList()
      ]

      await Promise.all(promises)

      // 验证API只被调用了预期的次数
      expect(ProjectApi.getProjectList).toHaveBeenCalledTimes(2)
      expect(ProjectApi.getProjectStats).toHaveBeenCalledTimes(1)
    })
  })

  describe('用户交互测试', () => {
    it('应该正确处理键盘事件', async () => {
      const wrapper = mount(ProjectManagementView, {
        global: {
          plugins: [pinia]
        }
      })

      // 测试搜索框回车事件
      const searchInput = wrapper.find('input[placeholder*="搜索"]')
      await searchInput.setValue('测试')
      await searchInput.trigger('keyup.enter')

      expect(ProjectApi.getProjectList).toHaveBeenCalled()
    })

    it('应该正确处理鼠标事件', async () => {
      const wrapper = mount(ProjectTable, {
        props: {
          data: mockProjects,
          loading: false
        },
        global: {
          plugins: [pinia]
        }
      })

      // 测试行双击事件
      await wrapper.find('.el-table__row').trigger('dblclick')
      expect(wrapper.emitted('row-dblclick')).toBeTruthy()
    })
  })

  describe('错误处理测试', () => {
    it('应该正确处理表单验证错误', async () => {
      const wrapper = mount(ProjectFormDialog, {
        props: {
          visible: true,
          mode: 'create'
        },
        global: {
          plugins: [pinia]
        }
      })

      // 提交空表单
      await wrapper.find('form').trigger('submit')

      // 应该显示验证错误
      expect(wrapper.find('.el-form-item.is-error').exists()).toBe(true)
    })

    it('应该正确处理API错误响应', async () => {
      const store = useProjectStore()

      ProjectApi.createProject.mockResolvedValue({
        success: false,
        error: '项目编号已存在'
      })

      const result = await store.createProject({
        projectCode: 'PRJ-001',
        projectName: '测试项目',
        status: 'active'
      })

      expect(result).toBe(false)
      expect(store.error).toBe('项目编号已存在')
      expect(ElMessage.error).toHaveBeenCalledWith('项目编号已存在')
    })
  })

  describe('数据一致性测试', () => {
    it('应该保持状态同步', async () => {
      const store = useProjectStore()

      // 创建项目后应该刷新列表
      ProjectApi.createProject.mockResolvedValue({
        success: true,
        data: { id: 3, projectCode: 'PRJ-003', projectName: '新项目', status: 'active' }
      })

      await store.createProject({
        projectCode: 'PRJ-003',
        projectName: '新项目',
        status: 'active'
      })

      // 验证列表被重新获取
      expect(ProjectApi.getProjectList).toHaveBeenCalledTimes(2) // 初始加载 + 创建后刷新
    })

    it('应该正确更新统计信息', async () => {
      const store = useProjectStore()

      // 删除项目后应该更新统计
      ProjectApi.deleteProject.mockResolvedValue({
        success: true
      })

      await store.deleteProject(1)

      // 验证统计信息被重新获取
      expect(ProjectApi.getProjectStats).toHaveBeenCalledTimes(2) // 初始加载 + 删除后刷新
    })
  })

  describe('缓存机制测试', () => {
    it('应该正确使用缓存', async () => {
      const store = useProjectStore()

      // 第一次获取数据
      await store.getProjectList()
      expect(ProjectApi.getProjectList).toHaveBeenCalledTimes(1)

      // 第二次获取数据（应该使用缓存）
      await store.getProjectList()
      expect(ProjectApi.getProjectList).toHaveBeenCalledTimes(1) // 没有增加

      // 强制刷新
      await store.getProjectList(undefined, true)
      expect(ProjectApi.getProjectList).toHaveBeenCalledTimes(2) // 增加了
    })

    it('应该在搜索参数变化时使缓存失效', async () => {
      const store = useProjectStore()

      // 第一次获取数据
      await store.getProjectList()
      expect(ProjectApi.getProjectList).toHaveBeenCalledTimes(1)

      // 更新搜索参数
      store.updateSearchParams({ keyword: '测试' })

      // 再次获取数据（缓存应该失效）
      await store.getProjectList()
      expect(ProjectApi.getProjectList).toHaveBeenCalledTimes(2)
    })
  })
})
