<template>
  <div :class="cardClasses" @click="handleClick">
    <!-- 背景装饰 -->
    <div class="stat-background"></div>
    
    <!-- 顶部装饰线 -->
    <div class="stat-accent" :style="accentStyle"></div>
    
    <!-- 图标 -->
    <div class="stat-icon-wrapper">
      <el-icon class="stat-icon">
        <component :is="icon" />
      </el-icon>
    </div>
    
    <!-- 数值和标签 -->
    <div class="stat-content">
      <div class="stat-number" :style="numberStyle">
        {{ formattedValue }}
      </div>
      <div class="stat-label">
        {{ label }}
      </div>
      
      <!-- 趋势指示器 -->
      <div v-if="trend" class="stat-trend" :class="`trend--${trend.type}`">
        <el-icon class="trend-icon">
          <ArrowUp v-if="trend.type === 'up'" />
          <ArrowDown v-if="trend.type === 'down'" />
          <Minus v-if="trend.type === 'stable'" />
        </el-icon>
        <span class="trend-text">{{ trend.value }}</span>
      </div>
    </div>
    
    <!-- 悬浮光效 -->
    <div class="stat-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

interface Trend {
  type: 'up' | 'down' | 'stable'
  value: string
}

interface Props {
  value: number | string
  label: string
  icon: string
  color?: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: Trend
  clickable?: boolean
  loading?: boolean
  prefix?: string
  suffix?: string
  precision?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'var(--app-primary-color)',
  type: 'primary',
  clickable: false,
  loading: false,
  prefix: '',
  suffix: '',
  precision: 0
})

const emit = defineEmits<{
  click: []
}>()

const cardClasses = computed(() => [
  'stat-card',
  `stat-card--${props.type}`,
  {
    'stat-card--clickable': props.clickable,
    'stat-card--loading': props.loading,
  }
])

const accentStyle = computed(() => ({
  background: props.color
}))

const numberStyle = computed(() => ({
  color: props.color
}))

const formattedValue = computed(() => {
  if (props.loading) return '---'
  
  let value = props.value
  if (typeof value === 'number') {
    value = value.toFixed(props.precision)
  }
  
  return `${props.prefix}${value}${props.suffix}`
})

const handleClick = () => {
  if (props.clickable && !props.loading) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
.stat-card {
  position: relative;
  background: var(--app-bg-primary);
  border: 1px solid var(--app-border-light);
  border-radius: var(--app-radius-xl);
  padding: var(--app-spacing-xl);
  text-align: center;
  min-width: 160px;
  transition: all var(--app-transition-normal);
  overflow: hidden;
  box-shadow: var(--app-shadow-md);
  
  // 背景装饰
  .stat-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      var(--app-bg-primary) 0%, 
      var(--app-bg-tertiary) 100%);
    opacity: 0.3;
    transition: opacity var(--app-transition-normal);
  }
  
  // 顶部装饰线
  .stat-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--app-primary-color);
    border-radius: var(--app-radius-xl) var(--app-radius-xl) 0 0;
  }
  
  // 悬浮效果
  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: var(--app-shadow-2xl);
    border-color: var(--app-primary-light);
    
    .stat-background {
      opacity: 0.6;
    }
    
    .stat-glow {
      opacity: 1;
    }
    
    .stat-icon {
      transform: scale(1.2) rotate(5deg);
    }
    
    .stat-number {
      transform: scale(1.1);
    }
  }
  
  // 可点击状态
  &--clickable {
    cursor: pointer;
    
    &:active {
      transform: translateY(-2px) scale(1.01);
    }
  }
  
  // 加载状态
  &--loading {
    .stat-icon,
    .stat-number {
      opacity: 0.5;
      animation: pulse 2s infinite;
    }
  }
  
  // 类型变体
  &--primary {
    .stat-accent {
      background: var(--app-gradient-primary);
    }
  }
  
  &--success {
    .stat-accent {
      background: var(--app-gradient-success);
    }
    
    .stat-icon {
      color: var(--app-success-color);
    }
    
    .stat-number {
      color: var(--app-success-color);
    }
  }
  
  &--warning {
    .stat-accent {
      background: linear-gradient(135deg, var(--app-warning-color) 0%, var(--app-warning-light) 100%);
    }
    
    .stat-icon {
      color: var(--app-warning-color);
    }
    
    .stat-number {
      color: var(--app-warning-color);
    }
  }
  
  &--danger {
    .stat-accent {
      background: linear-gradient(135deg, var(--app-danger-color) 0%, var(--app-danger-light) 100%);
    }
    
    .stat-icon {
      color: var(--app-danger-color);
    }
    
    .stat-number {
      color: var(--app-danger-color);
    }
  }
  
  &--info {
    .stat-accent {
      background: linear-gradient(135deg, var(--app-info-color) 0%, var(--app-info-light) 100%);
    }
    
    .stat-icon {
      color: var(--app-info-color);
    }
    
    .stat-number {
      color: var(--app-info-color);
    }
  }
}

// 图标容器
.stat-icon-wrapper {
  position: relative;
  z-index: 1;
  margin-bottom: var(--app-spacing-md);
  
  .stat-icon {
    font-size: var(--app-text-3xl);
    color: var(--app-primary-color);
    transition: all var(--app-transition-normal);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
}

// 内容区域
.stat-content {
  position: relative;
  z-index: 1;
}

// 数值
.stat-number {
  display: block;
  font-size: var(--app-text-4xl);
  font-weight: var(--app-font-extrabold);
  color: var(--app-primary-color);
  margin-bottom: var(--app-spacing-xs);
  line-height: var(--app-leading-tight);
  transition: all var(--app-transition-normal);
  font-family: var(--app-font-mono);
  letter-spacing: -0.025em;
}

// 标签
.stat-label {
  font-size: var(--app-text-sm);
  color: var(--app-text-secondary);
  font-weight: var(--app-font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--app-spacing-sm);
}

// 趋势指示器
.stat-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-spacing-xs);
  font-size: var(--app-text-xs);
  font-weight: var(--app-font-medium);
  
  .trend-icon {
    font-size: var(--app-text-sm);
  }
  
  &.trend--up {
    color: var(--app-success-color);
  }
  
  &.trend--down {
    color: var(--app-danger-color);
  }
  
  &.trend--stable {
    color: var(--app-text-tertiary);
  }
}

// 发光效果
.stat-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: var(--app-gradient-primary);
  border-radius: var(--app-radius-xl);
  opacity: 0;
  transition: opacity var(--app-transition-normal);
  z-index: -1;
  filter: blur(8px);
}

// 动画
@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stat-card {
    min-width: 120px;
    padding: var(--app-spacing-lg);
    
    .stat-icon {
      font-size: var(--app-text-2xl);
    }
    
    .stat-number {
      font-size: var(--app-text-3xl);
    }
    
    .stat-label {
      font-size: var(--app-text-xs);
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .stat-card {
    background: var(--app-bg-primary);
    border-color: var(--app-border-light);
    
    .stat-background {
      background: linear-gradient(135deg, 
        var(--app-bg-primary) 0%, 
        var(--app-bg-tertiary) 100%);
    }
  }
}
</style>
