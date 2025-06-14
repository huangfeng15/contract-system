<template>
  <div class="app-sidebar">
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      :unique-opened="true"
      router
      class="sidebar-menu"
    >
      <el-menu-item
        v-for="route in menuRoutes"
        :key="route.path"
        :index="route.path"
        @click="handleMenuClick(route)"
      >
        <el-icon>
          <component :is="route.meta?.icon" />
        </el-icon>
        <template #title>
          <span>{{ route.meta?.title }}</span>
        </template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 计算属性
const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)

// 菜单路由配置
const menuRoutes = computed(() => [
  {
    path: '/projectManagement',
    meta: {
      title: '项目管理',
      icon: 'Folder'
    }
  },
  {
    path: '/fieldManagement',
    meta: {
      title: '字段管理',
      icon: 'Setting'
    }
  },
  {
    path: '/dataImport',
    meta: {
      title: '数据导入',
      icon: 'Upload'
    }
  },
  {
    path: '/contractManagement',
    meta: {
      title: '合同管理',
      icon: 'Document'
    }
  },
  {
    path: '/procurementManagement',
    meta: {
      title: '采购管理',
      icon: 'ShoppingCart'
    }
  }
])

// 方法
const handleMenuClick = (menuRoute: any): void => {
  router.push(menuRoute.path)
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #e0f2fe 0%, #b3e5fc 100%);
  border-right: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  box-shadow: 2px 0 10px rgba(59, 130, 246, 0.1);

  // 高端纹理背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
    pointer-events: none;
  }

  // 左侧装饰线
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
    opacity: 1;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  }
}

.sidebar-menu {
  border-right: none;
  height: 100%;
  background: transparent;
  padding: 24px 16px;
  position: relative;
  z-index: 1;

  :deep(.el-menu-item) {
    height: 56px;
    line-height: 56px;
    border-radius: 12px;
    margin-bottom: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    border: 1px solid transparent;

    // 默认状态
    background: rgba(255, 255, 255, 0.6);
    color: #1e293b;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.1);

    // 悬停效果
    &:hover {
      background: rgba(59, 130, 246, 0.2);
      color: #1e293b;
      border-color: rgba(59, 130, 246, 0.4);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      &::before {
        opacity: 1;
        transform: translateX(0);
      }
    }

    // 激活状态
    &.is-active {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-color: rgba(59, 130, 246, 0.8);
      transform: translateX(8px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 60%;
        background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
        border-radius: 0 8px 8px 0;
        box-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
      }

      // 激活状态的光效
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent);
        transition: left 0.6s ease;
        opacity: 1;
        transform: translateX(100%);
      }
    }

    // 悬停光效
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent);
      transition: all 0.5s ease;
      opacity: 0;
      transform: translateX(-20px);
    }
  }

  :deep(.el-icon) {
    margin-right: var(--app-spacing-md);
    font-size: 20px;
    transition: all var(--app-transition-fast);

    // 图标动画效果
    .el-menu-item:hover & {
      transform: scale(1.1);
    }

    .el-menu-item.is-active & {
      transform: scale(1.15);
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
    }
  }

  // 菜单项文字
  :deep(.el-menu-item span) {
    font-weight: var(--app-font-medium);
    letter-spacing: 0.025em;
    transition: all var(--app-transition-fast);
  }

  // 折叠状态样式
  &.el-menu--collapse {
    padding: var(--app-spacing-lg) var(--app-spacing-sm);

    :deep(.el-menu-item) {
      padding: 0 var(--app-spacing-lg);
      justify-content: center;

      .el-icon {
        margin-right: 0;
        font-size: 24px;
      }

      // 折叠状态的工具提示
      &::after {
        content: attr(data-title);
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        background: var(--app-gray-800);
        color: white;
        padding: var(--app-spacing-sm) var(--app-spacing-md);
        border-radius: var(--app-radius-md);
        font-size: var(--app-text-sm);
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all var(--app-transition-fast);
        z-index: var(--app-z-tooltip);
        margin-left: var(--app-spacing-md);
        box-shadow: var(--app-shadow-lg);
      }

      &:hover::after {
        opacity: 1;
        visibility: visible;
        transform: translateY(-50%) translateX(4px);
      }
    }
  }
}

// 侧边栏底部装饰
.app-sidebar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--app-gradient-accent);
  opacity: 0.6;
}

// 响应式设计
@media (max-width: 1200px) {
  .sidebar-menu {
    padding: var(--app-spacing-md) var(--app-spacing-sm);

    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;

      .el-icon {
        font-size: 18px;
      }
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .app-sidebar {
    background: var(--app-bg-primary);
    border-right-color: var(--app-border-light);
  }

  .sidebar-menu {
    :deep(.el-menu-item) {
      background: var(--app-bg-tertiary);
      color: var(--app-text-secondary);

      &:hover {
        background: var(--app-primary-lightest);
        color: var(--app-primary-color);
      }

      &.is-active {
        background: var(--app-gradient-primary);
        color: white;
      }
    }
  }
}
</style>
