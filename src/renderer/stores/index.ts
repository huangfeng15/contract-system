import { createPinia } from 'pinia'

// 创建Pinia实例
export const pinia = createPinia()

// 导出所有store
export { useAppStore } from './appStore'
export { useContractStore } from './contractStore'
export { useProjectStore } from './projectStore'
export { useFieldStore } from './fieldStore'

export default pinia
