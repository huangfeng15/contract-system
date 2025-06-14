# 错误处理与日志规范

## 一、错误处理策略

### 1.1 错误分类
- **系统错误**: 数据库连接失败、文件系统错误等
- **业务错误**: 数据验证失败、业务规则违反等
- **用户错误**: 输入格式错误、权限不足等
- **网络错误**: 请求超时、连接中断等

### 1.2 错误处理原则
- **统一格式**: 所有错误使用统一的响应格式
- **分层处理**: 不同层级采用不同的错误处理策略
- **用户友好**: 向用户显示易懂的错误信息
- **开发调试**: 为开发者提供详细的错误信息

## 二、错误响应格式

### 2.1 标准错误响应
```typescript
interface IErrorResponse {
  success: false;
  error: string;           // 用户友好的错误信息
  code: string;           // 错误代码
  details?: any;          // 详细错误信息（开发模式）
  timestamp: number;      // 错误发生时间戳
  requestId?: string;     // 请求ID（用于追踪）
}
```

### 2.2 错误代码规范
```typescript
// 错误代码格式: {模块}_{类型}_{具体错误}
export const ERROR_CODES = {
  // 通用错误 (COMMON)
  COMMON_INVALID_PARAMS: 'COMMON_INVALID_PARAMS',
  COMMON_UNAUTHORIZED: 'COMMON_UNAUTHORIZED',
  COMMON_INTERNAL_ERROR: 'COMMON_INTERNAL_ERROR',
  COMMON_NOT_FOUND: 'COMMON_NOT_FOUND',

  // 数据库错误 (DB)
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  DB_TRANSACTION_FAILED: 'DB_TRANSACTION_FAILED',

  // 项目管理错误 (PROJECT)
  PROJECT_CODE_EXISTS: 'PROJECT_CODE_EXISTS',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_HAS_RELATIONS: 'PROJECT_HAS_RELATIONS',
  PROJECT_INVALID_STATUS: 'PROJECT_INVALID_STATUS',

  // 文件处理错误 (FILE)
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_FORMAT_ERROR: 'FILE_FORMAT_ERROR',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',

  // 导入错误 (IMPORT)
  IMPORT_IN_PROGRESS: 'IMPORT_IN_PROGRESS',
  IMPORT_PARSE_FAILED: 'IMPORT_PARSE_FAILED',
  IMPORT_VALIDATION_FAILED: 'IMPORT_VALIDATION_FAILED',
  IMPORT_SAVE_FAILED: 'IMPORT_SAVE_FAILED'
} as const;
```

## 三、错误处理实现

### 3.1 自定义错误类
```typescript
// src/shared/errors/AppError.ts
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 业务错误
export class BusinessError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 400, true, details);
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.COMMON_INVALID_PARAMS, 400, true, details);
  }
}

// 数据库错误
export class DatabaseError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 500, true, details);
  }
}
```

### 3.2 错误处理中间件
```typescript
// src/main/utils/errorHandler.ts
import { logger } from './logger';

export class ErrorHandler {
  public static handleError(error: Error): IErrorResponse {
    const timestamp = Date.now();
    const requestId = this.generateRequestId();

    // 记录错误日志
    logger.error('Error occurred:', {
      error: error.message,
      stack: error.stack,
      requestId,
      timestamp
    });

    // 判断错误类型
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
        timestamp,
        requestId
      };
    }

    // 未知错误
    return {
      success: false,
      error: '系统内部错误，请稍后重试',
      code: ERROR_CODES.COMMON_INTERNAL_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp,
      requestId
    };
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
```

### 3.3 IPC错误处理
```typescript
// src/main/ipc/handlers.ts
import { ipcMain } from 'electron';
import { ErrorHandler } from '../utils/errorHandler';

export function setupIpcHandlers() {
  // 项目管理处理器
  ipcMain.handle('project:getList', async (event, params) => {
    try {
      // 验证发送者
      if (!validateSender(event.senderFrame)) {
        throw new AppError('未授权访问', ERROR_CODES.COMMON_UNAUTHORIZED, 401);
      }

      // 验证参数
      const validatedParams = validateProjectListParams(params);

      // 执行业务逻辑
      const result = await projectService.getList(validatedParams);

      return {
        success: true,
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  });
}
```

