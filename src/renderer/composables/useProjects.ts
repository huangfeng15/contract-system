/**
 * 项目管理组合式函数
 * 封装项目相关的业务逻辑和状态管理
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ProjectApi } from '@renderer/api/projectApi'
import { useProjectStore } from '@renderer/stores/projectStore'
import { PAGINATION_CONFIG, SEARCH_CONFIG, MESSAGE_CONFIG } from '@shared/constants/projectManagement'
import type {
  IProjectFormData,
  IProjectSearchParams,
  IProjectStats,
  IProjectValidationRules
} from '@renderer/types/Project.types'
import type { Project } from '@shared/types/database'

/**
 * 项目列表管理
 */
export function useProjectList() {
  const projectStore = useProjectStore()

  // 响应式状态
  const loading = ref(false)
  const refreshing = ref(false)
  const searchParams = reactive<IProjectSearchParams>({
    page: PAGINATION_CONFIG.DEFAULT_PAGE,
    pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    keyword: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // 计算属性
  const hasData = computed(() => projectStore.projects.length > 0)
  const isEmpty = computed(() => !loading.value && !hasData.value)
  const totalPages = computed(() => projectStore.pagination.totalPages)
  const currentPage = computed(() => projectStore.pagination.page)

  // 加载项目列表
  const loadProjects = async (showLoading = true) => {
    try {
      if (showLoading) {
        loading.value = true
      }

      const response = await ProjectApi.getProjectList(searchParams)

      if (response.success && response.data) {
        projectStore.setProjects(response.data)
      } else {
        ElMessage.error(response.error || MESSAGE_CONFIG.ERROR.LOAD)
      }
    } catch (error) {
      console.error('加载项目列表失败:', error)
      ElMessage.error(MESSAGE_CONFIG.ERROR.NETWORK)
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  // 刷新数据
  const refreshData = async () => {
    refreshing.value = true
    await loadProjects(false)
    ElMessage.success('数据已刷新')
  }

  // 搜索项目
  const searchProjects = async (keyword: string) => {
    searchParams.keyword = keyword
    searchParams.page = 1
    await loadProjects()
  }

  // 筛选项目
  const filterProjects = async (filters: Partial<IProjectSearchParams>) => {
    Object.assign(searchParams, filters)
    searchParams.page = 1
    await loadProjects()
  }

  // 分页处理
  const handlePageChange = async (page: number) => {
    searchParams.page = page
    await loadProjects()
  }

  const handlePageSizeChange = async (pageSize: number) => {
    searchParams.pageSize = pageSize
    searchParams.page = 1
    await loadProjects()
  }

  // 排序处理
  const handleSortChange = async (sortBy: string, sortOrder: 'asc' | 'desc') => {
    searchParams.sortBy = sortBy
    searchParams.sortOrder = sortOrder
    await loadProjects()
  }

  // 重置搜索
  const resetSearch = async () => {
    Object.assign(searchParams, {
      page: PAGINATION_CONFIG.DEFAULT_PAGE,
      pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
      keyword: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    await loadProjects()
  }

  return {
    // 状态
    loading,
    refreshing,
    searchParams,

    // 计算属性
    hasData,
    isEmpty,
    totalPages,
    currentPage,

    // 方法
    loadProjects,
    refreshData,
    searchProjects,
    filterProjects,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    resetSearch
  }
}

/**
 * 项目表单管理
 */
export function useProjectForm() {
  const projectStore = useProjectStore()

  // 表单状态
  const formVisible = ref(false)
  const formMode = ref<'create' | 'edit'>('create')
  const formLoading = ref(false)
  const formData = reactive<IProjectFormData>({
    projectCode: '',
    projectName: '',
    projectAlias: '',
    description: '',
    status: 'active'
  })

  // 当前编辑的项目
  const currentProject = ref<Project | null>(null)

  // 表单验证规则
  const validationRules: IProjectValidationRules = {
    projectCode: [
      { required: true, message: '请输入项目编号', trigger: 'blur' },
      { pattern: /^[A-Za-z0-9_-]+$/, message: '项目编号只能包含字母、数字、下划线和横线', trigger: 'blur' }
    ],
    projectName: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { min: 1, max: 200, message: '项目名称长度在1到200个字符', trigger: 'blur' }
    ],
    projectAlias: [
      { max: 500, message: '项目别名长度不能超过500个字符', trigger: 'blur' }
    ],
    description: [
      { max: 1000, message: '项目描述长度不能超过1000个字符', trigger: 'blur' }
    ]
  }

  // 打开创建表单
  const openCreateForm = () => {
    formMode.value = 'create'
    resetForm()
    formVisible.value = true
  }

  // 打开编辑表单
  const openEditForm = (project: Project) => {
    formMode.value = 'edit'
    currentProject.value = project
    Object.assign(formData, {
      projectCode: project.projectCode,
      projectName: project.projectName,
      projectAlias: project.projectAlias || '',
      description: project.description || '',
      status: project.status
    })
    formVisible.value = true
  }

  // 关闭表单
  const closeForm = () => {
    formVisible.value = false
    resetForm()
    currentProject.value = null
  }

  // 重置表单
  const resetForm = () => {
    Object.assign(formData, {
      projectCode: '',
      projectName: '',
      projectAlias: '',
      description: '',
      status: 'active'
    })
  }

  // 提交表单
  const submitForm = async () => {
    try {
      formLoading.value = true

      let response
      if (formMode.value === 'create') {
        response = await ProjectApi.createProject(formData)
      } else {
        response = await ProjectApi.updateProject(currentProject.value!.id, formData)
      }

      if (response.success) {
        ElMessage.success(response.message || MESSAGE_CONFIG.SUCCESS.CREATE)
        closeForm()
        // 刷新项目列表
        await projectStore.getProjectList()
        return true
      } else {
        ElMessage.error(response.error || MESSAGE_CONFIG.ERROR.CREATE)
        return false
      }
    } catch (error) {
      console.error('提交表单失败:', error)
      ElMessage.error(MESSAGE_CONFIG.ERROR.NETWORK)
      return false
    } finally {
      formLoading.value = false
    }
  }

  return {
    // 状态
    formVisible,
    formMode,
    formLoading,
    formData,
    currentProject,
    validationRules,

    // 方法
    openCreateForm,
    openEditForm,
    closeForm,
    resetForm,
    submitForm
  }
}

/**
 * 项目操作管理
 */
export function useProjectActions() {
  const projectStore = useProjectStore()

  // 删除项目
  const deleteProject = async (project: Project) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除项目"${project.projectName}"吗？`,
        MESSAGE_CONFIG.WARNING.DELETE_CONFIRM,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      const response = await ProjectApi.deleteProject(project.id)

      if (response.success) {
        ElMessage.success(response.message || MESSAGE_CONFIG.SUCCESS.DELETE)
        // 刷新项目列表
        await projectStore.getProjectList()
      } else {
        ElMessage.error(response.error || MESSAGE_CONFIG.ERROR.DELETE)
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除项目失败:', error)
        ElMessage.error(MESSAGE_CONFIG.ERROR.NETWORK)
      }
    }
  }

  return {
    deleteProject
  }
}

/**
 * 项目统计管理
 */
export function useProjectStats() {
  const stats = ref<IProjectStats | null>(null)
  const loading = ref(false)

  // 加载统计数据
  const loadStats = async () => {
    try {
      loading.value = true
      const response = await ProjectApi.getProjectStats()

      if (response.success && response.data) {
        stats.value = response.data
      } else {
        console.error('获取统计数据失败:', response.error)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    loading,
    loadStats
  }
}
