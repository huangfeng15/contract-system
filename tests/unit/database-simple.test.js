/**
 * 数据库模块简单测试
 */

import { describe, it, expect } from 'vitest';

describe('数据库模块基础测试', () => {
  it('应该能够导入数据库常量', async () => {
    const { TABLE_NAMES, DATABASE_CONFIG } = await import('../../src/shared/constants/database.ts');
    
    expect(TABLE_NAMES).toBeDefined();
    expect(TABLE_NAMES.PROJECTS).toBe('projects');
    expect(TABLE_NAMES.CONTRACTS).toBe('contracts');
    expect(TABLE_NAMES.PROCUREMENTS).toBe('procurements');
    
    expect(DATABASE_CONFIG).toBeDefined();
    expect(DATABASE_CONFIG.DB_NAME).toBe('contracts.db');
    expect(DATABASE_CONFIG.DB_VERSION).toBe(1);
  });

  it('应该能够导入数据库类型', async () => {
    const types = await import('../../src/shared/types/database.ts');
    
    expect(types).toBeDefined();
    // 类型定义在运行时不会有实际值，但导入应该成功
  });

  it('数据库配置应该有正确的结构', async () => {
    const { DATABASE_CONFIG } = await import('../../src/shared/constants/database.ts');
    
    expect(DATABASE_CONFIG.CONNECTION).toBeDefined();
    expect(DATABASE_CONFIG.CONNECTION.MAX_CONNECTIONS).toBe(5);
    expect(DATABASE_CONFIG.CONNECTION.TIMEOUT).toBe(10000);
    
    expect(DATABASE_CONFIG.ENCRYPTION).toBeDefined();
    expect(DATABASE_CONFIG.ENCRYPTION.KEY_LENGTH).toBe(32);
    
    expect(DATABASE_CONFIG.BACKUP).toBeDefined();
    expect(DATABASE_CONFIG.BACKUP.RETENTION_DAYS).toBe(7);
  });

  it('错误消息常量应该正确定义', async () => {
    const { DB_ERROR_MESSAGES } = await import('../../src/shared/constants/database.ts');
    
    expect(DB_ERROR_MESSAGES.CONNECTION_FAILED).toBe('数据库连接失败');
    expect(DB_ERROR_MESSAGES.TABLE_NOT_EXISTS).toBe('数据表不存在');
    expect(DB_ERROR_MESSAGES.MIGRATION_FAILED).toBe('数据库迁移失败');
    expect(DB_ERROR_MESSAGES.BACKUP_FAILED).toBe('数据库备份失败');
    expect(DB_ERROR_MESSAGES.VALIDATION_FAILED).toBe('数据验证失败');
    expect(DB_ERROR_MESSAGES.TRANSACTION_FAILED).toBe('事务执行失败');
  });

  it('处理状态常量应该正确定义', async () => {
    const { PROCESSING_STATUS } = await import('../../src/shared/constants/database.ts');
    
    expect(PROCESSING_STATUS.PENDING).toBe('pending');
    expect(PROCESSING_STATUS.PROCESSING).toBe('processing');
    expect(PROCESSING_STATUS.COMPLETED).toBe('completed');
    expect(PROCESSING_STATUS.FAILED).toBe('failed');
  });

  it('项目状态常量应该正确定义', async () => {
    const { PROJECT_STATUS } = await import('../../src/shared/constants/database.ts');
    
    expect(PROJECT_STATUS.ACTIVE).toBe('active');
    expect(PROJECT_STATUS.INACTIVE).toBe('inactive');
    expect(PROJECT_STATUS.ARCHIVED).toBe('archived');
  });

  it('数据类型常量应该正确定义', async () => {
    const { DATA_TYPES } = await import('../../src/shared/constants/database.ts');
    
    expect(DATA_TYPES.CONTRACT).toBe('contract');
    expect(DATA_TYPES.PROCUREMENT).toBe('procurement');
  });

  it('SQL查询常量应该正确定义', async () => {
    const { SQL_QUERIES } = await import('../../src/shared/constants/database.ts');
    
    expect(SQL_QUERIES.CHECK_TABLE_EXISTS).toContain('sqlite_master');
    expect(SQL_QUERIES.CHECK_TABLE_EXISTS).toContain('SELECT name FROM');
  });
});
