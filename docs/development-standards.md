# 采购合同管理系统 - 开发规范文档

## 一、代码规范

### 1.1 文件命名规范（大驼峰小驼峰命名方式）

#### 目录命名
- 使用 camelCase（小驼峰）：`dataImport`、`contractManagement`、`fieldManagement`
- 组件目录使用 PascalCase（大驼峰）：`DataImport`、`ContractManagement`、`FieldManagement`

#### 文件命名
- Vue组件：PascalCase（大驼峰）+ `.vue`：`DataImportDialog.vue`、`ContractTable.vue`、`FieldFormDialog.vue`
- TypeScript文件：camelCase（小驼峰）+ `.ts`：`dataService.ts`、`contractApi.ts`、`fieldService.ts`
- 工具类：camelCase（小驼峰）+ `.util.ts`：`excelParser.util.ts`、`fileAccess.util.ts`
- 类型定义：PascalCase（大驼峰）+ `.types.ts`：`Contract.types.ts`、`Field.types.ts`
- 常量文件：UPPER_SNAKE_CASE + `.const.ts`：`API_ENDPOINTS.const.ts`、`FIELD_TYPES.const.ts`
- 配置文件：camelCase（小驼峰）+ `.config.ts`：`database.config.ts`、`electron.config.ts`

#### 变量命名
- 变量/函数：camelCase（小驼峰）：`contractList`、`parseExcelFile`、`fieldConfig`
- 常量：UPPER_SNAKE_CASE：`MAX_FILE_SIZE`、`DEFAULT_PAGE_SIZE`、`FIELD_TYPES`
- 类名：PascalCase（大驼峰）：`ContractService`、`ExcelParser`、`FieldManager`
- 接口：PascalCase（大驼峰）+ `I`前缀：`IContract`、`IField`、`IDataImportOptions`
- 枚举：PascalCase（大驼峰）：`ContractStatus`、`ImportStatus`、`FieldType`

### 1.2 代码风格规范

#### TypeScript规范
```typescript
// 接口定义
interface IContract {
  id: string;
  contractNumber: string;
  projectId?: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 枚举定义
enum ImportStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

// 类定义
class ContractService {
  private readonly db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  public async getContracts(filters: IContractFilters): Promise<IContract[]> {
    // 实现逻辑
  }
}
```

#### Vue组件规范
```vue
<template>
  <div class="contract-management">
    <el-table :data="contractList" @selection-change="handleSelectionChange">
      <el-table-column prop="contractNumber" label="合同编号" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { IContract, IContractFilters } from '@/types/Contract.types';

// Props定义
interface Props {
  projectId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined
});

// 响应式数据
const contractList = ref<IContract[]>([]);
const filters = reactive<IContractFilters>({
  keyword: '',
  projectName: '',
  dateRange: []
});

// 计算属性
const filteredContracts = computed(() => {
  // 过滤逻辑
});

// 生命周期
onMounted(async () => {
  await loadContracts();
});

// 方法
const loadContracts = async (): Promise<void> => {
  // 加载逻辑
};
</script>

<style scoped>
.contract-management {
  padding: 20px;
}
</style>
```

### 1.3 注释规范

#### 函数注释
```typescript
/**
 * 解析Excel文件并识别工作表类型
 * @param filePath - Excel文件路径
 * @param options - 解析选项
 * @returns 解析结果，包含识别状态和数据
 * @throws {Error} 当文件不存在或格式错误时抛出异常
 */
async function parseExcelFile(
  filePath: string,
  options: IParseOptions
): Promise<IParseResult> {
  // 实现逻辑
}
```

#### 类注释
```typescript
/**
 * 合同数据服务类
 * 负责合同数据的CRUD操作和业务逻辑处理
 */
class ContractService {
  // 实现
}
```

## 二、安全规范

### 2.1 Electron安全配置

#### 主进程安全配置
```typescript
// main.ts
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,           // 禁用Node.js集成
    contextIsolation: true,           // 启用上下文隔离
    enableRemoteModule: false,        // 禁用remote模块
    sandbox: true,                    // 启用沙箱模式
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,                // 启用web安全
    allowRunningInsecureContent: false, // 禁止不安全内容
    experimentalFeatures: false       // 禁用实验性功能
  }
});
```

