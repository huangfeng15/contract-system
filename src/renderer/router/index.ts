import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/projectManagement'
  },
  {
    path: '/dataImport',
    name: 'DataImport',
    component: () => import('@/views/dataImport/DataImportView.vue'),
    meta: {
      title: '数据导入',
      icon: 'Upload'
    }
  },
  {
    path: '/contractManagement',
    name: 'ContractManagement',
    component: () => import('@/views/contractManagement/ContractManagementView.vue'),
    meta: {
      title: '合同管理',
      icon: 'Document'
    }
  },
  {
    path: '/procurementManagement',
    name: 'ProcurementManagement',
    component: () => import('@/views/procurementManagement/ProcurementManagementView.vue'),
    meta: {
      title: '采购管理',
      icon: 'ShoppingCart'
    }
  },
  {
    path: '/projectManagement',
    name: 'ProjectManagement',
    component: () => import('@/views/projectManagement/ProjectManagementView.vue'),
    meta: {
      title: '项目管理',
      icon: 'Folder'
    }
  },
  {
    path: '/fieldManagement',
    name: 'FieldManagement',
    component: () => import('@/views/fieldManagement/FieldManagementView.vue'),
    meta: {
      title: '字段管理',
      icon: 'Setting'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 管理系统`
  }

  // 权限检查（如果需要）
  if (to.meta?.permissions) {
    // 这里可以添加权限验证逻辑
    // const hasPermission = checkPermissions(to.meta.permissions)
    // if (!hasPermission) {
    //   next('/unauthorized')
    //   return
    // }
  }

  // 页面加载进度条（如果需要）
  if (to.name !== from.name) {
    // 可以在这里添加页面加载进度条
    console.log(`导航到: ${to.meta?.title || to.name}`)
  }

  next()
})

router.afterEach((to, from) => {
  // 页面加载完成后的处理
  if (to.meta?.description) {
    // 可以设置页面描述等SEO信息
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', to.meta.description as string)
    }
  }

  // 记录页面访问日志
  console.log(`页面访问: ${from.path} -> ${to.path}`)
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  // 可以在这里添加错误上报逻辑
})

export default router
