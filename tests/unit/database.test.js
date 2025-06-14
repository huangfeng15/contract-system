/**
 * 数据库模块单元测试
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { DatabaseManager } from '../../src/main/database/DatabaseManager.js';
import { MigrationManager } from '../../src/main/database/MigrationManager.js';
import { DatabaseInitializer } from '../../src/main/database/DatabaseInitializer.js';
import { ProjectService } from '../../src/main/services/ProjectService.js';

// 测试数据库路径
const TEST_DB_PATH = path.join(process.cwd(), 'test-contracts.db');

describe('数据库模块测试', () => {
  let dbManager;
  let migrationManager;
  let dbInitializer;
  let projectService;

  beforeAll(async () => {
    // 删除测试数据库文件（如果存在）
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // 设置测试环境
    process.env.NODE_ENV = 'test';
    
    // 初始化数据库管理器
    dbManager = DatabaseManager.getInstance();
    migrationManager = new MigrationManager();
    dbInitializer = new DatabaseInitializer();
    projectService = new ProjectService();
  });

  afterAll(async () => {
    // 关闭数据库连接
    if (dbManager) {
      dbManager.close();
    }

    // 清理测试数据库文件
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    // 每个测试前重置数据库
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('DatabaseManager 测试', () => {
    it('应该能够初始化数据库连接', async () => {
      const result = await dbManager.initialize();
      
      expect(result.success).toBe(true);
      expect(dbManager.isConnected()).toBe(true);
    });

    it('应该能够执行SQL查询', async () => {
      await dbManager.initialize();
      
      const result = await dbManager.executeQuery('SELECT 1 as test');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].test).toBe(1);
    });

    it('应该能够执行SQL更新', async () => {
      await dbManager.initialize();
      
      // 创建测试表
      const createResult = await dbManager.executeUpdate(`
        CREATE TABLE test_table (
          id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);
      
      expect(createResult.success).toBe(true);
      
      // 插入数据
      const insertResult = await dbManager.executeUpdate(
        'INSERT INTO test_table (name) VALUES (?)',
        ['测试数据']
      );
      
      expect(insertResult.success).toBe(true);
      expect(insertResult.affectedRows).toBe(1);
      expect(insertResult.insertId).toBeGreaterThan(0);
    });

    it('应该能够检查表是否存在', async () => {
      await dbManager.initialize();
      
      // 检查不存在的表
      const notExists = await dbManager.tableExists('non_existent_table');
      expect(notExists).toBe(false);
      
      // 创建表后检查
      await dbManager.executeUpdate(`
        CREATE TABLE test_exists (id INTEGER PRIMARY KEY)
      `);
      
      const exists = await dbManager.tableExists('test_exists');
      expect(exists).toBe(true);
    });

    it('应该能够执行事务', async () => {
      await dbManager.initialize();
      
      // 创建测试表
      await dbManager.executeUpdate(`
        CREATE TABLE test_transaction (
          id INTEGER PRIMARY KEY,
          value INTEGER
        )
      `);
      
      // 执行事务
      const result = await dbManager.executeTransaction((db) => {
        const stmt1 = db.prepare('INSERT INTO test_transaction (value) VALUES (?)');
        const stmt2 = db.prepare('INSERT INTO test_transaction (value) VALUES (?)');
        
        stmt1.run(100);
        stmt2.run(200);
        
        return 'transaction_success';
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('transaction_success');
      
      // 验证数据
      const queryResult = await dbManager.executeQuery('SELECT COUNT(*) as count FROM test_transaction');
      expect(queryResult.data[0].count).toBe(2);
    });
  });

  describe('MigrationManager 测试', () => {
    it('应该能够执行数据库迁移', async () => {
      await dbManager.initialize();
      
      const result = await migrationManager.migrate();
      
      expect(result.success).toBe(true);
      
      // 验证表是否创建成功
      expect(await dbManager.tableExists('projects')).toBe(true);
      expect(await dbManager.tableExists('contracts')).toBe(true);
      expect(await dbManager.tableExists('procurements')).toBe(true);
    });

    it('应该创建正确的表结构', async () => {
      await dbManager.initialize();
      await migrationManager.migrate();
      
      // 检查projects表结构
      const projectsColumns = await dbManager.executeQuery('PRAGMA table_info(projects)');
      expect(projectsColumns.success).toBe(true);
      
      const columnNames = projectsColumns.data.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('projectCode');
      expect(columnNames).toContain('projectName');
      expect(columnNames).toContain('status');
      
      // 检查contracts表结构（应包含文件信息字段）
      const contractsColumns = await dbManager.executeQuery('PRAGMA table_info(contracts)');
      expect(contractsColumns.success).toBe(true);
      
      const contractColumnNames = contractsColumns.data.map(col => col.name);
      expect(contractColumnNames).toContain('filePath');
      expect(contractColumnNames).toContain('fileName');
      expect(contractColumnNames).toContain('sheetName');
      expect(contractColumnNames).toContain('status');
      expect(contractColumnNames).toContain('totalRows');
    });
  });

  describe('DatabaseInitializer 测试', () => {
    it('应该能够完整初始化数据库', async () => {
      const result = await dbInitializer.initialize();
      
      expect(result.success).toBe(true);
      
      // 验证数据库状态
      const statusResult = await dbInitializer.getStatus();
      expect(statusResult.success).toBe(true);
      expect(statusResult.data.connected).toBe(true);
      expect(statusResult.data.tableCount).toBeGreaterThan(0);
    });

    it('应该能够进行健康检查', async () => {
      await dbInitializer.initialize();
      
      const healthResult = await dbInitializer.healthCheck();
      
      expect(healthResult.success).toBe(true);
      expect(healthResult.data.status).toBe('healthy');
      expect(healthResult.data.checks).toBeInstanceOf(Array);
      expect(healthResult.data.checks.length).toBeGreaterThan(0);
      
      // 检查所有检查项都通过
      const allPassed = healthResult.data.checks.every(check => check.status === 'pass');
      expect(allPassed).toBe(true);
    });
  });

  describe('ProjectService 测试', () => {
    beforeEach(async () => {
      await dbInitializer.initialize();
    });

    it('应该能够创建项目', async () => {
      const projectData = {
        projectCode: 'TEST001',
        projectName: '测试项目',
        description: '这是一个测试项目',
        status: 'active'
      };
      
      const result = await projectService.create(projectData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.projectCode).toBe('TEST001');
      expect(result.data.projectName).toBe('测试项目');
      expect(result.data.id).toBeGreaterThan(0);
    });

    it('应该验证项目编号唯一性', async () => {
      const projectData = {
        projectCode: 'UNIQUE001',
        projectName: '唯一性测试项目',
        status: 'active'
      };
      
      // 第一次创建应该成功
      const firstResult = await projectService.create(projectData);
      expect(firstResult.success).toBe(true);
      
      // 第二次创建相同编号应该失败
      const secondResult = await projectService.create(projectData);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('已存在');
    });

    it('应该能够根据ID查找项目', async () => {
      // 先创建项目
      const createResult = await projectService.create({
        projectCode: 'FIND001',
        projectName: '查找测试项目',
        status: 'active'
      });
      
      const projectId = createResult.data.id;
      
      // 根据ID查找
      const findResult = await projectService.findById(projectId);
      
      expect(findResult.success).toBe(true);
      expect(findResult.data).toBeDefined();
      expect(findResult.data.id).toBe(projectId);
      expect(findResult.data.projectCode).toBe('FIND001');
    });

    it('应该能够根据项目编号查找项目', async () => {
      // 先创建项目
      await projectService.create({
        projectCode: 'FINDCODE001',
        projectName: '编号查找测试项目',
        status: 'active'
      });
      
      // 根据编号查找
      const findResult = await projectService.findByProjectCode('FINDCODE001');
      
      expect(findResult.success).toBe(true);
      expect(findResult.data).toBeDefined();
      expect(findResult.data.projectCode).toBe('FINDCODE001');
    });

    it('应该能够更新项目', async () => {
      // 先创建项目
      const createResult = await projectService.create({
        projectCode: 'UPDATE001',
        projectName: '更新测试项目',
        status: 'active'
      });
      
      const projectId = createResult.data.id;
      
      // 更新项目
      const updateResult = await projectService.update(projectId, {
        projectName: '已更新的测试项目',
        description: '新增的描述'
      });
      
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.projectName).toBe('已更新的测试项目');
      expect(updateResult.data.description).toBe('新增的描述');
    });

    it('应该能够搜索项目', async () => {
      // 创建多个项目
      await projectService.create({
        projectCode: 'SEARCH001',
        projectName: '搜索测试项目一',
        status: 'active'
      });
      
      await projectService.create({
        projectCode: 'SEARCH002',
        projectName: '搜索测试项目二',
        status: 'active'
      });
      
      // 搜索项目
      const searchResult = await projectService.searchByName('搜索测试');
      
      expect(searchResult.success).toBe(true);
      expect(searchResult.data).toBeInstanceOf(Array);
      expect(searchResult.data.length).toBe(2);
    });

    it('应该能够获取项目统计', async () => {
      // 创建不同状态的项目
      await projectService.create({
        projectCode: 'STAT001',
        projectName: '统计测试项目1',
        status: 'active'
      });
      
      await projectService.create({
        projectCode: 'STAT002',
        projectName: '统计测试项目2',
        status: 'inactive'
      });
      
      // 获取统计
      const statsResult = await projectService.getProjectStats();
      
      expect(statsResult.success).toBe(true);
      expect(statsResult.data.total).toBeGreaterThanOrEqual(2);
      expect(statsResult.data.active).toBeGreaterThanOrEqual(1);
      expect(statsResult.data.inactive).toBeGreaterThanOrEqual(1);
    });
  });
});