#### IPC通信安全
```typescript
// preload.ts - 安全的IPC暴露
import { contextBridge, ipcRenderer } from 'electron';

// 只暴露必要的API，不直接暴露ipcRenderer
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据导入API
  importExcel: (filePath: string) =>
    ipcRenderer.invoke('import-excel', filePath),

  // 合同管理API
  getContracts: (filters: IContractFilters) =>
    ipcRenderer.invoke('get-contracts', filters),

  // 事件监听（安全包装）
  onImportProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('import-progress', (_event, progress) => callback(progress));
  }
});

// main.ts - IPC处理器验证
ipcMain.handle('get-contracts', async (event, filters: IContractFilters) => {
  // 验证发送者
  if (!validateSender(event.senderFrame)) {
    throw new Error('Unauthorized access');
  }

  // 验证参数
  if (!isValidContractFilters(filters)) {
    throw new Error('Invalid filters');
  }

  return await contractService.getContracts(filters);
});
```

### 2.2 数据安全

#### 数据库加密
```typescript
// database.config.ts
export const databaseConfig = {
  filename: path.join(app.getPath('userData'), 'contracts.db'),
  encrypt: true,                    // 启用数据库加密
  key: process.env.DB_ENCRYPTION_KEY || generateEncryptionKey(),
  backup: {
    enabled: true,
    interval: 24 * 60 * 60 * 1000, // 24小时备份一次
    maxBackups: 7                   // 保留7个备份
  }
};
```

#### 文件访问控制
```typescript
// fileAccess.util.ts
export class FileAccessControl {
  private static readonly ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  static validateFile(filePath: string): boolean {
    // 验证文件扩展名
    const ext = path.extname(filePath).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error('不支持的文件格式');
    }

    // 验证文件大小
    const stats = fs.statSync(filePath);
    if (stats.size > this.MAX_FILE_SIZE) {
      throw new Error('文件大小超出限制');
    }

    // 验证文件路径（防止路径遍历攻击）
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error('非法文件路径');
    }

    return true;
  }
}
```

### 2.3 输入验证

#### 数据验证
```typescript
// validation.util.ts
import Joi from 'joi';

export const contractSchema = Joi.object({
  contractNumber: Joi.string().required().max(50),
  projectId: Joi.string().uuid().optional(),
  data: Joi.object().required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required()
});

export const validateContract = (contract: any): IContract => {
  const { error, value } = contractSchema.validate(contract);
  if (error) {
    throw new Error(`数据验证失败: ${error.message}`);
  }
  return value;
};
```

### 2.4 避免硬编码规范

#### 配置文件管理
所有配置信息必须通过配置文件或环境变量管理，严禁在代码中硬编码：

```typescript
// src/shared/constants/config.ts
export const APP_CONFIG = {
  // 数据库配置
  DATABASE: {
    MAX_CONNECTIONS: process.env.DB_MAX_CONNECTIONS || 10,
    TIMEOUT: process.env.DB_TIMEOUT || 30000,
    BACKUP_INTERVAL: process.env.DB_BACKUP_INTERVAL || 24 * 60 * 60 * 1000
  },

  // 文件处理配置
  FILE: {
    MAX_SIZE: process.env.MAX_FILE_SIZE || 50 * 1024 * 1024, // 50MB
    ALLOWED_EXTENSIONS: process.env.ALLOWED_EXTENSIONS?.split(',') || ['.xlsx', '.xls'],
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads'
  },

  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: process.env.DEFAULT_PAGE_SIZE || 20,
    MAX_PAGE_SIZE: process.env.MAX_PAGE_SIZE || 100
  },

  // UI配置
  UI: {
    THEME: process.env.UI_THEME || 'light',
    LANGUAGE: process.env.UI_LANGUAGE || 'zh-CN',
    TABLE_HEIGHT: process.env.TABLE_HEIGHT || 'auto'
  }
} as const;
```

