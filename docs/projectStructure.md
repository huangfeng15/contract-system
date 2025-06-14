# 项目结构设计

## 一、技术栈

### 1.1 核心技术
- **前端框架**: Vue 3 + TypeScript + Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **桌面应用**: Electron
- **数据库**: SQLite (加密)
- **Excel处理**: SheetJS (xlsx)
- **测试框架**: Vitest + Playwright

### 1.2 架构模式
- **主进程**: Electron Main Process (Node.js环境)
- **渲染进程**: Vue 3 SPA (浏览器环境)
- **IPC通信**: 安全的进程间通信
- **数据访问**: 简化的Service层模式

## 二、简化目录结构

```
contractManagementSystem/
├── 📁 src/                          # 源代码目录
│   ├── 📁 main/                     # 主进程代码 (Electron Main)
│   │   ├── 📄 main.ts               # 主进程入口文件
│   │   ├── 📄 preload.ts            # 预加载脚本 (安全API暴露)
│   │   ├── 📁 services/             # 业务服务层
│   │   │   ├── 📄 contractService.ts      # 合同业务逻辑
│   │   │   ├── 📄 projectService.ts       # 项目业务逻辑
│   │   │   ├── 📄 importService.ts        # 数据导入服务
│   │   │   ├── 📄 excelService.ts         # Excel处理服务
│   │   │   └── 📄 fieldService.ts         # 字段管理服务
│   │   ├── 📁 database/             # 数据访问层
│   │   │   ├── 📄 database.ts             # 数据库连接管理
│   │   │   └── 📄 migrations.ts           # 数据库迁移
│   │   ├── 📁 ipc/                  # IPC通信处理
│   │   │   └── 📄 handlers.ts             # IPC处理器（合并所有处理器）
│   │   └── 📁 utils/                # 主进程工具函数
│   │       ├── 📄 fileAccess.util.ts      # 文件访问控制
│   │       └── 📄 logger.util.ts          # 日志工具
│   │
│   ├── 📁 renderer/                 # 渲染进程代码 (Vue 3)
│   │   ├── 📄 main.ts               # Vue应用入口
│   │   ├── 📄 App.vue               # 根组件
│   │   ├── 📁 views/                # 页面组件
│   │   │   ├── 📁 dataImport/             # 数据导入页面
│   │   │   │   ├── 📄 DataImportView.vue
│   │   │   │   ├── 📄 FileListPanel.vue
│   │   │   │   └── 📄 WorksheetDetailDialog.vue
│   │   │   ├── 📁 contractManagement/     # 合同管理页面
│   │   │   │   ├── 📄 ContractManagementView.vue
│   │   │   │   ├── 📄 ContractTable.vue
│   │   │   │   ├── 📄 ContractDetailDialog.vue
│   │   │   │   └── 📄 ContractFilters.vue
│   │   │   ├── 📁 projectManagement/      # 项目管理页面
│   │   │   │   ├── 📄 ProjectManagementView.vue
│   │   │   │   ├── 📄 ProjectTable.vue
│   │   │   │   └── 📄 ProjectFormDialog.vue
│   │   │   └── 📁 fieldManagement/        # 字段管理页面
│   │   │       ├── 📄 FieldManagementView.vue
│   │   │       ├── 📄 FieldTable.vue
│   │   │       └── 📄 FieldFormDialog.vue
│   │   ├── 📁 components/           # 通用组件
│   │   │   ├── 📁 layout/                 # 布局组件
│   │   │   │   ├── 📄 AppLayout.vue
│   │   │   │   ├── 📄 Sidebar.vue
│   │   │   │   └── 📄 Header.vue
│   │   │   └── 📁 common/                 # 通用组件
│   │   │       ├── 📄 DataTable.vue
│   │   │       ├── 📄 SearchBox.vue
│   │   │       ├── 📄 DateRangePicker.vue
│   │   │       └── 📄 FileUpload.vue
│   │   ├── 📁 composables/          # 组合式函数
│   │   │   ├── 📄 useContracts.ts         # 合同相关逻辑
│   │   │   ├── 📄 useProjects.ts          # 项目相关逻辑
│   │   │   ├── 📄 useDataImport.ts        # 数据导入逻辑
│   │   │   └── 📄 useFields.ts            # 字段管理逻辑
│   │   ├── 📁 stores/               # 状态管理 (Pinia)
│   │   │   ├── 📄 index.ts                # Store入口
│   │   │   ├── 📄 contractStore.ts        # 合同状态
│   │   │   ├── 📄 projectStore.ts         # 项目状态
│   │   │   └── 📄 fieldStore.ts           # 字段配置状态
│   │   ├── 📁 router/               # 路由配置
│   │   │   ├── 📄 index.ts                # 路由入口
│   │   │   └── 📄 routes.ts               # 路由定义
│   │   ├── 📁 api/                  # API接口层
│   │   │   ├── 📄 index.ts                # API入口
│   │   │   ├── 📄 contractApi.ts          # 合同API
│   │   │   ├── 📄 projectApi.ts           # 项目API
│   │   │   ├── 📄 importApi.ts            # 导入API
│   │   │   └── 📄 fieldApi.ts             # 字段API
│   │   ├── 📁 types/                # 类型定义
│   │   │   ├── 📄 Contract.types.ts       # 合同类型
│   │   │   ├── 📄 Project.types.ts        # 项目类型
│   │   │   ├── 📄 Import.types.ts         # 导入类型
│   │   │   └── 📄 Field.types.ts          # 字段类型
│   │   ├── 📁 utils/                # 工具函数
│   │   │   ├── 📄 format.util.ts          # 格式化工具
│   │   │   ├── 📄 validation.util.ts      # 验证工具
│   │   │   └── 📄 filter.util.ts          # 筛选工具
│   │   └── 📁 assets/               # 静态资源
│   │       ├── 📁 images/                 # 图片资源
│   │       └── 📁 styles/                 # 样式文件
│   │           └── 📄 main.scss           # 主样式文件
│   │
│   └── 📁 shared/                   # 共享代码
│       ├── 📁 types/                      # 共享类型定义
│       ├── 📁 constants/                  # 常量定义
│       └── 📁 utils/                      # 共享工具函数
│
├── 📁 tests/                        # 测试文件
│   ├── 📁 unit/                     # 单元测试
│   ├── 📁 integration/              # 集成测试
│   └── 📁 e2e/                      # 端到端测试
│
├── 📁 build/                        # 构建配置
│   └── 📄 vite.config.ts                 # Vite配置
│
├── 📁 docs/                         # 文档
├── 📁 dist/                         # 构建输出
├── 📁 nodeModules/                  # 依赖包
├── 📄 package.json                  # 项目配置
├── 📄 packageLock.json              # 依赖锁定
├── 📄 tsconfig.json                 # TypeScript配置
├── 📄 vitest.config.ts              # Vitest配置
├── 📄 playwright.config.ts          # Playwright配置
├── 📄 eslintrc.js                   # ESLint配置
├── 📄 prettierrc                    # Prettier配置
└── 📄 README.md                     # 项目说明
```




