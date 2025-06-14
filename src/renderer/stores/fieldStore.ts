import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFieldStore = defineStore('field', () => {
  // 状态
  const fieldConfig = ref<any[]>([])
  const loading = ref(false)

  // 方法
  const setLoading = (value: boolean): void => {
    loading.value = value
  }

  const setFieldConfig = (config: any[]): void => {
    fieldConfig.value = config
  }

  const getFieldConfig = async (): Promise<void> => {
    try {
      setLoading(true)
      
      if (window.electronAPI) {
        const response = await window.electronAPI.field.getConfig()
        if (response.success && response.data) {
          setFieldConfig(response.data)
        }
      }
    } catch (error) {
      console.error('获取字段配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFieldConfig = async (config: any[]): Promise<boolean> => {
    try {
      setLoading(true)
      
      if (window.electronAPI) {
        const response = await window.electronAPI.field.updateConfig(config)
        if (response.success) {
          setFieldConfig(config)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('更新字段配置失败:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const syncFieldColumns = async (): Promise<boolean> => {
    try {
      setLoading(true)
      
      if (window.electronAPI) {
        const response = await window.electronAPI.field.syncColumns()
        if (response.success) {
          // 重新获取字段配置
          await getFieldConfig()
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('同步字段列失败:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    // 状态
    fieldConfig,
    loading,
    
    // 方法
    setLoading,
    setFieldConfig,
    getFieldConfig,
    updateFieldConfig,
    syncFieldColumns
  }
})
