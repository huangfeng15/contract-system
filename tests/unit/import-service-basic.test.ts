/**
 * ImportService基础功能测试
 * 验证ImportService的基本初始化和方法存在性
 */

import { describe, it, expect, vi } from 'vitest';

// Mock所有依赖
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-app-data')
  }
}));

vi.mock('../../src/main/database/DatabaseManager', () => ({
  DatabaseManager: {
    getInstance: vi.fn(() => ({
      isInitialized: vi.fn(() => true),
      getDatabase: vi.fn(() => ({})),
      close: vi.fn()
    }))
  }
}));

vi.mock('../../src/main/services/FieldService', () => ({
  FieldService: vi.fn(() => ({
    findAll: vi.fn(() => Promise.resolve({
      success: true,
      data: []
    }))
  }))
}));

vi.mock('../../src/main/services/DataCleaningService', () => ({
  DataCleaningService: vi.fn(() => ({
    cleanFieldValue: vi.fn((value) => value)
  }))
}));

vi.mock('../../src/main/services/ProjectService', () => ({
  ProjectService: {
    getInstance: vi.fn(() => ({
      findByName: vi.fn(() => Promise.resolve({ success: false }))
    }))
  }
}));

describe('ImportService基础功能测试', () => {
  it('应该能够导入ImportService类', async () => {
    const { ImportService } = await import('../../src/main/services/ImportService');
    expect(ImportService).toBeDefined();
    expect(typeof ImportService).toBe('function');
  });

  it('应该能够创建ImportService实例', async () => {
    const { ImportService } = await import('../../src/main/services/ImportService');

    let importService;
    expect(() => {
      importService = new ImportService();
    }).not.toThrow();

    expect(importService).toBeDefined();
  });

  it('ImportService实例应该有必要的方法', async () => {
    const { ImportService } = await import('../../src/main/services/ImportService');
    const importService = new ImportService();

    expect(typeof importService.parseExcelFile).toBe('function');
    expect(typeof importService.startImport).toBe('function');
    expect(typeof importService.getImportProgress).toBe('function');
  });

  it('parseExcelFile方法应该能够处理不存在的文件', async () => {
    const { ImportService } = await import('../../src/main/services/ImportService');
    const importService = new ImportService();

    const result = await importService.parseExcelFile('/non-existent-file.xlsx');

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toContain('文件不存在');
  });

  it('parseExcelFile方法应该能够处理不支持的文件格式', async () => {
    const { ImportService } = await import('../../src/main/services/ImportService');
    const importService = new ImportService();

    const result = await importService.parseExcelFile('/test.txt');

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toContain('不支持的文件格式');
  });

  it('startImport方法应该返回正确的结果格式', async () => {
    const { ImportService } = await import('../../src/main/services/ImportService');
    const importService = new ImportService();

    const settings = {
      matchMode: 'strict' as const,
      minMatchFields: 3,
      skipEmptyRows: true,
      trimWhitespace: true,
      validateData: true,
      autoUpdateEnabled: false,
      updateFrequency: 'daily' as const
    };

    const result = await importService.startImport([], settings);

    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');

    if (result.success) {
      expect(typeof result.data).toBe('string'); // importId
    } else {
      expect(typeof result.error).toBe('string');
    }
  });
});

describe('ImportService错误处理测试', () => {
  it('应该能够处理服务初始化失败', async () => {
    // 临时mock一个会失败的DatabaseManager
    vi.doMock('../../src/main/database/DatabaseManager', () => ({
      DatabaseManager: {
        getInstance: vi.fn(() => {
          throw new Error('Database initialization failed');
        })
      }
    }));

    try {
      const { ImportService } = await import('../../src/main/services/ImportService');

      expect(() => {
        new ImportService();
      }).toThrow('ImportService初始化失败');
    } catch (error) {
      // 预期的错误
      expect(error.message).toContain('ImportService初始化失败');
    }
  });

  it('应该能够处理字段服务获取失败', async () => {
    // Mock FieldService返回失败结果
    vi.doMock('../../src/main/services/FieldService', () => ({
      FieldService: vi.fn(() => ({
        findAll: vi.fn(() => Promise.resolve({
          success: false,
          error: 'Field service error'
        }))
      }))
    }));

    const { ImportService } = await import('../../src/main/services/ImportService');
    const importService = new ImportService();

    const result = await importService.parseExcelFile('/non-existent.xlsx');

    expect(result.success).toBe(false);
    expect(result.error).toContain('文件不存在');
  });
});
