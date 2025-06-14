/**
 * ImportService修复验证测试
 * 验证ImportService初始化和Excel文件解析问题的修复效果
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Mock Electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-app-data')
  }
}));

import { ImportService } from '../../src/main/services/ImportService';
import { DatabaseManager } from '../../src/main/database/DatabaseManager';

describe('ImportService修复验证测试', () => {
  let importService: ImportService;
  let dbManager: DatabaseManager;
  let testExcelPath: string;
  let testExcelPathChinese: string;

  beforeEach(async () => {
    // 初始化数据库管理器
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize(':memory:'); // 使用内存数据库进行测试

    // 创建测试Excel文件
    testExcelPath = await createTestExcelFile();
    testExcelPathChinese = await createTestExcelFileWithChinesePath();
  });

  afterEach(async () => {
    // 清理测试文件
    if (fs.existsSync(testExcelPath)) {
      fs.unlinkSync(testExcelPath);
    }
    if (fs.existsSync(testExcelPathChinese)) {
      fs.unlinkSync(testExcelPathChinese);
    }

    // 关闭数据库连接
    dbManager.close();
  });

  describe('ImportService初始化测试', () => {
    it('应该能够正确初始化ImportService', () => {
      expect(() => {
        importService = new ImportService();
      }).not.toThrow();

      expect(importService).toBeDefined();
      expect(typeof importService.parseExcelFile).toBe('function');
      expect(typeof importService.startImport).toBe('function');
    });

    it('应该能够处理依赖服务初始化失败的情况', () => {
      // 模拟数据库未初始化的情况
      const originalIsInitialized = dbManager.isInitialized;
      dbManager.isInitialized = () => false;

      try {
        expect(() => {
          importService = new ImportService();
        }).toThrow('ImportService初始化失败');
      } finally {
        // 恢复原始方法
        dbManager.isInitialized = originalIsInitialized;
      }
    });
  });

  describe('Excel文件解析测试', () => {
    beforeEach(() => {
      importService = new ImportService();
    });

    it('应该能够解析标准Excel文件', async () => {
      const result = await importService.parseExcelFile(testExcelPath);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('应该能够处理中文路径的Excel文件', async () => {
      const result = await importService.parseExcelFile(testExcelPathChinese);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('应该能够处理不存在的文件', async () => {
      const nonExistentPath = path.join(__dirname, 'non-existent-file.xlsx');
      const result = await importService.parseExcelFile(nonExistentPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件不存在');
    });

    it('应该能够处理不支持的文件格式', async () => {
      const txtFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(txtFilePath, 'test content');

      try {
        const result = await importService.parseExcelFile(txtFilePath);

        expect(result.success).toBe(false);
        expect(result.error).toContain('不支持的文件格式');
      } finally {
        if (fs.existsSync(txtFilePath)) {
          fs.unlinkSync(txtFilePath);
        }
      }
    });

    it('应该能够正确识别工作表类型', async () => {
      const result = await importService.parseExcelFile(testExcelPath);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const worksheet = result.data![0];
      expect(worksheet.sheetType).toMatch(/^(contract|procurement|unknown)$/);
      expect(worksheet.recognitionStatus).toMatch(/^(recognized|unrecognized)$/);
    });
  });

  describe('导入设置处理测试', () => {
    beforeEach(() => {
      importService = new ImportService();
    });

    it('应该能够处理导入设置', async () => {
      const settings = {
        matchMode: 'strict' as const,
        minMatchFields: 3,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      };

      const result = await importService.startImport([testExcelPath], settings);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string'); // importId
    });
  });
});

/**
 * 创建测试Excel文件
 */
async function createTestExcelFile(): Promise<string> {
  const testData = [
    ['合同编号', '合同名称', '甲方', '乙方', '合同金额', '签订日期'],
    ['HT001', '测试合同1', '甲方公司', '乙方公司', '100000', '2024-01-01'],
    ['HT002', '测试合同2', '甲方公司2', '乙方公司2', '200000', '2024-01-02']
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(testData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '合同数据');

  const filePath = path.join(__dirname, 'test-contract.xlsx');
  XLSX.writeFile(workbook, filePath);

  return filePath;
}

/**
 * 创建带中文路径的测试Excel文件
 */
async function createTestExcelFileWithChinesePath(): Promise<string> {
  const testData = [
    ['招采编号', '项目名称', '采购人', '中标人', '中标价', '开标日期'],
    ['ZC001', '测试采购1', '采购单位', '中标单位', '50000', '2024-01-01'],
    ['ZC002', '测试采购2', '采购单位2', '中标单位2', '80000', '2024-01-02']
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(testData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '采购数据');

  // 创建中文路径
  const chineseDir = path.join(__dirname, '测试文件夹');
  if (!fs.existsSync(chineseDir)) {
    fs.mkdirSync(chineseDir, { recursive: true });
  }

  const filePath = path.join(chineseDir, '测试采购文件.xlsx');
  XLSX.writeFile(workbook, filePath);

  return filePath;
}
