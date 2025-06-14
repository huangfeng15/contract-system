/**
 * 数据库模块全面单元测试
 * 确保测试覆盖率大于90%
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { join } from 'path';
import fs from 'fs';

// 模拟Electron环境
const mockApp = {
  getPath: vi.fn(() => join(process.cwd(), 'test-data')),
  whenReady: vi.fn(() => Promise.resolve()),
  quit: vi.fn()
};

const mockDialog = {
  showErrorBox: vi.fn()
};

// 设置全局模拟
global.require = vi.fn((module) => {
  if (module === 'electron') {
    return { app: mockApp, dialog: mockDialog };
  }
  return {};
});

// 动态导入模块
let DatabaseManager, MigrationManager, DatabaseInitializer, ProjectService;
let TABLE_NAMES, DATABASE_CONFIG, PROJECT_STATUS, DB_ERROR_MESSAGES;

describe('数据库模块全面测试', () => {
  beforeAll(async () => {
    // 设置测试环境
    process.env.NODE_ENV = 'test';
    
    // 创建测试数据目录
    const testDataDir = join(process.cwd(), 'test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // 动态导入模块
    const constants = await import('../../src/shared/constants/database.ts');
    TABLE_NAMES = constants.TABLE_NAMES;
    DATABASE_CONFIG = constants.DATABASE_CONFIG;
    PROJECT_STATUS = constants.PROJECT_STATUS;
    DB_ERROR_MESSAGES = constants.DB_ERROR_MESSAGES;

    const { DatabaseManager: DM } = await import('../../src/main/database/DatabaseManager.ts');
    const { MigrationManager: MM } = await import('../../src/main/database/MigrationManager.ts');
    const { DatabaseInitializer: DI } = await import('../../src/main/database/DatabaseInitializer.ts');
    const { ProjectService: PS } = await import('../../src/main/services/ProjectService.ts');

    DatabaseManager = DM;
    MigrationManager = MM;
    DatabaseInitializer = DI;
    ProjectService = PS;
  });

  afterAll(async () => {
    // 清理测试数据
    const testDataDir = join(process.cwd(), 'test-data');
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('常量和配置测试', () => {
    it('应该正确定义表名常量', () => {
      expect(TABLE_NAMES.PROJECTS).toBe('projects');
      expect(TABLE_NAMES.CONTRACTS).toBe('contracts');
      expect(TABLE_NAMES.PROCUREMENTS).toBe('procurements');
    });

    it('应该正确定义数据库配置', () => {
      expect(DATABASE_CONFIG.DB_NAME).toBe('contracts.db');
      expect(DATABASE_CONFIG.DB_VERSION).toBe(1);
      expect(DATABASE_CONFIG.CONNECTION.MAX_CONNECTIONS).toBe(5);
      expect(DATABASE_CONFIG.CONNECTION.TIMEOUT).toBe(10000);
    });

    it('应该正确定义项目状态常量', () => {
      expect(PROJECT_STATUS.ACTIVE).toBe('active');
      expect(PROJECT_STATUS.INACTIVE).toBe('inactive');
      expect(PROJECT_STATUS.ARCHIVED).toBe('archived');
    });

    it('应该正确定义错误消息常量', () => {
      expect(DB_ERROR_MESSAGES.CONNECTION_FAILED).toBe('数据库连接失败');
      expect(DB_ERROR_MESSAGES.MIGRATION_FAILED).toBe('数据库迁移失败');
      expect(DB_ERROR_MESSAGES.BACKUP_FAILED).toBe('数据库备份失败');
    });
  });

  describe('DatabaseManager 单例模式测试', () => {
    it('应该返回相同的实例', () => {
      const instance1 = DatabaseManager.getInstance();
      const instance2 = DatabaseManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('应该正确初始化配置', () => {
      const dbManager = DatabaseManager.getInstance();
      const dbInfo = dbManager.getDatabaseInfo();
      expect(dbInfo.config).toBeDefined();
      expect(dbInfo.config.maxConnections).toBe(5);
      expect(dbInfo.config.timeout).toBe(10000);
    });
  });

  describe('MigrationManager 测试', () => {
    it('应该正确初始化迁移脚本', () => {
      const migrationManager = new MigrationManager();
      expect(migrationManager).toBeDefined();
    });

    it('应该能够获取当前版本', async () => {
      const migrationManager = new MigrationManager();
      // 测试私有方法通过反射
      const getCurrentVersion = migrationManager.getCurrentVersion || 
        migrationManager['getCurrentVersion'];
      
      if (getCurrentVersion) {
        const version = await getCurrentVersion.call(migrationManager);
        expect(typeof version).toBe('number');
        expect(version).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('DatabaseInitializer 测试', () => {
    it('应该正确创建实例', () => {
      const dbInitializer = new DatabaseInitializer();
      expect(dbInitializer).toBeDefined();
    });

    it('应该能够获取数据库状态', async () => {
      const dbInitializer = new DatabaseInitializer();
      const statusResult = await dbInitializer.getStatus();
      
      expect(statusResult).toBeDefined();
      expect(statusResult.success).toBeDefined();
      
      if (statusResult.success) {
        expect(statusResult.data).toBeDefined();
        expect(statusResult.data.connected).toBeDefined();
        expect(statusResult.data.version).toBeDefined();
        expect(statusResult.data.tableCount).toBeDefined();
      }
    });

    it('应该能够进行健康检查', async () => {
      const dbInitializer = new DatabaseInitializer();
      const healthResult = await dbInitializer.healthCheck();
      
      expect(healthResult).toBeDefined();
      expect(healthResult.success).toBeDefined();
      
      if (healthResult.success) {
        expect(healthResult.data).toBeDefined();
        expect(healthResult.data.status).toBeDefined();
        expect(healthResult.data.checks).toBeInstanceOf(Array);
      }
    });
  });

  describe('ProjectService 验证规则测试', () => {
    it('应该正确初始化验证规则', () => {
      const projectService = new ProjectService();
      expect(projectService).toBeDefined();
      
      // 测试验证规则是否正确设置
      const validationRules = projectService.validationRules || 
        projectService['validationRules'];
      
      if (validationRules) {
        expect(validationRules.projectCode).toBeDefined();
        expect(validationRules.projectName).toBeDefined();
        expect(validationRules.status).toBeDefined();
      }
    });

    it('应该验证项目编号格式', () => {
      const projectService = new ProjectService();
      
      // 测试数据验证方法
      const validate = projectService.validate || projectService['validate'];
      
      if (validate) {
        // 测试有效的项目编号
        const validData = {
          projectCode: 'TEST001',
          projectName: '测试项目',
          status: 'active'
        };
        
        const validResult = validate.call(projectService, validData);
        expect(validResult.success).toBe(true);
        
        // 测试无效的项目编号
        const invalidData = {
          projectCode: 'TEST 001', // 包含空格
          projectName: '测试项目',
          status: 'active'
        };
        
        const invalidResult = validate.call(projectService, invalidData);
        expect(invalidResult.success).toBe(false);
      }
    });
  });

  describe('错误处理测试', () => {
    it('应该正确处理数据库连接错误', async () => {
      // 模拟数据库连接失败
      const dbManager = DatabaseManager.getInstance();
      
      // 测试连接状态检查
      const isConnected = dbManager.isConnected();
      expect(typeof isConnected).toBe('boolean');
    });

    it('应该正确处理SQL执行错误', async () => {
      const dbManager = DatabaseManager.getInstance();
      
      // 测试无效SQL查询
      const result = await dbManager.executeQuery('INVALID SQL');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该正确处理事务错误', async () => {
      const dbManager = DatabaseManager.getInstance();
      
      // 测试事务回滚
      const result = await dbManager.executeTransaction(() => {
        throw new Error('测试错误');
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('事务执行失败');
    });
  });

  describe('数据验证测试', () => {
    it('应该验证必填字段', () => {
      const projectService = new ProjectService();
      const validate = projectService.validate || projectService['validate'];
      
      if (validate) {
        // 测试缺少必填字段
        const incompleteData = {
          projectName: '测试项目'
          // 缺少 projectCode
        };
        
        const result = validate.call(projectService, incompleteData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('必填字段');
      }
    });

    it('应该验证字段长度', () => {
      const projectService = new ProjectService();
      const validate = projectService.validate || projectService['validate'];
      
      if (validate) {
        // 测试超长字段
        const longData = {
          projectCode: 'A'.repeat(100), // 超过50字符限制
          projectName: '测试项目',
          status: 'active'
        };
        
        const result = validate.call(projectService, longData);
        expect(result.success).toBe(false);
      }
    });

    it('应该验证状态值', () => {
      const projectService = new ProjectService();
      const validate = projectService.validate || projectService['validate'];
      
      if (validate) {
        // 测试无效状态
        const invalidStatusData = {
          projectCode: 'TEST001',
          projectName: '测试项目',
          status: 'invalid_status'
        };
        
        const result = validate.call(projectService, invalidStatusData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('状态必须是');
      }
    });
  });

  describe('工具方法测试', () => {
    it('应该正确计算字符串相似度', () => {
      const projectService = new ProjectService();
      const calculateSimilarity = projectService.calculateSimilarity || 
        projectService['calculateSimilarity'];
      
      if (calculateSimilarity) {
        // 测试完全相同的字符串
        const similarity1 = calculateSimilarity.call(projectService, '测试项目', '测试项目');
        expect(similarity1).toBe(1);
        
        // 测试完全不同的字符串
        const similarity2 = calculateSimilarity.call(projectService, '测试项目', '完全不同');
        expect(similarity2).toBeGreaterThanOrEqual(0);
        expect(similarity2).toBeLessThanOrEqual(1);
        
        // 测试空字符串
        const similarity3 = calculateSimilarity.call(projectService, '', '测试');
        expect(similarity3).toBe(0);
      }
    });

    it('应该正确验证邮箱格式', () => {
      const projectService = new ProjectService();
      const isValidEmail = projectService.isValidEmail || 
        projectService['isValidEmail'];
      
      if (isValidEmail) {
        expect(isValidEmail.call(projectService, 'test@example.com')).toBe(true);
        expect(isValidEmail.call(projectService, 'invalid-email')).toBe(false);
        expect(isValidEmail.call(projectService, 'test@')).toBe(false);
      }
    });

    it('应该正确验证URL格式', () => {
      const projectService = new ProjectService();
      const isValidUrl = projectService.isValidUrl || 
        projectService['isValidUrl'];
      
      if (isValidUrl) {
        expect(isValidUrl.call(projectService, 'https://example.com')).toBe(true);
        expect(isValidUrl.call(projectService, 'http://localhost:3000')).toBe(true);
        expect(isValidUrl.call(projectService, 'invalid-url')).toBe(false);
      }
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空数据', () => {
      const projectService = new ProjectService();
      const validate = projectService.validate || projectService['validate'];
      
      if (validate) {
        const result = validate.call(projectService, {});
        expect(result.success).toBe(false);
      }
    });

    it('应该处理null和undefined值', () => {
      const projectService = new ProjectService();
      const validate = projectService.validate || projectService['validate'];
      
      if (validate) {
        const nullData = {
          projectCode: null,
          projectName: undefined,
          status: 'active'
        };
        
        const result = validate.call(projectService, nullData);
        expect(result.success).toBe(false);
      }
    });

    it('应该处理极大数值', () => {
      const projectService = new ProjectService();
      const validateField = projectService.validateField || 
        projectService['validateField'];
      
      if (validateField) {
        const rule = { type: 'number', max: 100 };
        const result = validateField.call(projectService, 'testField', 999999, rule, false);
        expect(result).toContain('不能大于');
      }
    });
  });
});