## 四、模块间通信设计

### 4.1 的IPC通道设计
```typescript
// src/shared/constants/ipcChannels.ts
export const IPC_CHANNELS = {
  // 合同管理
  CONTRACT_GET_LIST: 'contract:getList',
  CONTRACT_GET_DETAIL: 'contract:getDetail',
  CONTRACT_UPDATE_PROJECT: 'contract:updateProject',

  // 项目管理
  PROJECT_GET_LIST: 'project:getList',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',

  // 数据导入
  IMPORT_SELECT_FILES: 'import:selectFiles',
  IMPORT_START: 'import:start',
  IMPORT_GET_PROGRESS: 'import:getProgress',

  // 字段管理
  FIELD_GET_CONFIG: 'field:getConfig',
  FIELD_UPDATE_CONFIG: 'field:updateConfig',
  FIELD_SYNC_COLUMNS: 'field:syncColumns'
} as const;
```

### 4.2 简化的数据流
```
用户操作 → Vue组件 → Composable → API层 → IPC通信 → Service层 → 数据库
```

## 五、数据库设计

### 5.1 简化的表结构
```sql
-- 工作表信息表
CREATE TABLE worksheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filePath TEXT NOT NULL,
  fileName TEXT NOT NULL,
  sheetName TEXT NOT NULL,
  sheetType TEXT NOT NULL,
  status TEXT NOT NULL,
  matchedFields TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 合同数据表
CREATE TABLE contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worksheetId INTEGER,
  projectId INTEGER,
  data TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worksheetId) REFERENCES worksheets(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- 项目表
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectCode TEXT UNIQUE NOT NULL,
  projectName TEXT NOT NULL,
  projectAlias TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 字段配置表
CREATE TABLE fieldConfigs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fieldName TEXT NOT NULL,
  fieldAlias TEXT,
  fieldType TEXT NOT NULL,
  dataType TEXT NOT NULL,
  isVisible BOOLEAN DEFAULT 1,
  displayOrder INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
