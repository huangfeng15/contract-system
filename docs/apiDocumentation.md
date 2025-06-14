# API接口文档

## 一、API概述

### 1.1 通信方式
- **主要通信**: Electron IPC (Inter-Process Communication)
- **数据格式**: JSON
- **错误处理**: 统一错误响应格式
- **安全验证**: 发送者验证 + 参数验证

### 1.2 响应格式
```typescript
// 成功响应
interface IApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: number;
}

// 错误响应
interface IApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: number;
}
```

## 二、项目管理API

### 2.1 获取项目列表
**IPC Channel**: `project:getList`

**请求参数**:
```typescript
interface IProjectListParams {
  page?: number;           // 页码，默认1
  pageSize?: number;       // 每页数量，默认20
  keyword?: string;        // 搜索关键词
  status?: string;         // 项目状态
  sortBy?: string;         // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
}
```

**响应数据**:
```typescript
interface IProjectListResponse {
  items: IProject[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface IProject {
  id: number;
  projectCode: string;
  projectName: string;
  projectAlias?: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  contractCount: number;
  procurementCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 创建项目
**IPC Channel**: `project:create`

**请求参数**:
```typescript
interface ICreateProjectRequest {
  projectCode: string;     // 项目编号（必填）
  projectName: string;     // 项目名称（必填）
  projectAlias?: string;   // 项目别名
  description?: string;    // 项目描述
}
```

**响应数据**:
```typescript
interface ICreateProjectResponse {
  project: IProject;
}
```

### 2.3 更新项目
**IPC Channel**: `project:update`

**请求参数**:
```typescript
interface IUpdateProjectRequest {
  id: number;              // 项目ID
  projectCode?: string;    // 项目编号
  projectName?: string;    // 项目名称
  projectAlias?: string;   // 项目别名
  description?: string;    // 项目描述
  status?: string;         // 项目状态
}
```

### 2.4 删除项目
**IPC Channel**: `project:delete`

**请求参数**:
```typescript
interface IDeleteProjectRequest {
  id: number;              // 项目ID
  force?: boolean;         // 是否强制删除（有关联数据时）
}
```

## 三、字段管理API

### 3.1 获取字段配置
**IPC Channel**: `field:getConfig`

**请求参数**:
```typescript
interface IFieldConfigParams {
  fieldType?: 'contract' | 'procurement'; // 字段类型
  isVisible?: boolean;     // 是否显示
}
```

**响应数据**:
```typescript
interface IFieldConfig {
  id: number;
  fieldName: string;
  fieldAlias?: string;
  fieldType: 'contract' | 'procurement';
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'json';
  isVisible: boolean;
  displayOrder: number;
  isRequired: boolean;
  defaultValue?: string;
  validationRule?: string;
}
```

### 3.2 更新字段配置
**IPC Channel**: `field:updateConfig`

**请求参数**:
```typescript
interface IUpdateFieldConfigRequest {
  configs: IFieldConfig[];  // 字段配置数组
}
```

### 3.3 同步列配置
**IPC Channel**: `field:syncColumns`

**请求参数**:
```typescript
interface ISyncColumnsRequest {
  fieldType: 'contract' | 'procurement';
  columns: IColumnConfig[];
}

interface IColumnConfig {
  fieldName: string;
  isVisible: boolean;
  displayOrder: number;
  width?: number;
}
```

## 四、数据导入API

### 4.1 选择文件
**IPC Channel**: `import:selectFiles`

**请求参数**: 无

**响应数据**:
```typescript
interface ISelectFilesResponse {
  files: ISelectedFile[];
}

interface ISelectedFile {
  filePath: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
}
```

### 4.2 开始导入
**IPC Channel**: `import:start`

**请求参数**:
```typescript
interface IStartImportRequest {
  filePath: string;        // 文件路径
  options: IImportOptions;
}

interface IImportOptions {
  sheetName?: string;      // 指定工作表名称
  startRow?: number;       // 开始行号
  endRow?: number;         // 结束行号
  fieldMapping?: Record<string, string>; // 字段映射
  autoMatch?: boolean;     // 自动匹配项目
  batchSize?: number;      // 批次大小
}
```

**响应数据**:
```typescript
interface IStartImportResponse {
  importId: string;        // 导入任务ID
  worksheetInfo: IWorksheetInfo;
}

