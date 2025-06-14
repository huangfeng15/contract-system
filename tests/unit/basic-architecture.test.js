/**
 * 基础架构模块测试
 * 验证项目基础架构是否正确搭建
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('基础架构模块验收测试', () => {
  
  it('应该有正确的项目结构', () => {
    // 检查主要目录是否存在
    const requiredDirs = [
      'src',
      'src/main',
      'src/renderer',
      'src/shared',
      'docs',
      'tests'
    ]
    
    requiredDirs.forEach(dir => {
      expect(fs.existsSync(dir)).toBe(true)
    })
  })
  
  it('应该有必要的配置文件', () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      '.env',
      '.eslintrc.js',
      '.prettierrc'
    ]
    
    requiredFiles.forEach(file => {
      expect(fs.existsSync(file)).toBe(true)
    })
  })
  
  it('应该有正确的源代码结构', () => {
    // 检查主进程文件
    expect(fs.existsSync('src/main/main.ts')).toBe(true)
    expect(fs.existsSync('src/main/preload.ts')).toBe(true)
    expect(fs.existsSync('src/main/ipc/handlers.ts')).toBe(true)
    
    // 检查渲染进程文件
    expect(fs.existsSync('src/renderer/main.ts')).toBe(true)
    expect(fs.existsSync('src/renderer/App.vue')).toBe(true)
    expect(fs.existsSync('src/renderer/router/index.ts')).toBe(true)
    
    // 检查共享文件
    expect(fs.existsSync('src/shared/constants/ipcChannels.ts')).toBe(true)
    expect(fs.existsSync('src/shared/types/common.ts')).toBe(true)
  })
  
  it('应该有正确的组件结构', () => {
    // 检查布局组件
    expect(fs.existsSync('src/renderer/components/layout/AppLayout.vue')).toBe(true)
    expect(fs.existsSync('src/renderer/components/layout/AppHeader.vue')).toBe(true)
    expect(fs.existsSync('src/renderer/components/layout/AppSidebar.vue')).toBe(true)
    
    // 检查页面组件
    expect(fs.existsSync('src/renderer/views/dataImport/DataImportView.vue')).toBe(true)
    expect(fs.existsSync('src/renderer/views/contractManagement/ContractManagementView.vue')).toBe(true)
    expect(fs.existsSync('src/renderer/views/projectManagement/ProjectManagementView.vue')).toBe(true)
    expect(fs.existsSync('src/renderer/views/fieldManagement/FieldManagementView.vue')).toBe(true)
  })
  
  it('应该有正确的状态管理结构', () => {
    expect(fs.existsSync('src/renderer/stores/index.ts')).toBe(true)
    expect(fs.existsSync('src/renderer/stores/appStore.ts')).toBe(true)
    expect(fs.existsSync('src/renderer/stores/contractStore.ts')).toBe(true)
    expect(fs.existsSync('src/renderer/stores/projectStore.ts')).toBe(true)
    expect(fs.existsSync('src/renderer/stores/fieldStore.ts')).toBe(true)
  })
  
  it('package.json应该包含必要的依赖', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    // 检查核心依赖
    expect(packageJson.dependencies).toHaveProperty('vue')
    expect(packageJson.dependencies).toHaveProperty('vue-router')
    expect(packageJson.dependencies).toHaveProperty('pinia')
    expect(packageJson.dependencies).toHaveProperty('element-plus')
    
    // 检查开发依赖
    expect(packageJson.devDependencies).toHaveProperty('vite')
    expect(packageJson.devDependencies).toHaveProperty('typescript')
    expect(packageJson.devDependencies).toHaveProperty('@vitejs/plugin-vue')
  })
  
  it('TypeScript配置应该正确', () => {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'))
    
    // 检查路径映射
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*')
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@main/*')
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@shared/*')
    
    // 检查基本配置
    expect(tsconfig.compilerOptions.target).toBe('ES2020')
    expect(tsconfig.compilerOptions.module).toBe('ESNext')
    expect(tsconfig.compilerOptions.strict).toBe(true)
  })
  
  it('应该有正确的文档结构', () => {
    const requiredDocs = [
      'docs/readme.md',
      'docs/aiDevelopmentGuide.md',
      'docs/projectStructure.md',
      'docs/moduleImplementationGuide.md',
      'docs/environmentSetup.md'
    ]
    
    requiredDocs.forEach(doc => {
      expect(fs.existsSync(doc)).toBe(true)
    })
  })
})

describe('代码质量检查', () => {
  
  it('主要源文件应该存在且不为空', () => {
    const importantFiles = [
      'src/main/main.ts',
      'src/renderer/main.ts',
      'src/renderer/App.vue',
      'src/shared/constants/ipcChannels.ts'
    ]
    
    importantFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      expect(content.length).toBeGreaterThan(0)
      expect(content.trim()).not.toBe('')
    })
  })
  
  it('Vue组件应该有正确的结构', () => {
    const vueFiles = [
      'src/renderer/App.vue',
      'src/renderer/components/layout/AppLayout.vue',
      'src/renderer/views/dataImport/DataImportView.vue'
    ]
    
    vueFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      expect(content).toContain('<template>')
      expect(content).toContain('<script')
      expect(content).toContain('<style')
    })
  })
  
  it('TypeScript文件应该有正确的导入导出', () => {
    const tsFiles = [
      'src/shared/constants/ipcChannels.ts',
      'src/shared/types/common.ts',
      'src/renderer/stores/appStore.ts'
    ]
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      // 应该有导出语句
      expect(content).toMatch(/export\s+(const|interface|type|function|class|default)/)
    })
  })
})
