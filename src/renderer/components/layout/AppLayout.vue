<template>
  <el-container class="app-layout">
    <!-- 顶部标题栏 -->
    <el-header class="app-header">
      <AppHeader />
    </el-header>

    <!-- 主体内容 -->
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="sidebarWidth" class="app-sidebar">
        <AppSidebar />
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const appStore = useAppStore()

// 计算侧边栏宽度
const sidebarWidth = computed(() => {
  return appStore.sidebarCollapsed ? '64px' : '240px'
})

// 组件挂载时初始化应用
onMounted(async () => {
  await appStore.initApp()
})
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
  background: var(--app-bg-secondary);
  position: relative;

  // 全局背景纹理
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, var(--app-primary-lightest) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, var(--app-accent-lightest) 0%, transparent 50%);
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }
}

.app-header {
  height: 72px;
  background: var(--app-bg-primary);
  border-bottom: 1px solid var(--app-border-light);
  display: flex;
  align-items: center;
  padding: 0;
  z-index: var(--app-z-sticky);
  position: relative;
  box-shadow: var(--app-shadow-sm);

  // 头部装饰线
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--app-gradient-primary);
    opacity: 0.8;
  }
}

.app-sidebar {
  background: var(--app-bg-primary);
  border-right: 1px solid var(--app-border-light);
  transition: all var(--app-transition-normal);
  overflow: hidden;
  position: relative;
  z-index: var(--app-z-fixed);
  box-shadow: var(--app-shadow-md);

  // 侧边栏渐变背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg,
      var(--app-bg-primary) 0%,
      var(--app-bg-secondary) 100%);
    opacity: 0.5;
    pointer-events: none;
  }
}

.app-main {
  background: var(--app-bg-secondary);
  padding: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;

  // 主内容区装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--app-border-light) 50%,
      transparent 100%);
  }

  // 内容区域样式
  :deep(.el-scrollbar) {
    height: 100%;

    .el-scrollbar__wrap {
      overflow-x: hidden;
    }

    .el-scrollbar__view {
      padding: var(--app-spacing-lg);
      min-height: 100%;
    }
  }

  // 页面内容容器
  :deep(.page-container) {
    max-width: 1400px;
    margin: 0 auto;
    background: var(--app-bg-primary);
    border-radius: var(--app-radius-xl);
    box-shadow: var(--app-shadow-lg);
    overflow: hidden;
    position: relative;

    // 容器装饰
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--app-gradient-primary);
    }
  }

  // 卡片容器增强
  :deep(.el-card) {
    border-radius: var(--app-radius-xl);
    border: 1px solid var(--app-border-light);
    box-shadow: var(--app-shadow-md);
    transition: all var(--app-transition-normal);
    overflow: hidden;

    &:hover {
      box-shadow: var(--app-shadow-xl);
      transform: translateY(-2px);
      border-color: var(--app-primary-light);
    }

    .el-card__header {
      background: linear-gradient(135deg,
        var(--app-bg-tertiary) 0%,
        var(--app-bg-secondary) 100%);
      border-bottom: 1px solid var(--app-border-light);
      padding: var(--app-spacing-lg) var(--app-spacing-xl);
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: var(--app-spacing-xl);
        right: var(--app-spacing-xl);
        height: 1px;
        background: var(--app-gradient-primary);
        opacity: 0.3;
      }
    }

    .el-card__body {
      padding: var(--app-spacing-xl);
      background: var(--app-bg-primary);
    }
  }
}

// 响应式布局
@media (max-width: 1400px) {
  .app-main {
    :deep(.page-container) {
      max-width: 100%;
      margin: 0 var(--app-spacing-md);
      border-radius: var(--app-radius-lg);
    }
  }
}

@media (max-width: 768px) {
  .app-header {
    height: 64px;
  }

  .app-main {
    :deep(.el-scrollbar__view) {
      padding: var(--app-spacing-md);
    }

    :deep(.page-container) {
      margin: 0;
      border-radius: 0;
      box-shadow: none;
    }

    :deep(.el-card) {
      border-radius: var(--app-radius-lg);
      margin-bottom: var(--app-spacing-md);

      .el-card__header,
      .el-card__body {
        padding: var(--app-spacing-lg);
      }
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .app-layout {
    background: var(--app-bg-secondary);

    &::before {
      opacity: 0.1;
    }
  }

  .app-header {
    background: var(--app-bg-primary);
    border-bottom-color: var(--app-border-light);
  }

  .app-sidebar {
    background: var(--app-bg-primary);
    border-right-color: var(--app-border-light);
  }

  .app-main {
    background: var(--app-bg-secondary);

    :deep(.page-container) {
      background: var(--app-bg-primary);
    }

    :deep(.el-card) {
      background: var(--app-bg-primary);
      border-color: var(--app-border-light);

      .el-card__header {
        background: var(--app-bg-tertiary);
        border-bottom-color: var(--app-border-light);
      }
    }
  }
}

// 加载动画
.app-layout {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 平滑过渡效果
.app-sidebar {
  &.collapsed {
    .sidebar-content {
      opacity: 0;
      transform: translateX(-20px);
    }
  }

  .sidebar-content {
    transition: all var(--app-transition-normal);
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
