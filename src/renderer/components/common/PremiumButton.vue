<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 背景光效 -->
    <div class="button-shine" ref="shineRef"></div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="button-loading">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 图标 -->
    <el-icon v-if="icon && !loading" :class="iconClasses">
      <component :is="icon" />
    </el-icon>
    
    <!-- 按钮文字 -->
    <span class="button-text">
      <slot />
    </span>
    
    <!-- 右侧图标 -->
    <el-icon v-if="rightIcon" class="button-right-icon">
      <component :is="rightIcon" />
    </el-icon>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  size?: 'small' | 'medium' | 'large'
  icon?: string
  rightIcon?: string
  loading?: boolean
  disabled?: boolean
  round?: boolean
  gradient?: boolean
  glow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  loading: false,
  disabled: false,
  round: false,
  gradient: true,
  glow: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const shineRef = ref<HTMLElement>()

const buttonClasses = computed(() => [
  'premium-button',
  `premium-button--${props.type}`,
  `premium-button--${props.size}`,
  {
    'premium-button--loading': props.loading,
    'premium-button--disabled': props.disabled,
    'premium-button--round': props.round,
    'premium-button--gradient': props.gradient,
    'premium-button--glow': props.glow,
  }
])

const iconClasses = computed(() => [
  'button-icon',
  {
    'button-icon--loading': props.loading
  }
])

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const handleMouseEnter = () => {
  if (shineRef.value && !props.disabled && !props.loading) {
    shineRef.value.style.left = '100%'
  }
}

const handleMouseLeave = () => {
  if (shineRef.value) {
    shineRef.value.style.left = '-100%'
  }
}
</script>

<style lang="scss" scoped>
.premium-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-spacing-sm);
  border: none;
  border-radius: var(--app-radius-lg);
  font-family: var(--app-font-family);
  font-weight: var(--app-font-semibold);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--app-transition-normal);
  overflow: hidden;
  user-select: none;
  outline: none;
  
  // 尺寸变体
  &--small {
    padding: var(--app-spacing-sm) var(--app-spacing-md);
    font-size: var(--app-text-sm);
    min-height: 32px;
  }
  
  &--medium {
    padding: var(--app-spacing-md) var(--app-spacing-lg);
    font-size: var(--app-text-base);
    min-height: 40px;
  }
  
  &--large {
    padding: var(--app-spacing-lg) var(--app-spacing-xl);
    font-size: var(--app-text-lg);
    min-height: 48px;
  }
  
  // 圆角变体
  &--round {
    border-radius: var(--app-radius-full);
  }
  
  // 主要按钮
  &--primary {
    background: var(--app-primary-color);
    color: white;
    
    &.premium-button--gradient {
      background: var(--app-gradient-primary);
    }
    
    &:hover:not(.premium-button--disabled):not(.premium-button--loading) {
      background: var(--app-primary-light);
      transform: translateY(-2px);
      box-shadow: var(--project-shadow-button);
    }
    
    &.premium-button--glow:hover {
      box-shadow: 0 0 20px var(--app-primary-color);
    }
  }
  
  // 次要按钮
  &--secondary {
    background: var(--app-bg-tertiary);
    color: var(--app-text-primary);
    border: 1px solid var(--app-border-medium);
    
    &:hover:not(.premium-button--disabled):not(.premium-button--loading) {
      background: var(--app-bg-secondary);
      border-color: var(--app-primary-color);
      color: var(--app-primary-color);
      transform: translateY(-2px);
      box-shadow: var(--app-shadow-lg);
    }
  }
  
  // 成功按钮
  &--success {
    background: var(--app-success-color);
    color: white;
    
    &.premium-button--gradient {
      background: var(--app-gradient-success);
    }
    
    &:hover:not(.premium-button--disabled):not(.premium-button--loading) {
      background: var(--app-success-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.39);
    }
  }
  
  // 警告按钮
  &--warning {
    background: var(--app-warning-color);
    color: white;
    
    &:hover:not(.premium-button--disabled):not(.premium-button--loading) {
      background: var(--app-warning-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px 0 rgba(217, 119, 6, 0.39);
    }
  }
  
  // 危险按钮
  &--danger {
    background: var(--app-danger-color);
    color: white;
    
    &:hover:not(.premium-button--disabled):not(.premium-button--loading) {
      background: var(--app-danger-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.39);
    }
  }
  
  // 信息按钮
  &--info {
    background: var(--app-info-color);
    color: white;
    
    &:hover:not(.premium-button--disabled):not(.premium-button--loading) {
      background: var(--app-info-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px 0 rgba(8, 145, 178, 0.39);
    }
  }
  
  // 文字按钮
  &--text {
    background: transparent;
    color: var(--app-primary-color);
    
    &:hover:not(.premium-button--disabled):not(.premium-button--loading) {
      background: var(--app-primary-lightest);
      color: var(--app-primary-dark);
    }
  }
  
  // 禁用状态
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  // 加载状态
  &--loading {
    cursor: wait;
    
    .button-text {
      opacity: 0.7;
    }
  }
  
  // 激活状态
  &:active:not(.premium-button--disabled):not(.premium-button--loading) {
    transform: translateY(0);
  }
}

// 按钮光效
.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
  pointer-events: none;
}

// 加载动画
.button-loading {
  position: absolute;
  left: var(--app-spacing-md);
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

// 图标样式
.button-icon {
  font-size: 1.2em;
  transition: transform var(--app-transition-fast);
  
  .premium-button:hover & {
    transform: scale(1.1);
  }
}

.button-right-icon {
  font-size: 1em;
  opacity: 0.8;
}

.button-text {
  transition: all var(--app-transition-fast);
  white-space: nowrap;
}

// 旋转动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 768px) {
  .premium-button {
    &--large {
      padding: var(--app-spacing-md) var(--app-spacing-lg);
      font-size: var(--app-text-base);
      min-height: 44px;
    }
    
    &--medium {
      padding: var(--app-spacing-sm) var(--app-spacing-md);
      font-size: var(--app-text-sm);
      min-height: 36px;
    }
  }
}
</style>
