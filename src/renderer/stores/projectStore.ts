import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { Project } from '@shared/types/database'

export interface ProjectState {
  projects: Project[]
  loading: boolean
  error: string | null
  searchKeyword: string
  statusFilter: string
  currentPage: number
  pageSize: number
  total: number
  selectedProjects: Project[]
}

export interface ProjectStats {
  total: number
  active: number
  inactive: number
  archived: number
}

export const useProjectStore = defineStore('project', () => {
  // 状态
  const state = reactive<ProjectState>({
    projects: [],
    loading: false,
    error: null,
    searchKeyword: '',
    statusFilter: '',
    currentPage: 1,
    pageSize: 20,
    total: 0,
    selectedProjects: []
  })

  const stats = reactive<ProjectStats>({
    total: 0,
    active: 0,
    inactive: 0,
    archived: 0
  })

  // 计算属性
  const filteredProjects = computed(() => {
    let filtered = state.projects

    // 状态筛选
    if (state.statusFilter) {
      filtered = filtered.filter(project => project.status === state.statusFilter)
    }

    // 关键词搜索
    if (state.searchKeyword) {
      const keyword = state.searchKeyword.toLowerCase()
      filtered = filtered.filter(project =>
        project.projectName.toLowerCase().includes(keyword) ||
        project.projectCode.toLowerCase().includes(keyword) ||
        (project.projectAlias && project.projectAlias.toLowerCase().includes(keyword)) ||
        (project.description && project.description.toLowerCase().includes(keyword))
      )
    }

    return filtered
  })

  const hasSelection = computed(() => state.selectedProjects.length > 0)

  const isAllSelected = computed(() => {
    return state.projects.length > 0 && state.selectedProjects.length === state.projects.length
  })

  // 方法
  const setLoading = (loading: boolean) => {
    state.loading = loading
  }

  const setError = (error: string | null) => {
    state.error = error
  }

  const setProjects = (projects: Project[]) => {
    state.projects = projects
    updateStats()
  }

  const addProject = (project: Project) => {
    state.projects.unshift(project)
    updateStats()
  }

  const updateProject = (updatedProject: Project) => {
    const index = state.projects.findIndex(p => p.id === updatedProject.id)
    if (index !== -1) {
      state.projects[index] = updatedProject
      updateStats()
    }
  }

  const removeProject = (projectId: number) => {
    state.projects = state.projects.filter(p => p.id !== projectId)
    state.selectedProjects = state.selectedProjects.filter(p => p.id !== projectId)
    updateStats()
  }

  const setSearchKeyword = (keyword: string) => {
    state.searchKeyword = keyword
    state.currentPage = 1
  }

  const setStatusFilter = (status: string) => {
    state.statusFilter = status
    state.currentPage = 1
  }

  const setCurrentPage = (page: number) => {
    state.currentPage = page
  }

  const setPageSize = (size: number) => {
    state.pageSize = size
    state.currentPage = 1
  }

  const setTotal = (total: number) => {
    state.total = total
  }

  const toggleProjectSelection = (project: Project) => {
    const index = state.selectedProjects.findIndex(p => p.id === project.id)
    if (index === -1) {
      state.selectedProjects.push(project)
    } else {
      state.selectedProjects.splice(index, 1)
    }
  }

  const selectAllProjects = () => {
    state.selectedProjects = [...state.projects]
  }

  const clearSelection = () => {
    state.selectedProjects = []
  }

  const updateStats = () => {
    stats.total = state.projects.length
    stats.active = state.projects.filter(p => p.status === 'active').length
    stats.inactive = state.projects.filter(p => p.status === 'inactive').length
    stats.archived = state.projects.filter(p => p.status === 'archived').length
  }

  const resetState = () => {
    state.projects = []
    state.loading = false
    state.error = null
    state.searchKeyword = ''
    state.statusFilter = ''
    state.currentPage = 1
    state.pageSize = 20
    state.total = 0
    state.selectedProjects = []
    stats.total = 0
    stats.active = 0
    stats.inactive = 0
    stats.archived = 0
  }

  return {
    // 状态
    state,
    stats,
    
    // 计算属性
    filteredProjects,
    hasSelection,
    isAllSelected,
    
    // 方法
    setLoading,
    setError,
    setProjects,
    addProject,
    updateProject,
    removeProject,
    setSearchKeyword,
    setStatusFilter,
    setCurrentPage,
    setPageSize,
    setTotal,
    toggleProjectSelection,
    selectAllProjects,
    clearSelection,
    updateStats,
    resetState
  }
})
