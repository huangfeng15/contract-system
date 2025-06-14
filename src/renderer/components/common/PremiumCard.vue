<template>
  <div :class="cardClasses" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <!-- 卡片装饰线 -->
    <div v-if="accent" class="card-accent" :style="accentStyle"></div>
    
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title" class="card-header">
      <div v-if="title" class="card-title">
        <el-icon v-if="icon" class="title-icon">
          <component :is="icon" />
        </el-icon>
        <h3>{{ title }}</h3>
        <div v-if="badge" class="title-badge" :class="`badge--${badgeType}`">
          {{ badge }}
        </div>
      </div>
      <slot name="header" />
      <div v-if="$slots.extra" class="card-extra">
        <slot name="extra" />
      </div>
    </div>
    
    <!-- 卡片内容 -->
    <div class="card-body">
      <slot />
    </div>
    
    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
    
    <!-- 悬浮光效 -->
    <div v-if="glow" class="card-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  icon?: string
  badge?: string
  badgeType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glow?: boolean
  accent?: boolean
  accentColor?: string
  bordered?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  shadow: 'md',
  hover: true,
  glow: false,
  accent: false,
  accentColor: 'var(--app-primary-color)',
  bordered: true,
  padding: 'lg',
  badgeType: 'primary'
})

const cardClasses = computed(() => [
  'premium-card',
  `premium-card--shadow-${props.shadow}`,
  `premium-card--padding-${props.padding}`,
  {
    'premium-card--hover': props.hover,
    'premium-card--glow': props.glow,
    'premium-card--bordered': props.bordered,
    'premium-card--accent': props.accent,
  }
])

const accentStyle = computed(() => ({
  background: props.accentColor
}))

const handleMouseEnter = () => {
  // 可以在这里添加鼠标进入的动画效果
}

const handleMouseLeave = () => {
  // 可以在这里添加鼠标离开的动画效果
}
</script>

<style lang="scss" scoped>
.premium-card {
  position: relative;
  background: var(--app-bg-primary);
  border-radius: var(--app-radius-xl);
  transition: all var(--app-transition-normal);
  overflow: hidden;
  
  // 阴影变体
  &--shadow-none {
    box-shadow: none;
  }
  
  &--shadow-sm {
    box-shadow: var(--app-shadow-sm);
  }
  
  &--shadow-md {
    box-shadow: var(--app-shadow-md);
  }
  
  &--shadow-lg {
    box-shadow: var(--app-shadow-lg);
  }
  
  &--shadow-xl {
    box-shadow: var(--app-shadow-xl);
  }
  
  // 边框变体
  &--bordered {
    border: 1px solid var(--app-border-light);
  }
  
  // 悬浮效果
  &--hover:hover {
    transform: translateY(-4px);
    box-shadow: var(--app-shadow-2xl);
    border-color: var(--app-primary-light);
    
    .card-glow {
      opacity: 1;
    }
  }
  
  // 发光效果
  &--glow {
    .card-glow {
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
  }
  
  // 装饰线
  &--accent {
    .card-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--app-primary-color);
      border-radius: var(--app-radius-xl) var(--app-radius-xl) 0 0;
    }
  }
  
  // 内边距变体
  &--padding-none {
    .card-header,
    .card-body,
    .card-footer {
      padding: 0;
    }
  }
  
  &--padding-sm {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--app-spacing-sm);
    }
  }
  
  &--padding-md {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--app-spacing-md);
    }
  }
  
  &--padding-lg {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--app-spacing-lg);
    }
  }
  
  &--padding-xl {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--app-spacing-xl);
    }
  }
}

// 卡片头部
.card-header {
  background: var(--app-bg-tertiary);
  border-bottom: 1px solid var(--app-border-light);
  padding: var(--app-spacing-lg) var(--app-spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.card-title {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-md);
  flex: 1;
  
  .title-icon {
    font-size: var(--app-text-xl);
    color: var(--app-primary-color);
  }
  
  h3 {
    margin: 0;
    font-size: var(--app-text-lg);
    font-weight: var(--app-font-semibold);
    color: var(--app-text-primary);
  }
  
  .title-badge {
    padding: var(--app-spacing-xs) var(--app-spacing-sm);
    border-radius: var(--app-radius-full);
    font-size: var(--app-text-xs);
    font-weight: var(--app-font-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    
    &.badge--primary {
      background: var(--app-primary-lightest);
      color: var(--app-primary-color);
    }
    
    &.badge--success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--app-success-color);
    }
    
    &.badge--warning {
      background: rgba(245, 158, 11, 0.1);
      color: var(--app-warning-color);
    }
    
    &.badge--danger {
      background: rgba(220, 38, 38, 0.1);
      color: var(--app-danger-color);
    }
    
    &.badge--info {
      background: rgba(8, 145, 178, 0.1);
      color: var(--app-info-color);
    }
  }
}

.card-extra {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-sm);
}

// 卡片内容
.card-body {
  padding: var(--app-spacing-xl);
  background: var(--app-bg-primary);
  position: relative;
}

// 卡片底部
.card-footer {
  padding: var(--app-spacing-lg) var(--app-spacing-xl);
  background: var(--app-bg-tertiary);
  border-top: 1px solid var(--app-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// 响应式设计
@media (max-width: 768px) {
  .premium-card {
    border-radius: var(--app-radius-lg);
    
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--app-spacing-md);
    }
    
    .card-title {
      gap: var(--app-spacing-sm);
      
      h3 {
        font-size: var(--app-text-base);
      }
      
      .title-icon {
        font-size: var(--app-text-lg);
      }
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .premium-card {
    background: var(--app-bg-primary);
    border-color: var(--app-border-light);
    
    .card-header {
      background: var(--app-bg-tertiary);
      border-bottom-color: var(--app-border-light);
    }
    
    .card-footer {
      background: var(--app-bg-tertiary);
      border-top-color: var(--app-border-light);
    }
  }
}

// 动画效果
.premium-card {
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
</style>
