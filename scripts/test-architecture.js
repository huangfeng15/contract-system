#!/usr/bin/env node

/**
 * 基础架构验收测试脚本
 * 验证第一步基础架构模块是否完成
 */

import fs from 'fs'

console.log('🔍 开始基础架构模块验收测试...\n')

let passedTests = 0
let totalTests = 0

function test(description, testFn) {
  totalTests++
  try {
    testFn()
    console.log(`✅ ${description}`)
    passedTests++
  } catch (error) {
    console.log(`❌ ${description}`)
    console.log(`   错误: ${error.message}`)
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`期望 ${expected}，实际 ${actual}`)
      }
    },
    toExist: () => {
      if (!fs.existsSync(actual)) {
        throw new Error(`文件或目录不存在: ${actual}`)
      }
    },
    toContain: (substring) => {
      if (!actual.includes(substring)) {
        throw new Error(`内容不包含: ${substring}`)
      }
    },
    toBeGreaterThan: (value) => {
      if (actual <= value) {
        throw new Error(`期望大于 ${value}，实际 ${actual}`)
      }
    }
  }
}

// 测试项目结构
console.log('📁 测试项目结构...')

test('src目录存在', () => {
  expect('src').toExist()
})

test('src/main目录存在', () => {
  expect('src/main').toExist()
})

test('src/renderer目录存在', () => {
  expect('src/renderer').toExist()
})

test('src/shared目录存在', () => {
  expect('src/shared').toExist()
})

test('docs目录存在', () => {
  expect('docs').toExist()
})

test('tests目录存在', () => {
  expect('tests').toExist()
})

// 测试配置文件
console.log('\n⚙️ 测试配置文件...')

test('package.json存在', () => {
  expect('package.json').toExist()
})

test('tsconfig.json存在', () => {
  expect('tsconfig.json').toExist()
})

test('vite.config.ts存在', () => {
  expect('vite.config.ts').toExist()
})

test('.env文件存在', () => {
  expect('.env').toExist()
})

test('.eslintrc.js存在', () => {
  expect('.eslintrc.js').toExist()
})

test('.prettierrc存在', () => {
  expect('.prettierrc').toExist()
})

// 测试主进程文件
console.log('\n🔧 测试主进程文件...')

test('main.ts存在', () => {
  expect('src/main/main.ts').toExist()
})

test('preload.ts存在', () => {
  expect('src/main/preload.ts').toExist()
})

test('IPC处理器存在', () => {
  expect('src/main/ipc/handlers.ts').toExist()
})

// 测试渲染进程文件
console.log('\n🎨 测试渲染进程文件...')

test('Vue应用入口存在', () => {
  expect('src/renderer/main.ts').toExist()
})

test('根组件存在', () => {
  expect('src/renderer/App.vue').toExist()
})

test('路由配置存在', () => {
  expect('src/renderer/router/index.ts').toExist()
})

// 测试布局组件
console.log('\n📱 测试布局组件...')

test('主布局组件存在', () => {
  expect('src/renderer/components/layout/AppLayout.vue').toExist()
})

test('头部组件存在', () => {
  expect('src/renderer/components/layout/AppHeader.vue').toExist()
})

test('侧边栏组件存在', () => {
  expect('src/renderer/components/layout/AppSidebar.vue').toExist()
})

// 测试页面组件
console.log('\n📄 测试页面组件...')

test('数据导入页面存在', () => {
  expect('src/renderer/views/dataImport/DataImportView.vue').toExist()
})

test('合同管理页面存在', () => {
  expect('src/renderer/views/contractManagement/ContractManagementView.vue').toExist()
})

test('项目管理页面存在', () => {
  expect('src/renderer/views/projectManagement/ProjectManagementView.vue').toExist()
})

test('字段管理页面存在', () => {
  expect('src/renderer/views/fieldManagement/FieldManagementView.vue').toExist()
})

// 测试状态管理
console.log('\n🗃️ 测试状态管理...')

test('状态管理入口存在', () => {
  expect('src/renderer/stores/index.ts').toExist()
})

test('应用状态存在', () => {
  expect('src/renderer/stores/appStore.ts').toExist()
})

test('合同状态存在', () => {
  expect('src/renderer/stores/contractStore.ts').toExist()
})

test('项目状态存在', () => {
  expect('src/renderer/stores/projectStore.ts').toExist()
})

test('字段状态存在', () => {
  expect('src/renderer/stores/fieldStore.ts').toExist()
})

// 测试共享代码
console.log('\n🔗 测试共享代码...')

test('IPC通道常量存在', () => {
  expect('src/shared/constants/ipcChannels.ts').toExist()
})

test('配置常量存在', () => {
  expect('src/shared/constants/config.ts').toExist()
})

test('通用类型定义存在', () => {
  expect('src/shared/types/common.ts').toExist()
})

// 测试文档
console.log('\n📚 测试文档...')

test('README文档存在', () => {
  expect('docs/readme.md').toExist()
})

test('AI开发指导存在', () => {
  expect('docs/aiDevelopmentGuide.md').toExist()
})

test('项目结构文档存在', () => {
  expect('docs/projectStructure.md').toExist()
})

test('模块实施指导存在', () => {
  expect('docs/moduleImplementationGuide.md').toExist()
})

// 测试文件内容
console.log('\n📝 测试文件内容...')

test('package.json包含Vue依赖', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (!packageJson.dependencies || !packageJson.dependencies.vue) {
    throw new Error('package.json缺少Vue依赖')
  }
})

test('主进程文件不为空', () => {
  const content = fs.readFileSync('src/main/main.ts', 'utf8')
  expect(content.length).toBeGreaterThan(100)
})

test('Vue应用入口不为空', () => {
  const content = fs.readFileSync('src/renderer/main.ts', 'utf8')
  expect(content.length).toBeGreaterThan(100)
})

test('根组件包含基本结构', () => {
  const content = fs.readFileSync('src/renderer/App.vue', 'utf8')
  expect(content).toContain('<template>')
  expect(content).toContain('<script')
})

// 输出测试结果
console.log('\n📊 测试结果:')
console.log(`通过: ${passedTests}/${totalTests}`)
console.log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`)

if (passedTests === totalTests) {
  console.log('\n🎉 基础架构模块验收测试通过！')
  console.log('✅ 可以进入下一个模块开发')
} else {
  console.log('\n⚠️ 基础架构模块验收测试未完全通过')
  console.log('❌ 请修复失败的测试项后再继续')
  process.exit(1)
}
