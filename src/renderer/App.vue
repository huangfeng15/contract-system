<template>
  <div id="app">
    <AppLayout />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

// 应用初始化
onMounted(() => {
  console.log('管理系统启动')

  // 检查Electron API是否可用
  if (window.electronAPI) {
    console.log('Electron API 已就绪')
  } else {
    console.warn('Electron API 不可用，可能在浏览器环境中运行')
  }
})
</script>

<style lang="scss">
#app {
  height: 100vh;
  overflow: hidden;
}

// 全局样式重置
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Element Plus 样式覆盖
.el-container {
  height: 100vh;
}

.el-header {
  padding: 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.el-aside {
  border-right: 1px solid var(--el-border-color-light);
}

.el-main {
  padding: 0;
  overflow: hidden;
}
</style>
