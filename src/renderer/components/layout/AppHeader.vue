<template>
  <div class="app-header">
    <!-- 左侧：菜单折叠按钮和标题 -->
    <div class="header-left">
      <el-button
        :icon="Expand"
        text
        @click="toggleSidebar"
        class="sidebar-toggle"
      />
      <h1 class="app-title">合同采购信息管理系统</h1>
    </div>

    <!-- 右侧：工具栏 -->
    <div class="header-right">
      <!-- 主题切换 -->
      <el-tooltip content="切换主题" placement="bottom">
        <el-button
          :icon="isDarkTheme ? Sunny : Moon"
          text
          @click="toggleTheme"
          class="theme-toggle"
        />
      </el-tooltip>

      <!-- 版本信息 -->
      <span class="version-info">v{{ version }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Expand, Fold, Sunny, Moon } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

// 计算属性
const isDarkTheme = computed(() => appStore.isDarkTheme)
const version = computed(() => appStore.version)

// 方法
const toggleSidebar = (): void => {
  appStore.toggleSidebar()
  appStore.saveSettings()
}

const toggleTheme = (): void => {
  const newTheme = appStore.theme === 'light' ? 'dark' : 'light'
  appStore.setTheme(newTheme)
  appStore.saveSettings()
}
</script>

<style lang="scss" scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 var(--app-spacing-xl);
  background: var(--app-bg-primary);
  border-bottom: 1px solid var(--app-border-light);
  box-shadow: var(--app-shadow-sm);
  position: relative;
  -webkit-app-region: drag;

  // 高端渐变背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      var(--app-bg-primary) 0%,
      var(--app-bg-tertiary) 100%);
    opacity: 0.05;
    pointer-events: none;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-lg);
  z-index: 1;

  .sidebar-toggle {
    -webkit-app-region: no-drag;
    width: 40px;
    height: 40px;
    border-radius: var(--app-radius-lg);
    background: var(--app-bg-tertiary);
    border: 1px solid var(--app-border-light);
    color: var(--app-text-secondary);
    transition: all var(--app-transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--app-primary-lightest);
      color: var(--app-primary-color);
      border-color: var(--app-primary-light);
      transform: translateY(-1px);
      box-shadow: var(--app-shadow-md);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .app-title {
    font-size: var(--app-text-xl);
    font-weight: var(--app-font-bold);
    color: var(--app-text-primary);
    margin: 0;
    background: var(--app-gradient-primary);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.025em;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 30%;
      height: 2px;
      background: var(--app-accent-color);
      border-radius: var(--app-radius-full);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-md);
  z-index: 1;

  .theme-toggle {
    -webkit-app-region: no-drag;
    width: 40px;
    height: 40px;
    border-radius: var(--app-radius-lg);
    background: var(--app-bg-tertiary);
    border: 1px solid var(--app-border-light);
    color: var(--app-text-secondary);
    transition: all var(--app-transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--app-accent-lightest);
      color: var(--app-accent-color);
      border-color: var(--app-accent-light);
      transform: translateY(-1px);
      box-shadow: var(--app-shadow-md);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .version-info {
    font-size: var(--app-text-xs);
    font-weight: var(--app-font-medium);
    color: var(--app-text-tertiary);
    background: var(--app-bg-tertiary);
    padding: var(--app-spacing-xs) var(--app-spacing-sm);
    border-radius: var(--app-radius-full);
    border: 1px solid var(--app-border-light);
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }


}

// 响应式设计
@media (max-width: 1200px) {
  .app-header {
    padding: 0 var(--app-spacing-lg);
  }

  .header-left {
    gap: var(--app-spacing-md);

    .app-title {
      font-size: var(--app-text-lg);
    }
  }

  .header-right {
    gap: var(--app-spacing-sm);

    .version-info {
      display: none;
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .app-header {
    background: var(--app-bg-primary);
    border-bottom-color: var(--app-border-light);
  }
}
</style>
