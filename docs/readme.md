# 采购合同管理系统 - 开发文档索引

## 📋 文档结构说明

本项目采用模块化开发方式，文档结构清晰分工，避免内容重叠。请根据开发阶段选择对应文档：

### 🎯 核心指导文档

#### 1. [aiDevelopmentGuide.md](./aiDevelopmentGuide.md) - AI开发总指导
**用途：** AI开发的核心指导文档，专注于开发理念、流程、质量标准
**适用场景：**
- 开始任何模块开发前必读
- 制定开发计划时参考
- 代码审查时的标准依据

**主要内容：**
- 开发理念与流程
- 通用开发步骤
- 测试策略
- 命名规范（大驼峰小驼峰）
- 简化开发策略

#### 2. [projectStructure.md](./projectStructure.md) - 项目结构设计
**用途：** 项目技术架构和目录结构的设计
**适用场景：**
- 项目初始化时参考
- 创建新文件/目录时查阅
- 理解模块间关系时参考

**主要内容：**
- 技术栈选择
- 简化的目录结构
- 模块间通信设计
- 数据库设计

#### 3. [moduleImplementationGuide.md](./moduleImplementationGuide.md) - 模块实施指导
**用途：** 每个具体模块的详细开发步骤指导
**适用场景：**
- 开发具体模块时的操作手册
- 了解模块开发细节时参考
- 模块验收时的标准依据

**主要内容：**
- 基础架构模块实施步骤
- 数据库模块实施步骤
- 项目管理模块实施步骤
- 字段管理模块实施步骤
- 数据导入模块实施步骤
- 合同管理模块实施步骤
- 每个步骤的详细AI开发任务
- 具体的验收标准

### 📐 设计原型文档

#### 4. [Design Prototype Diagram/](./Design%20Prototype%20Diagram/) - 设计原型图目录
**用途：** 系统业务逻辑和界面设计的原型图
**适用场景：**
- 理解业务需求时参考
- 开发前端界面时参考
- 实现业务逻辑时参考

**包含文件：**
- `design-prototypes-summary.md` - 设计原型图总览
- `development-standards.md` - 开发规范详细说明（已更新为大驼峰小驼峰命名）
- `diagram-*.mmd` - 各个模块的Mermaid原型图
- `readme.md` - 设计原型图目录说明

## 🚀 快速开始指南

### 第一次开发时的文档阅读顺序：

1. **首先阅读** → `aiDevelopmentGuide.md`
   - 了解整体开发理念和流程
   - 掌握质量标准和测试要求
   - 掌握大驼峰小驼峰命名规范

2. **然后阅读** → `projectStructure.md`
   - 了解技术架构选择
   - 熟悉项目目录结构
   - 理解模块间通信方式

3. **接着阅读** → `Design Prototype Diagram/design-prototypes-summary.md`
   - 理解业务需求和界面设计
   - 掌握数据流和业务逻辑
   - 了解用户交互方式

4. **最后阅读** → `moduleImplementationGuide.md`
   - 按模块优先级开始具体开发
   - 严格按照步骤执行
   - 确保每个步骤的交付物完整

### 开发过程中的文档使用：

#### 🔧 开发阶段
- **环境搭建时** → 参考 `environmentSetup.md`
- **需求分析时** → 查阅设计原型图
- **架构设计时** → 参考 `projectStructure.md`
- **数据库开发时** → 参考 `databaseDesign.md`
- **API开发时** → 参考 `apiDocumentation.md`
- **编码实现时** → 遵循 `aiDevelopmentGuide.md` 的规范
- **具体开发时** → 按照 `moduleImplementationGuide.md` 执行
- **配置文件时** → 参考 `configurationTemplates.md`

#### ✅ 测试阶段
- **单元测试** → 参考 `aiDevelopmentGuide.md` 的测试策略
- **集成测试** → 按照模块实施指导的测试步骤
- **验收测试** → 对照各模块的验收标准

#### 📝 审查阶段
- **代码审查** → 使用 `aiDevelopmentGuide.md` 的审查清单
- **架构审查** → 对照 `projectStructure.md` 的设计
- **业务审查** → 参考设计原型图的业务逻辑

#### 🐛 问题排查阶段
- **错误处理** → 参考 `errorHandlingAndLogging.md`
- **性能问题** → 参考 `performanceOptimization.md`
- **环境问题** → 参考 `environmentSetup.md`
- **数据库问题** → 参考 `databaseDesign.md`

## ⚠️ 重要提醒

### 文档使用原则：
1. **避免跨文档查找相同信息** - 每个文档职责明确，不重复
2. **按阶段使用对应文档** - 不同开发阶段使用不同文档
3. **严格遵循文档指导** - 特别是开发流程和质量标准
4. **遵循简化原则** - 避免过度设计，保持代码简洁实用
5. **及时更新文档** - 如有变更及时同步更新

### 开发优先级提醒：
```
基础架构模块 → 数据库模块 → 项目管理模块 → 字段管理模块 → 数据导入模块 → 合同管理模块
```

### 命名规范提醒（大驼峰小驼峰）：
- **目录命名**：camelCase（小驼峰）- `dataImport`、`contractManagement`
- **组件命名**：PascalCase（大驼峰）- `DataImportDialog.vue`、`FieldFormDialog.vue`
- **文件命名**：camelCase（小驼峰）- `dataService.ts`、`fieldService.ts`
- **变量/函数**：camelCase（小驼峰）- `contractList`、`fieldConfig`
- **类名**：PascalCase（大驼峰）- `ContractService`、`FieldManager`
- **接口**：PascalCase（大驼峰）+ I前缀 - `IContract`、`IField`

### 质量标准提醒：
- 单元测试覆盖率 ≥ 90%
- 集成测试覆盖率 ≥ 85%
- 端到端测试覆盖率 ≥ 80%
- 代码审查通过率 100%
- 生产环境测试通过率 100%

### 简化开发原则：
- **避免过度设计** - 只实现必要的功能
- **保持代码简洁** - 优先选择简单直接的实现方式
- **重点关注用户体验** - 确保功能完整性和易用性
- **确保模块独立** - 每个模块都能独立开发和测试

---

**开始开发前，请确保已完整阅读并理解以上文档结构和使用方法！**

**特别注意：本项目采用简化开发策略，避免过度设计，重点关注功能实现和用户体验！**
