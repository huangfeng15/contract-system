# 采购合同管理系统 (Contract Management System)

一个基于 Electron + Vue 3 + TypeScript 的现代化采购合同管理系统，提供完整的合同数据管理、项目管理、字段配置和数据导入功能。

## 🚀 功能特性

### 核心功能模块
- **合同管理** - 完整的合同信息管理，支持CRUD操作
- **采购管理** - 采购项目信息管理和跟踪
- **项目管理** - 项目信息配置和管理
- **字段管理** - 动态字段配置，支持自定义字段映射
- **数据导入** - Excel文件批量导入，智能字段匹配

### 技术特性
- 🖥️ **跨平台桌面应用** - 基于Electron，支持Windows/Mac/Linux
- 🎨 **现代化UI设计** - 简约大气的界面设计，高端品质感
- 📊 **智能数据处理** - 自动数据清洗和格式化
- 🔍 **灵活搜索过滤** - 多条件搜索和数据筛选
- 💾 **本地数据存储** - SQLite数据库，数据安全可靠
- 🧪 **高质量测试** - 90%+测试覆盖率，确保系统稳定性

## 🛠️ 技术栈

### 前端技术
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Element Plus** - Vue 3 UI组件库
- **Vue Router** - 官方路由管理器
- **Vite** - 现代化构建工具

### 后端技术
- **Electron** - 跨平台桌面应用框架
- **Node.js** - JavaScript运行时环境
- **SQLite** - 轻量级关系型数据库
- **Better-SQLite3** - 高性能SQLite驱动

### 开发工具
- **Vitest** - 现代化测试框架
- **Playwright** - 端到端测试工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

## 📦 安装和运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/huangfeng15/contract-system.git
cd contract-system

# 安装依赖（使用国内镜像）
npm config set registry https://registry.npmmirror.com
npm install
```

### 开发模式
```bash
# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

### 生产构建
```bash
# 构建应用
npm run build

# 打包Electron应用
npm run build:electron
```

## 📁 项目结构

```
contract-system/
├── docs/                    # 项目文档
│   ├── aiDevelopmentGuide.md       # AI开发指导
│   ├── projectStructure.md        # 项目架构设计
│   ├── databaseDesign.md          # 数据库设计
│   ├── apiDocumentation.md        # API接口文档
│   └── ...                        # 其他技术文档
├── src/
│   ├── main/               # Electron主进程
│   │   ├── database/       # 数据库模块
│   │   ├── services/       # 业务服务层
│   │   └── ipc/           # 进程间通信
│   ├── renderer/          # Vue渲染进程
│   │   ├── views/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── stores/        # 状态管理
│   │   └── api/          # API接口
│   └── shared/           # 共享类型和工具
├── tests/                # 测试文件
│   ├── unit/            # 单元测试
│   ├── integration/     # 集成测试
│   └── e2e/            # 端到端测试
└── Design Prototype Diagram/  # 设计原型图
```

## 🎯 核心功能说明

### 数据导入功能
- 支持Excel文件批量导入
- 智能字段匹配和映射
- 自动数据清洗和格式化
- 支持合同和采购数据混合导入
- 导入进度实时显示

### 字段管理
- 动态字段配置
- 支持JSON格式导入导出
- 字段映射规则设置
- 字段类型和验证规则配置

### 项目管理
- 项目信息CRUD操作
- 项目别名支持（逗号分隔）
- 项目状态跟踪
- 数据库持久化存储

### 合同管理
- 完整的合同信息管理
- 支持合同查询和筛选
- 合同数据导出功能
- 合同状态跟踪

## 🧪 测试策略

项目采用全面的测试策略，确保代码质量：

- **单元测试覆盖率**: ≥90%
- **集成测试覆盖率**: ≥90%
- **端到端测试覆盖率**: ≥90%
- **测试通过率**: 100%

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行E2E测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:coverage
```

## 📋 开发规范

### 代码规范
- 严格遵循TypeScript类型检查
- 使用ESLint进行代码质量检查
- 使用Prettier进行代码格式化
- 禁止硬编码，所有配置通过配置文件管理

### 命名规范
- 文件名：kebab-case
- 组件名：PascalCase
- 变量名：camelCase
- 常量名：UPPER_SNAKE_CASE

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或辅助工具的变动
```

## 🔧 配置说明

### 环境配置
项目支持多环境配置，配置文件位于 `src/shared/constants/` 目录：
- `database.ts` - 数据库配置
- `app.ts` - 应用配置
- `import.ts` - 导入配置

### 数据库配置
系统使用SQLite数据库，数据库文件默认位于项目根目录的 `contracts.db`。

## 📈 性能指标

- **应用启动时间**: ≤3秒
- **页面切换响应**: ≤200ms
- **数据加载时间**: ≤1秒
- **Excel解析速度**: ≥1000行/秒
- **内存使用**: ≤500MB
- **数据库查询**: ≤100ms

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址: [https://github.com/huangfeng15/contract-system](https://github.com/huangfeng15/contract-system)
- 问题反馈: [Issues](https://github.com/huangfeng15/contract-system/issues)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！