#### 字符串常量管理
```typescript
// src/shared/constants/messages.ts
export const MESSAGES = {
  SUCCESS: {
    IMPORT_COMPLETE: '数据导入完成',
    CONTRACT_SAVED: '合同保存成功',
    PROJECT_CREATED: '项目创建成功'
  },

  ERROR: {
    FILE_TOO_LARGE: '文件大小超出限制',
    INVALID_FORMAT: '文件格式不支持',
    NETWORK_ERROR: '网络连接失败',
    PERMISSION_DENIED: '权限不足'
  },

  VALIDATION: {
    REQUIRED_FIELD: '此字段为必填项',
    INVALID_EMAIL: '邮箱格式不正确',
    INVALID_DATE: '日期格式不正确'
  }
} as const;

// src/shared/constants/labels.ts
export const LABELS = {
  CONTRACT: {
    NUMBER: '合同编号',
    NAME: '合同名称',
    PARTY_A: '甲方',
    PARTY_B: '乙方',
    SIGN_DATE: '签约日期',
    AMOUNT: '合同金额'
  },

  PROJECT: {
    CODE: '项目编号',
    NAME: '项目名称',
    ALIAS: '项目别名',
    DESCRIPTION: '项目描述',
    CREATE_TIME: '创建时间'
  },

  ACTIONS: {
    CREATE: '新建',
    EDIT: '编辑',
    DELETE: '删除',
    VIEW: '查看',
    EXPORT: '导出',
    IMPORT: '导入'
  }
} as const;
```

#### API端点管理
```typescript
// src/shared/constants/api-endpoints.ts
export const API_ENDPOINTS = {
  CONTRACT: {
    LIST: '/api/contracts',
    DETAIL: '/api/contracts/:id',
    CREATE: '/api/contracts',
    UPDATE: '/api/contracts/:id',
    DELETE: '/api/contracts/:id',
    EXPORT: '/api/contracts/export'
  },

  PROJECT: {
    LIST: '/api/projects',
    DETAIL: '/api/projects/:id',
    CREATE: '/api/projects',
    UPDATE: '/api/projects/:id',
    DELETE: '/api/projects/:id'
  },

  IMPORT: {
    UPLOAD: '/api/import/upload',
    PROCESS: '/api/import/process',
    STATUS: '/api/import/status/:id'
  }
} as const;
```

#### 样式常量管理
```typescript
// src/renderer/styles/constants.ts
export const STYLE_CONSTANTS = {
  COLORS: {
    PRIMARY: '#409EFF',
    SUCCESS: '#67C23A',
    WARNING: '#E6A23C',
    DANGER: '#F56C6C',
    INFO: '#909399'
  },

  SIZES: {
    HEADER_HEIGHT: '60px',
    SIDEBAR_WIDTH: '240px',
    FOOTER_HEIGHT: '40px',
    BORDER_RADIUS: '4px'
  },

  SPACING: {
    SMALL: '8px',
    MEDIUM: '16px',
    LARGE: '24px',
    XLARGE: '32px'
  },

  BREAKPOINTS: {
    MOBILE: '768px',
    TABLET: '1024px',
    DESKTOP: '1200px'
  }
} as const;
```

#### 硬编码检查规则
```typescript
// eslint规则配置
{
  "rules": {
    // 禁止魔法数字
    "no-magic-numbers": ["error", {
      "ignore": [0, 1, -1],
      "ignoreArrayIndexes": true,
      "enforceConst": true
    }],

    // 禁止硬编码字符串（除了简单的字符串）
    "no-hardcoded-strings": ["error", {
      "allowedStrings": ["", " ", "\n", "\t"]
    }],

    // 要求使用常量而不是字面量
    "prefer-const": "error"
  }
}
```

#### 配置验证
```typescript
// src/shared/utils/config-validator.ts
import Joi from 'joi';

const configSchema = Joi.object({
  DATABASE: Joi.object({
    MAX_CONNECTIONS: Joi.number().min(1).max(100),
    TIMEOUT: Joi.number().min(1000),
    BACKUP_INTERVAL: Joi.number().min(60000)
  }),

  FILE: Joi.object({
    MAX_SIZE: Joi.number().min(1024),
    ALLOWED_EXTENSIONS: Joi.array().items(Joi.string()),
    UPLOAD_PATH: Joi.string().required()
  })
});

export function validateConfig(config: any): void {
  const { error } = configSchema.validate(config);
  if (error) {
    throw new Error(`配置验证失败: ${error.message}`);
  }
}
```