interface IWorksheetInfo {
  id: number;
  fileName: string;
  sheetName: string;
  sheetType: 'contract' | 'procurement' | 'unknown';
  totalRows: number;
  matchedFields: string[];
}
```

### 4.3 获取导入进度
**IPC Channel**: `import:getProgress`

**请求参数**:
```typescript
interface IGetProgressRequest {
  importId: string;        // 导入任务ID
}
```

**响应数据**:
```typescript
interface IImportProgress {
  importId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  errorRows: number;
  progress: number;        // 进度百分比 0-100
  currentStep: string;     // 当前步骤描述
  errors: IImportError[];
}

interface IImportError {
  row: number;
  field: string;
  message: string;
  data: any;
}
```

## 五、合同管理API

### 5.1 获取合同列表
**IPC Channel**: `contract:getList`

**请求参数**:
```typescript
interface IContractListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;        // 搜索关键词
  projectId?: number;      // 项目ID
  projectName?: string;    // 项目名称
  partyA?: string;         // 甲方（支持逗号分隔）
  partyB?: string;         // 乙方（支持逗号分隔）
  contractName?: string;   // 合同名称（支持逗号分隔）
  dateRange?: [string, string]; // 日期范围
  isVerified?: boolean;    // 是否已验证
  hasErrors?: boolean;     // 是否有错误
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

**响应数据**:
```typescript
interface IContractListResponse {
  items: IContract[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface IContract {
  id: number;
  worksheetId?: number;
  projectId?: number;
  contractNumber?: string;
  data: Record<string, any>;      // 原始数据
  processedData?: Record<string, any>; // 处理后数据
  matchScore: number;
  isVerified: boolean;
  hasErrors: boolean;
  errorInfo?: any;
  projectName?: string;           // 关联项目名称
  createdAt: string;
  updatedAt: string;
}
```

### 5.2 获取合同详情
**IPC Channel**: `contract:getDetail`

**请求参数**:
```typescript
interface IGetContractDetailRequest {
  id: number;              // 合同ID
}
```

**响应数据**:
```typescript
interface IContractDetailResponse {
  contract: IContract;
  project?: IProject;      // 关联项目信息
  worksheet?: IWorksheetInfo; // 工作表信息
}
```

### 5.3 更新项目关联
**IPC Channel**: `contract:updateProject`

**请求参数**:
```typescript
interface IUpdateContractProjectRequest {
  contractId: number;      // 合同ID
  projectId?: number;      // 项目ID（null表示取消关联）
  isVerified?: boolean;    // 是否已验证
}
```

## 六、数据导出API

### 6.1 导出合同数据
**IPC Channel**: `contract:export`

**请求参数**:
```typescript
interface IExportContractRequest {
  filters: IContractListParams; // 筛选条件
  format: 'xlsx' | 'csv';       // 导出格式
  fields: string[];             // 导出字段
  fileName?: string;            // 文件名
}
```

**响应数据**:
```typescript
interface IExportResponse {
  filePath: string;        // 导出文件路径
  fileName: string;        // 文件名
  recordCount: number;     // 导出记录数
}
```

## 七、错误代码

### 7.1 通用错误代码
- `INVALID_PARAMS`: 参数验证失败
- `UNAUTHORIZED`: 未授权访问
- `INTERNAL_ERROR`: 内部服务器错误
- `NOT_FOUND`: 资源不存在

### 7.2 业务错误代码
- `PROJECT_CODE_EXISTS`: 项目编号已存在
- `PROJECT_HAS_RELATIONS`: 项目存在关联数据
- `FILE_NOT_FOUND`: 文件不存在
- `FILE_FORMAT_ERROR`: 文件格式错误
- `IMPORT_IN_PROGRESS`: 导入正在进行中
- `EXPORT_FAILED`: 导出失败

## 八、使用示例

### 8.1 前端调用示例
```typescript
// 获取项目列表
const response = await window.electronAPI.invoke('project:getList', {
  page: 1,
  pageSize: 20,
  keyword: '智慧城市'
});

if (response.success) {
  console.log('项目列表:', response.data.items);
} else {
  console.error('获取失败:', response.error);
}
```

### 8.2 错误处理示例
```typescript
try {
  const result = await window.electronAPI.invoke('contract:getList', params);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
} catch (error) {
  console.error('API调用失败:', error);
  throw error;
}
```
