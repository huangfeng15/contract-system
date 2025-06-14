import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import './assets/styles/main.scss'
import './assets/styles/theme.scss'
import { ApiAdapter } from './services/ApiAdapter'

// 创建Vue应用实例
const app = createApp(App)

// 创建Pinia状态管理
const pinia = createPinia()

// 注册Element Plus
app.use(ElementPlus)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册路由
app.use(router)

// 注册状态管理
app.use(pinia)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

// 模拟Electron API（用于Web环境测试）
if (!window.electronAPI) {
  console.log('初始化Web环境模拟API')
  window.electronAPI = {
    system: {
      getVersion: () => Promise.resolve('1.0.0'),
      minimize: () => console.log('minimize'),
      maximize: () => console.log('maximize'),
      close: () => console.log('close')
    },
    contract: {
      getList: (params) => Promise.resolve({ success: true, data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 } }),
      getDetail: (id) => Promise.resolve({ success: true, data: null }),
      updateProject: (contractId, projectId) => Promise.resolve({ success: true })
    },
    // 添加项目管理相关的模拟API
    project: {
      findPaginated: (page, pageSize, options) => {
        console.log('模拟API: project:findPaginated', { page, pageSize, options })
        return Promise.resolve({ success: true, data: { items: [], total: 0, page, pageSize, totalPages: 0 } })
      },
      create: (projectData) => {
        console.log('模拟API: project:create', projectData)
        return Promise.resolve({ success: true, data: { id: Date.now(), ...projectData } })
      },
      update: (id, projectData) => {
        console.log('模拟API: project:update', { id, projectData })
        return Promise.resolve({ success: true, data: { id, ...projectData } })
      },
      delete: (id) => {
        console.log('模拟API: project:delete', id)
        return Promise.resolve({ success: true })
      },
      findById: (id) => {
        console.log('模拟API: project:findById', id)
        return Promise.resolve({ success: true, data: null })
      },
      searchByName: (searchTerm) => {
        console.log('模拟API: project:searchByName', searchTerm)
        return Promise.resolve({ success: true, data: [] })
      },
      getStats: () => {
        console.log('模拟API: project:getStats')
        return Promise.resolve({ success: true, data: { total: 0 } })
      }
    },
    import: {
      selectFiles: () => Promise.resolve({ success: true, data: [] }),
      start: (filePaths) => Promise.resolve({ success: true }),
      getProgress: () => Promise.resolve({ success: true, data: { total: 0, processed: 0, success: 0, failed: 0, percentage: 0, status: 'pending' } })
    },
    field: {
      getConfig: () => Promise.resolve({ success: true, data: [] }),
      updateConfig: (config) => Promise.resolve({ success: true }),
      syncColumns: () => Promise.resolve({ success: true })
    },
    on: () => {},
    off: () => {}
  }
}

// 初始化模拟数据（仅在Web环境中）
ApiAdapter.initializeMockData()

// 挂载应用
app.mount('#app')
