# 贡献指南 (Contributing Guide)

感谢您对采购合同管理系统的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 开发新功能

## 🚀 快速开始

### 环境准备
1. **Node.js** >= 16.0.0
2. **npm** >= 8.0.0
3. **Git** 版本控制工具

### 本地开发设置
```bash
# 1. Fork 项目到您的GitHub账户
# 2. 克隆您的Fork
git clone https://github.com/YOUR_USERNAME/contract-system.git
cd contract-system

# 3. 添加上游仓库
git remote add upstream https://github.com/huangfeng15/contract-system.git

# 4. 安装依赖
npm config set registry https://registry.npmmirror.com
npm install

# 5. 启动开发服务器
npm run dev
```

## 📋 开发规范

### 代码规范
- **TypeScript**: 严格的类型检查，禁用 `any` 类型
- **ESLint**: 代码质量检查，必须通过所有规则
- **Prettier**: 代码格式化，统一代码风格
- **禁止硬编码**: 所有配置必须通过配置文件管理

### 命名规范
```typescript
// 文件名：kebab-case
my-component.vue
data-service.ts

// 组件名：PascalCase
export default defineComponent({
  name: 'MyComponent'
})

// 变量名：camelCase
const userName = 'john'
const isLoading = false

// 常量名：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'

// 类名：PascalCase
class DataService {
  // 方法名：camelCase
  getUserData() {}
}
```

### Git提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

#### 提交类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD相关

#### 示例
```bash
feat(data-import): 添加Excel文件批量导入功能
fix(database): 修复数据库连接超时问题
docs(readme): 更新安装说明
test(import): 添加数据导入模块单元测试
```

## 🧪 测试要求

### 测试覆盖率标准
- **单元测试**: ≥90%
- **集成测试**: ≥90%
- **端到端测试**: ≥90%
- **测试通过率**: 100%

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行特定类型测试
npm run test:unit
npm run test:integration
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage

# 监听模式（开发时使用）
npm run test:watch
```

### 测试文件组织
```
tests/
├── unit/           # 单元测试
├── integration/    # 集成测试
├── e2e/           # 端到端测试
├── fixtures/      # 测试数据
└── setup.ts       # 测试配置
```

## 📝 文档要求

### 代码注释
```typescript
/**
 * 数据导入服务
 * 负责处理Excel文件的解析和数据导入
 */
export class ImportService {
  /**
   * 导入Excel文件数据
   * @param filePath - Excel文件路径
   * @param options - 导入选项
   * @returns 导入结果
   */
  async importExcelData(
    filePath: string, 
    options: ImportOptions
  ): Promise<ImportResult> {
    // 实现逻辑...
  }
}
```

### README更新
如果您的更改影响了用户使用方式，请更新相应的文档：
- `README.md` - 主要文档
- `docs/` 目录下的技术文档
- API文档

## 🔄 贡献流程

### 1. 创建Issue
在开始开发之前，请先创建一个Issue来描述：
- 问题的详细描述
- 预期的解决方案
- 相关的截图或错误信息

### 2. 创建分支
```bash
# 从最新的main分支创建功能分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 或者修复分支
git checkout -b fix/your-fix-name
```

### 3. 开发和测试
```bash
# 开发过程中定期运行测试
npm run test

# 确保代码格式正确
npm run lint
npm run format

# 检查类型
npm run type-check
```

### 4. 提交代码
```bash
# 添加更改
git add .

# 提交（遵循提交规范）
git commit -m "feat(module): 添加新功能描述"

# 推送到您的Fork
git push origin feature/your-feature-name
```

### 5. 创建Pull Request
1. 在GitHub上创建Pull Request
2. 填写PR模板中的所有必要信息
3. 确保所有CI检查通过
4. 等待代码审查

## 📋 Pull Request检查清单

提交PR之前，请确保：

- [ ] 代码遵循项目的编码规范
- [ ] 所有测试通过（`npm run test`）
- [ ] 代码覆盖率达到要求
- [ ] 没有ESLint错误或警告
- [ ] 提交信息遵循规范
- [ ] 更新了相关文档
- [ ] 添加了必要的测试用例
- [ ] 功能在Electron环境中正常工作

## 🐛 报告Bug

### Bug报告模板
```markdown
**Bug描述**
简洁明了地描述bug。

**重现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**预期行为**
描述您期望发生的情况。

**实际行为**
描述实际发生的情况。

**截图**
如果适用，添加截图来帮助解释您的问题。

**环境信息**
- 操作系统: [例如 Windows 10]
- Node.js版本: [例如 16.14.0]
- 应用版本: [例如 1.0.0]

**附加信息**
添加任何其他相关信息。
```

## 💡 功能建议

### 功能请求模板
```markdown
**功能描述**
简洁明了地描述您想要的功能。

**问题背景**
描述这个功能要解决什么问题。

**解决方案**
描述您希望的解决方案。

**替代方案**
描述您考虑过的其他解决方案。

**附加信息**
添加任何其他相关信息或截图。
```

## 📞 获取帮助

如果您在贡献过程中遇到问题，可以通过以下方式获取帮助：

- 📧 创建GitHub Issue
- 💬 在现有Issue中评论
- 📖 查看项目文档 (`docs/` 目录)

## 🙏 致谢

感谢您的贡献！每一个贡献都让这个项目变得更好。

---

**注意**: 请确保您的贡献遵循我们的[行为准则](CODE_OF_CONDUCT.md)。
