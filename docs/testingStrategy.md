# 测试策略文档

## 一、测试策略概述

### 1.1 测试环境挑战
采购合同管理系统是一个Electron桌面应用，但开发过程中需要在Web环境和Electron环境之间进行测试。两个环境存在显著差异：

**Web环境特点**：
- 运行在浏览器中（http://localhost:3000）
- 使用模拟数据（MockDataService）
- 无法访问Electron IPC API
- 无法测试文件系统操作
- 快速启动，适合开发调试

**Electron环境特点**：
- 运行在桌面应用中
- 使用真实SQLite数据库
- 支持完整的Electron IPC通信
- 支持文件系统和原生API
- 启动较慢，但环境真实

### 1.2 分层测试策略

我们采用**分层测试策略**，确保测试效率和真实性的平衡：

```
┌─────────────────────────────────────────────────────────────┐
│                    端到端测试 (E2E)                          │
│                  Electron环境 - 真实场景                     │
│              覆盖率要求: ≥90% 业务流程覆盖                    │
├─────────────────────────────────────────────────────────────┤
│                    集成测试 (Integration)                    │
│              Electron环境 - API和数据流测试                  │
│              覆盖率要求: ≥90% API接口覆盖                     │
├─────────────────────────────────────────────────────────────┤
│                    单元测试 (Unit)                          │
│               Web环境 - 组件和逻辑测试                       │
│              覆盖率要求: ≥90% 代码行覆盖                      │
└─────────────────────────────────────────────────────────────┘
```

## 二、测试工具配置

### 2.1 单元测试 - Vitest (Web环境)
**用途**：组件逻辑、工具函数、状态管理测试
**环境**：jsdom模拟浏览器环境
**数据**：模拟数据
**优势**：快速执行，即时反馈

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  }
})
```

### 2.2 集成测试 - Playwright + Electron
**用途**：API集成、数据库操作、IPC通信测试
**环境**：真实Electron应用
**数据**：真实SQLite数据库
**优势**：真实环境，完整功能

### 2.3 端到端测试 - Playwright + Electron
**用途**：完整业务流程、用户交互测试
**环境**：真实Electron应用
**数据**：真实SQLite数据库
**优势**：用户视角，真实场景

## 三、测试执行策略

### 3.1 开发阶段测试
```bash
# 快速单元测试（开发时频繁运行）
npm run test:unit

# Web环境快速验证（UI开发时）
npm run test:web

# 完整测试（提交前运行）
npm run test:all
```

### 3.2 CI/CD测试流程
```bash
1. 单元测试 (Vitest) - 快速反馈
2. 集成测试 (Playwright + Electron) - API验证
3. 端到端测试 (Playwright + Electron) - 业务验证
4. 性能测试 - 响应时间验证
```

### 3.3 测试数据管理
**单元测试**：
- 使用模拟数据（MockDataService）
- 数据在内存中，测试间隔离

**集成/E2E测试**：
- 使用测试数据库（test.db）
- 每次测试前重置数据库
- 使用预定义测试数据集

## 四、Electron测试配置

### 4.1 Playwright Electron配置
```typescript
// playwright-electron.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/electron',
  use: {
    // 启动Electron应用而不是浏览器
    launchOptions: {
      executablePath: require('electron'),
      args: ['.']
    }
  },
  projects: [
    {
      name: 'electron-integration',
      testDir: './tests/electron/integration'
    },
    {
      name: 'electron-e2e',
      testDir: './tests/electron/e2e'
    }
  ]
})
```

### 4.2 测试环境准备
```typescript
// tests/electron/setup.ts
import { test as base } from '@playwright/test'
import { ElectronApplication } from 'playwright'

export const test = base.extend<{
  electronApp: ElectronApplication
}>({
  electronApp: async ({}, use) => {
    // 启动Electron应用
    const electronApp = await electron.launch({
      args: ['.'],
      env: {
        NODE_ENV: 'test',
        DB_PATH: ':memory:' // 使用内存数据库
      }
    })
    
    await use(electronApp)
    await electronApp.close()
  }
})
```

## 五、测试最佳实践

### 5.1 测试隔离原则
- 每个测试独立运行，不依赖其他测试
- 测试前重置数据状态
- 使用独立的测试数据

### 5.2 真实性原则
- 集成和E2E测试必须在Electron环境中运行
- 使用真实的数据库操作
- 测试真实的用户交互流程

### 5.3 效率原则
- 单元测试保持快速执行
- 合理分配测试层次
- 避免重复测试相同功能

### 5.4 可维护性原则
- 测试代码清晰易懂
- 使用页面对象模式（Page Object Pattern）
- 统一的测试工具和辅助函数

## 六、测试覆盖率要求

### 6.1 覆盖率目标
- **单元测试**: ≥90% 代码行覆盖率
- **集成测试**: ≥90% API接口覆盖率
- **端到端测试**: ≥90% 业务流程覆盖率
- **整体覆盖率**: ≥90% 功能覆盖率

### 6.2 质量标准
- **测试通过率**: 100%
- **测试稳定性**: 连续10次运行成功率≥95%
- **测试执行时间**: 单元测试≤30秒，集成测试≤2分钟，E2E测试≤5分钟

## 七、测试命令规范

### 7.1 基础测试命令
```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 端到端测试
npm run test:e2e

# 完整测试套件
npm run test:all

# 测试覆盖率报告
npm run test:coverage
```

### 7.2 Electron专用命令
```bash
# Electron集成测试
npm run test:electron:integration

# Electron端到端测试
npm run test:electron:e2e

# Electron完整测试
npm run test:electron:all
```

### 7.3 开发辅助命令
```bash
# 监听模式单元测试
npm run test:unit:watch

# 调试模式测试
npm run test:debug

# 测试报告生成
npm run test:report
```

## 八、测试环境切换

### 8.1 环境变量配置
```bash
# 测试环境
NODE_ENV=test
DB_PATH=:memory:
LOG_LEVEL=error
ENABLE_DEV_TOOLS=false

# 开发环境测试
NODE_ENV=development
DB_PATH=./test.db
LOG_LEVEL=debug
ENABLE_DEV_TOOLS=true
```

### 8.2 数据库配置
```typescript
// 测试环境数据库配置
const testDbConfig = {
  path: process.env.NODE_ENV === 'test' ? ':memory:' : './test.db',
  resetBeforeTest: true,
  seedData: true
}
```

## 九、测试数据管理

### 9.1 测试数据集
```typescript
// tests/fixtures/testData.ts
export const testProjects = [
  {
    projectCode: 'TEST_001',
    projectName: '测试项目一',
    projectAlias: '测试别名',
    description: '用于测试的项目'
  }
]
```

### 9.2 数据重置策略
```typescript
// 每个测试前重置数据
beforeEach(async () => {
  await resetTestDatabase()
  await seedTestData()
})
```

## 十、持续改进

### 10.1 测试监控
- 监控测试执行时间
- 跟踪测试失败率
- 分析测试覆盖率趋势

### 10.2 测试优化
- 定期审查测试用例
- 优化测试执行速度
- 改进测试稳定性

### 10.3 工具升级
- 跟踪测试工具更新
- 评估新的测试技术
- 持续改进测试流程
