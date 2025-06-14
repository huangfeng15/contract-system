import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IPaginationParams, IPaginationResponse } from '@shared/types/common'

export const useContractStore = defineStore('contract', () => {
  // 状态
  const contracts = ref<any[]>([])
  const currentContract = ref<any | null>(null)
  const loading = ref(false)
  const pagination = ref<IPaginationResponse<any>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  })

  // 方法
  const setLoading = (value: boolean): void => {
    loading.value = value
  }

  const setContracts = (data: IPaginationResponse<any>): void => {
    contracts.value = data.items
    pagination.value = data
  }

  const setCurrentContract = (contract: any | null): void => {
    currentContract.value = contract
  }

  const getContractList = async (params: IPaginationParams): Promise<void> => {
    try {
      setLoading(true)
      
      if (window.electronAPI) {
        const response = await window.electronAPI.contract.getList(params)
        if (response.success && response.data) {
          setContracts(response.data)
        }
      }
    } catch (error) {
      console.error('获取合同列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getContractDetail = async (id: number): Promise<void> => {
    try {
      setLoading(true)
      
      if (window.electronAPI) {
        const response = await window.electronAPI.contract.getDetail(id)
        if (response.success && response.data) {
          setCurrentContract(response.data)
        }
      }
    } catch (error) {
      console.error('获取合同详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateContractProject = async (contractId: number, projectId: number): Promise<boolean> => {
    try {
      setLoading(true)
      
      if (window.electronAPI) {
        const response = await window.electronAPI.contract.updateProject(contractId, projectId)
        return response.success
      }
      
      return false
    } catch (error) {
      console.error('更新合同项目关联失败:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    // 状态
    contracts,
    currentContract,
    loading,
    pagination,
    
    // 方法
    setLoading,
    setContracts,
    setCurrentContract,
    getContractList,
    getContractDetail,
    updateContractProject
  }
})
