# 模块实施指导文档

## 开发顺序说明

按照业务逻辑和依赖关系，模块开发顺序为：
1. **基础架构模块** - 项目技术基础
2. **数据库模块** - 数据存储基础
3. **项目管理模块** - 业务基础数据管理
4. **字段管理模块** - 动态字段配置
5. **数据导入模块** - 数据导入功能
6. **合同管理模块** - 核心业务功能

## 一、模块一：基础架构模块

### 1.1 模块目标
建立项目基础架构，包括Electron应用框架、Vue前端框架、基础IPC通信

### 1.2 开发任务

#### 任务1：项目初始化
**AI开发指导：**
1. 创建Electron + Vue 3 + TypeScript项目结构
2. 配置Vite构建工具和开发环境
3. 集成Element Plus UI框架
4. 配置ESLint和Prettier代码规范
5. 设置基础的测试环境

#### 任务2：主进程开发
**AI开发指导：**
1. 创建main.ts主进程入口
2. 配置Electron安全选项
3. 实现窗口创建和管理
4. 创建preload.ts预加载脚本
5. 建立基础IPC通信框架

#### 任务3：渲染进程开发
**AI开发指导：**
1. 创建Vue应用入口和根组件
2. 配置Vue Router路由系统
3. 配置Pinia状态管理
4. 创建主布局组件（AppLayout、Sidebar、Header）
5. 建立基础的API调用层

### 1.3 验收标准
- [ ] 应用能正常启动并显示主界面
- [ ] 前后端IPC通信正常
- [ ] 路由切换功能正常
- [ ] 主布局组件显示正确
- [ ] 构建打包成功

## 二、模块二：数据库模块

### 2.1 模块目标
建立SQLite数据库基础设施，创建核心数据表结构

### 2.2 开发任务

#### 任务1：数据库连接
**AI开发指导：**
1. 配置SQLite数据库连接
2. 实现数据库加密配置
3. 创建数据库连接管理类
4. 建立数据库迁移机制

#### 任务2：核心表结构
**AI开发指导：**
1. 创建projects表（项目基础数据）
2. 创建fieldConfigs表（字段配置）
3. 创建worksheets表（工作表信息）
4. 创建contracts表（合同数据，JSON字段存储动态数据）
5. 建立表间关系和索引

#### 任务3：数据访问层
**AI开发指导：**
1. 实现基础的Service类
2. 创建CRUD操作方法
3. 实现数据验证和错误处理
4. 建立事务处理机制

### 2.3 验收标准
- [ ] 数据库能正常连接
- [ ] 所有表结构创建成功
- [ ] CRUD操作正常
- [ ] 数据迁移机制工作正常

## 三、模块三：项目管理模块

### 3.1 模块目标
建立项目基础数据管理，为后续合同关联提供项目数据支持

### 3.2 开发任务

#### 任务1：项目数据模型
**AI开发指导：**
1. 实现项目Service类
2. 创建项目CRUD操作
3. 实现项目编号唯一性验证
4. 建立项目别名管理

#### 任务2：项目管理界面
**AI开发指导：**
1. 创建ProjectManagementView主页面
2. 创建ProjectTable项目列表组件
3. 创建ProjectFormDialog项目编辑对话框
4. 实现项目搜索和筛选功能

#### 任务3：项目关联逻辑
**AI开发指导：**
1. 实现项目名称匹配算法
2. 实现项目别名匹配逻辑
3. 建立项目关联规则引擎
4. 创建项目关联状态管理

### 3.3 验收标准
- [ ] 项目CRUD操作正常
- [ ] 项目编号唯一性验证生效
- [ ] 项目管理界面功能完整
- [ ] 项目关联逻辑正确

## 四、模块四：字段管理模块

### 4.1 模块目标
建立动态字段配置系统，支持合同和采购字段的灵活管理

### 4.2 开发任务

#### 任务1：字段配置后端
**AI开发指导：**
1. 实现FieldService类
2. 创建字段配置CRUD操作
3. 实现字段类型和别名管理
4. 建立字段显示顺序控制

#### 任务2：字段管理界面
**AI开发指导：**
1. 创建FieldManagementView主页面
2. 创建FieldTable字段列表组件
3. 创建FieldFormDialog字段编辑对话框
4. 实现字段拖拽排序功能

#### 任务3：字段同步机制
**AI开发指导：**
1. 实现字段配置变更通知
2. 建立前端列配置同步
3. 实现字段模板预设功能
4. 创建字段验证规则

### 4.3 验收标准
- [ ] 字段CRUD操作正常
- [ ] 字段排序和显示控制生效
- [ ] 字段配置同步机制正常
- [ ] 字段管理界面功能完整

## 五、模块五：数据导入模块

### 5.1 模块目标
实现Excel文件导入功能，基于字段配置进行工作表识别和数据解析

### 5.2 开发任务

#### 任务1：Excel解析引擎
**AI开发指导：**
1. 集成SheetJS库进行Excel解析
2. 实现工作表类型识别算法
3. 建立字段匹配机制（基于字段管理配置）
4. 创建数据验证和清洗逻辑

#### 任务2：导入界面开发
**AI开发指导：**
1. 创建DataImportView主页面
2. 创建FileListPanel文件列表组件
3. 创建WorksheetDetailDialog工作表详情对话框
4. 实现导入进度显示和状态管理

#### 任务3：数据存储逻辑
**AI开发指导：**
1. 实现ImportService类
2. 建立工作表数据存储机制
3. 实现项目自动关联逻辑
4. 创建导入历史和状态跟踪

### 5.3 验收标准
- [ ] 支持Excel文件解析
- [ ] 工作表识别准确率≥95%
- [ ] 数据导入成功率100%
- [ ] 项目自动关联功能正常

## 六、模块六：合同管理模块

### 6.1 模块目标
实现合同数据的展示、筛选、详情查看和项目关联管理

### 6.2 开发任务

#### 任务1：合同数据展示
**AI开发指导：**
1. 创建ContractManagementView主页面
2. 创建ContractTable动态列表组件
3. 实现基于字段配置的动态列显示
4. 建立数据分页和虚拟滚动

#### 任务2：筛选和搜索
**AI开发指导：**
1. 创建ContractFilters筛选组件
2. 实现多条件组合筛选
3. 支持逗号分隔的或关系筛选
4. 建立筛选条件保存和恢复

#### 任务3：详情和关联
**AI开发指导：**
1. 创建ContractDetailDialog详情对话框
2. 实现原始数据高亮显示
3. 建立项目关联编辑功能
4. 创建数据导出功能

### 6.3 验收标准
- [ ] 合同列表显示正常
- [ ] 筛选功能完整可用
- [ ] 详情查看功能正常
- [ ] 项目关联功能正常
- [ ] 数据导出功能正常

## 七、开发注意事项

### 7.1 模块依赖关系
- 项目管理模块为其他模块提供基础项目数据
- 字段管理模块为数据导入和合同管理提供字段配置
- 数据导入模块依赖项目管理和字段管理
- 合同管理模块依赖所有前置模块

### 7.2 开发原则
- 严格按照模块顺序开发，不可跳跃
- 每个模块完成后必须通过验收标准
- 遵循大驼峰小驼峰命名规范
- 保持代码简洁，避免过度设计

### 7.3 测试要求
- 每个模块开发完成后立即进行测试
- 单元测试覆盖率≥90%
- 集成测试验证模块间交互
- 生产环境验证确保功能可用
