import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const loading = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const language = ref('zh-CN')
  const sidebarCollapsed = ref(false)
  const version = ref('')

  // 计算属性
  const isDarkTheme = computed(() => theme.value === 'dark')

  // 方法
  const setLoading = (value: boolean): void => {
    loading.value = value
  }

  const setTheme = (newTheme: 'light' | 'dark'): void => {
    theme.value = newTheme
    // 应用主题到document
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const setLanguage = (newLanguage: string): void => {
    language.value = newLanguage
  }

  const toggleSidebar = (): void => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed: boolean): void => {
    sidebarCollapsed.value = collapsed
  }

  const setVersion = (newVersion: string): void => {
    version.value = newVersion
  }

  // 初始化应用
  const initApp = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // 获取应用版本
      if (window.electronAPI) {
        const appVersion = await window.electronAPI.system.getVersion()
        setVersion(appVersion)
      }
      
      // 从本地存储恢复设置
      const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark'
      if (savedTheme) {
        setTheme(savedTheme)
      }
      
      const savedLanguage = localStorage.getItem('app-language')
      if (savedLanguage) {
        setLanguage(savedLanguage)
      }
      
      const savedSidebarState = localStorage.getItem('sidebar-collapsed')
      if (savedSidebarState) {
        setSidebarCollapsed(JSON.parse(savedSidebarState))
      }
      
    } catch (error) {
      console.error('应用初始化失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 保存设置到本地存储
  const saveSettings = (): void => {
    localStorage.setItem('app-theme', theme.value)
    localStorage.setItem('app-language', language.value)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed.value))
  }

  return {
    // 状态
    loading,
    theme,
    language,
    sidebarCollapsed,
    version,
    
    // 计算属性
    isDarkTheme,
    
    // 方法
    setLoading,
    setTheme,
    setLanguage,
    toggleSidebar,
    setSidebarCollapsed,
    setVersion,
    initApp,
    saveSettings
  }
})
