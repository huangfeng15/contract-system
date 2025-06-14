/**
 * 性能优化工具类
 * 提供防抖、节流、虚拟滚动等性能优化功能
 */

import { ref, nextTick } from 'vue'

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 延迟执行
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 批量处理
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10,
  delayMs = 0
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
    
    if (delayMs > 0 && i + batchSize < items.length) {
      await delay(delayMs)
    }
  }
  
  return results
}

// 内存缓存
class MemoryCache<T> {
  private cache = new Map<string, { value: T; timestamp: number; ttl: number }>()
  
  set(key: string, value: T, ttl = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

export const cache = new MemoryCache()

// 虚拟滚动Hook
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const scrollTop = ref(0)
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2
  const startIndex = ref(0)
  const endIndex = ref(visibleCount)
  
  const updateVisibleRange = (scrollPosition: number) => {
    scrollTop.value = scrollPosition
    startIndex.value = Math.floor(scrollPosition / itemHeight)
    endIndex.value = Math.min(startIndex.value + visibleCount, items.length)
  }
  
  const visibleItems = ref(items.slice(startIndex.value, endIndex.value))
  
  const onScroll = throttle((event: Event) => {
    const target = event.target as HTMLElement
    updateVisibleRange(target.scrollTop)
    visibleItems.value = items.slice(startIndex.value, endIndex.value)
  }, 16) // 60fps
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    onScroll,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex.value * itemHeight
  }
}

// 图片懒加载
export function useLazyLoad() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    },
    {
      rootMargin: '50px'
    }
  )
  
  const observe = (element: HTMLImageElement) => {
    observer.observe(element)
  }
  
  const unobserve = (element: HTMLImageElement) => {
    observer.unobserve(element)
  }
  
  return { observe, unobserve }
}

// 性能监控
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  startTiming(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      
      this.metrics.get(name)!.push(duration)
      
      // 只保留最近100次记录
      const records = this.metrics.get(name)!
      if (records.length > 100) {
        records.shift()
      }
    }
  }
  
  getMetrics(name: string) {
    const records = this.metrics.get(name) || []
    
    if (records.length === 0) {
      return null
    }
    
    const sum = records.reduce((a, b) => a + b, 0)
    const avg = sum / records.length
    const min = Math.min(...records)
    const max = Math.max(...records)
    
    return {
      count: records.length,
      average: avg,
      min,
      max,
      total: sum
    }
  }
  
  getAllMetrics() {
    const result: Record<string, any> = {}
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name)
    }
    
    return result
  }
  
  clear(name?: string) {
    if (name) {
      this.metrics.delete(name)
    } else {
      this.metrics.clear()
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// 组件性能优化Hook
export function usePerformanceOptimization() {
  const isVisible = ref(true)
  const shouldUpdate = ref(true)
  
  // 组件可见性检测
  const observeVisibility = (element: HTMLElement) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.value = entry.isIntersecting
        shouldUpdate.value = entry.isIntersecting
      },
      { threshold: 0.1 }
    )
    
    observer.observe(element)
    
    return () => observer.disconnect()
  }
  
  // 条件渲染
  const conditionalRender = (condition: () => boolean) => {
    return condition() && isVisible.value
  }
  
  return {
    isVisible,
    shouldUpdate,
    observeVisibility,
    conditionalRender
  }
}

// 内存泄漏检测
export function useMemoryLeakDetection() {
  const listeners: Array<() => void> = []
  const timers: Array<NodeJS.Timeout> = []
  const observers: Array<{ disconnect: () => void }> = []
  
  const addListener = (element: EventTarget, event: string, handler: EventListener) => {
    element.addEventListener(event, handler)
    listeners.push(() => element.removeEventListener(event, handler))
  }
  
  const addTimer = (timer: NodeJS.Timeout) => {
    timers.push(timer)
  }
  
  const addObserver = (observer: { disconnect: () => void }) => {
    observers.push(observer)
  }
  
  const cleanup = () => {
    listeners.forEach(remove => remove())
    timers.forEach(timer => clearTimeout(timer))
    observers.forEach(observer => observer.disconnect())
    
    listeners.length = 0
    timers.length = 0
    observers.length = 0
  }
  
  return {
    addListener,
    addTimer,
    addObserver,
    cleanup
  }
}

// 数据预加载
export async function preloadData<T>(
  loaders: Array<() => Promise<T>>,
  priority: 'high' | 'low' = 'low'
): Promise<T[]> {
  if (priority === 'high') {
    return Promise.all(loaders.map(loader => loader()))
  } else {
    // 低优先级：使用requestIdleCallback
    return new Promise((resolve) => {
      const results: T[] = []
      let completed = 0
      
      const processNext = () => {
        if (completed >= loaders.length) {
          resolve(results)
          return
        }
        
        const loader = loaders[completed]
        loader().then(result => {
          results[completed] = result
          completed++
          
          if ('requestIdleCallback' in window) {
            requestIdleCallback(processNext)
          } else {
            setTimeout(processNext, 0)
          }
        })
      }
      
      processNext()
    })
  }
}