## 四、日志系统

### 4.1 日志级别
```typescript
export enum LogLevel {
  ERROR = 0,    // 错误信息
  WARN = 1,     // 警告信息
  INFO = 2,     // 一般信息
  DEBUG = 3,    // 调试信息
  TRACE = 4     // 跟踪信息
}
```

### 4.2 日志配置
```typescript
// src/main/utils/logger.ts
import winston from 'winston';
import path from 'path';
import { app } from 'electron';

const logDir = path.join(app.getPath('userData'), 'logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'contract-management' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // 综合日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),

    // 控制台输出（开发环境）
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});
```

### 4.3 日志使用规范
```typescript
// 错误日志
logger.error('数据库连接失败', {
  error: error.message,
  stack: error.stack,
  operation: 'database.connect',
  timestamp: new Date().toISOString()
});

// 警告日志
logger.warn('文件大小超出建议值', {
  fileName: file.name,
  fileSize: file.size,
  maxRecommendedSize: MAX_FILE_SIZE,
  operation: 'file.upload'
});

// 信息日志
logger.info('用户操作记录', {
  action: 'project.create',
  userId: user.id,
  projectId: project.id,
  timestamp: new Date().toISOString()
});

// 调试日志
logger.debug('Excel解析详情', {
  fileName: file.name,
  sheetCount: sheets.length,
  totalRows: totalRows,
  operation: 'excel.parse'
});
```

## 五、前端错误处理

### 5.1 全局错误处理
```typescript
// src/renderer/utils/errorHandler.ts
export class FrontendErrorHandler {
  public static handleApiError(error: IErrorResponse): void {
    // 记录错误
    console.error('API Error:', error);

    // 根据错误代码显示不同的提示
    switch (error.code) {
      case ERROR_CODES.COMMON_UNAUTHORIZED:
        ElMessage.error('权限不足，请重新登录');
        break;
      case ERROR_CODES.PROJECT_CODE_EXISTS:
        ElMessage.error('项目编号已存在，请使用其他编号');
        break;
      case ERROR_CODES.FILE_SIZE_EXCEEDED:
        ElMessage.error('文件大小超出限制，请选择较小的文件');
        break;
      default:
        ElMessage.error(error.error || '操作失败，请稍后重试');
    }
  }

  public static handleUnexpectedError(error: Error): void {
    console.error('Unexpected Error:', error);
    ElMessage.error('系统异常，请刷新页面后重试');
  }
}
```

### 5.2 API调用错误处理
```typescript
// src/renderer/api/base.ts
export async function apiCall<T>(
  channel: string,
  params?: any
): Promise<T> {
  try {
    const response = await window.electronAPI.invoke(channel, params);

    if (!response.success) {
      FrontendErrorHandler.handleApiError(response);
      throw new Error(response.error);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      FrontendErrorHandler.handleUnexpectedError(error);
    }
    throw error;
  }
}
```

## 六、错误监控与报告

### 6.1 错误统计
```typescript
// src/main/utils/errorStats.ts
export class ErrorStats {
  private static errorCounts = new Map<string, number>();

  public static recordError(code: string): void {
    const count = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, count + 1);
  }

  public static getStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  public static resetStats(): void {
    this.errorCounts.clear();
  }
}
```

### 6.2 错误报告
```typescript
// 定期生成错误报告
export function generateErrorReport(): void {
  const stats = ErrorStats.getStats();
  const report = {
    timestamp: new Date().toISOString(),
    period: '24h',
    errorStats: stats,
    topErrors: Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
  };

  logger.info('Error Report Generated', report);
}
```

## 七、最佳实践

### 7.1 错误处理原则
1. **快速失败**: 尽早发现和处理错误
2. **优雅降级**: 错误发生时提供备选方案
3. **用户友好**: 提供清晰的错误提示
4. **可追踪性**: 记录足够的信息用于问题排查

### 7.2 日志记录原则
1. **结构化日志**: 使用JSON格式便于分析
2. **适当级别**: 根据重要性选择合适的日志级别
3. **敏感信息**: 避免记录密码等敏感信息
4. **性能考虑**: 避免过度日志记录影响性能
