/**
 * 数据库相关IPC处理器
 * 处理渲染进程与数据库相关的通信
 */

import { ipcMain } from 'electron';
import { DatabaseInitializer } from '../database/DatabaseInitializer';
import { DatabaseManager } from '../database/DatabaseManager';
import { ProjectService } from '../services/ProjectService';
import { FieldService } from '../services/FieldService';
import type { DatabaseResult } from '@shared/types/database';

// 数据库初始化器和服务实例
let dbInitializer: DatabaseInitializer;
let projectService: ProjectService;
let fieldService: FieldService;

/**
 * 初始化数据库IPC处理器
 */
export function initializeDatabaseHandlers(): void {
  // 先清理可能存在的处理器
  cleanupDatabaseHandlers();

  dbInitializer = new DatabaseInitializer();
  projectService = ProjectService.getInstance();
  fieldService = new FieldService(DatabaseManager.getInstance());

  // 数据库初始化相关
  ipcMain.handle('db:initialize', handleDatabaseInitialize);
  ipcMain.handle('db:status', handleDatabaseStatus);
  ipcMain.handle('db:health-check', handleDatabaseHealthCheck);
  ipcMain.handle('db:backup', handleDatabaseBackup);
  ipcMain.handle('db:reset', handleDatabaseReset);

  // 项目管理相关
  ipcMain.handle('project:create', handleProjectCreate);
  ipcMain.handle('project:findById', handleProjectFindById);
  ipcMain.handle('project:findByCode', handleProjectFindByCode);
  ipcMain.handle('project:findAll', handleProjectFindAll);
  ipcMain.handle('project:findPaginated', handleProjectFindPaginated);
  ipcMain.handle('project:update', handleProjectUpdate);
  ipcMain.handle('project:delete', handleProjectDelete);
  ipcMain.handle('project:searchByName', handleProjectSearchByName);

  ipcMain.handle('project:getStats', handleProjectGetStats);
  ipcMain.handle('project:batchImport', handleProjectBatchImport);
  ipcMain.handle('project:matchByName', handleProjectMatchByName);

  // 字段管理相关
  ipcMain.handle('field:create', handleFieldCreate);
  ipcMain.handle('field:findById', handleFieldFindById);
  ipcMain.handle('field:findByCategory', handleFieldFindByCategory);
  ipcMain.handle('field:findByName', handleFieldFindByName);
  ipcMain.handle('field:findAll', handleFieldFindAll);
  ipcMain.handle('field:update', handleFieldUpdate);
  ipcMain.handle('field:delete', handleFieldDelete);
  ipcMain.handle('field:batchCreate', handleFieldBatchCreate);
  ipcMain.handle('field:updateDisplayOrder', handleFieldUpdateDisplayOrder);
  ipcMain.handle('field:getStats', handleFieldGetStats);

  // 合同数据相关
  ipcMain.handle('contract:findAll', handleContractFindAll);
  ipcMain.handle('contract:findById', handleContractFindById);
  ipcMain.handle('contract:getStats', handleContractGetStats);
  ipcMain.handle('contract:deleteByFilePath', handleContractDeleteByFilePath);

  // 采购数据相关
  ipcMain.handle('procurement:findAll', handleProcurementFindAll);
  ipcMain.handle('procurement:findById', handleProcurementFindById);
  ipcMain.handle('procurement:getStats', handleProcurementGetStats);
  ipcMain.handle('procurement:deleteByFilePath', handleProcurementDeleteByFilePath);

  console.log('数据库IPC处理器初始化完成');
}

// ==================== 数据库初始化相关处理器 ====================

/**
 * 处理数据库初始化
 */
async function handleDatabaseInitialize(): Promise<DatabaseResult<boolean>> {
  try {
    console.log('收到数据库初始化请求');
    return await dbInitializer.initialize();
  } catch (error) {
    console.error('数据库初始化处理失败:', error);
    return {
      success: false,
      error: `数据库初始化失败: ${error}`,
    };
  }
}

/**
 * 处理获取数据库状态
 */
async function handleDatabaseStatus(): Promise<DatabaseResult<any>> {
  try {
    return await dbInitializer.getStatus();
  } catch (error) {
    console.error('获取数据库状态失败:', error);
    return {
      success: false,
      error: `获取数据库状态失败: ${error}`,
    };
  }
}

/**
 * 处理数据库健康检查
 */
async function handleDatabaseHealthCheck(): Promise<DatabaseResult<any>> {
  try {
    return await dbInitializer.healthCheck();
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    return {
      success: false,
      error: `数据库健康检查失败: ${error}`,
    };
  }
}

/**
 * 处理数据库备份
 */
async function handleDatabaseBackup(event: any, backupPath?: string): Promise<DatabaseResult<string>> {
  try {
    const dbManager = (dbInitializer as any).dbManager;
    return await dbManager.backup(backupPath);
  } catch (error) {
    console.error('数据库备份失败:', error);
    return {
      success: false,
      error: `数据库备份失败: ${error}`,
    };
  }
}

/**
 * 处理数据库重置（仅开发环境）
 */
async function handleDatabaseReset(): Promise<DatabaseResult<boolean>> {
  try {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: '生产环境不允许重置数据库',
      };
    }
    return await dbInitializer.reset();
  } catch (error) {
    console.error('数据库重置失败:', error);
    return {
      success: false,
      error: `数据库重置失败: ${error}`,
    };
  }
}

// ==================== 项目管理相关处理器 ====================

/**
 * 处理创建项目
 */
async function handleProjectCreate(event: any, projectData: any): Promise<DatabaseResult<any>> {
  try {
    console.log('收到创建项目请求:', projectData);
    return await projectService.create(projectData);
  } catch (error) {
    console.error('创建项目失败:', error);
    return {
      success: false,
      error: `创建项目失败: ${error}`,
    };
  }
}

/**
 * 处理根据ID查找项目
 */
async function handleProjectFindById(event: any, id: number): Promise<DatabaseResult<any>> {
  try {
    console.log('查找项目:', id);
    return await projectService.findById(id);
  } catch (error) {
    console.error('查找项目失败:', error);
    return {
      success: false,
      error: `查找项目失败: ${error}`,
    };
  }
}

/**
 * 处理根据项目编号查找项目
 */
async function handleProjectFindByCode(event: any, projectCode: string): Promise<DatabaseResult<any>> {
  try {
    console.log('根据编号查找项目:', projectCode);
    return await projectService.findByCode(projectCode);
  } catch (error) {
    console.error('查找项目失败:', error);
    return {
      success: false,
      error: `查找项目失败: ${error}`,
    };
  }
}

/**
 * 处理查找所有项目
 */
async function handleProjectFindAll(event: any, options: any = {}): Promise<DatabaseResult<any>> {
  try {
    console.log('查询所有项目:', options);
    return await projectService.findAll(options);
  } catch (error) {
    console.error('查询项目列表失败:', error);
    return {
      success: false,
      error: `查询项目列表失败: ${error}`,
    };
  }
}

/**
 * 处理分页查询项目
 */
async function handleProjectFindPaginated(
  event: any,
  page: number = 1,
  pageSize: number = 20,
  options: any = {}
): Promise<DatabaseResult<any>> {
  try {
    console.log('分页查询项目:', { page, pageSize, options });

    // 转换搜索选项格式
    const searchOptions: any = {};
    if (options.where && options.where.keyword) {
      searchOptions.keyword = options.where.keyword;
    }
    if (options.status) {
      searchOptions.status = options.status;
    }

    const result = await projectService.findPaginated(page, pageSize, searchOptions);

    if (result.success && result.data) {
      // 转换数据格式以匹配前端期望的格式
      const transformedResult = {
        items: result.data.data,
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
        totalPages: result.data.totalPages
      };

      // 调试：输出项目数据详情
      console.log('=== 分页查询项目调试信息 ===');
      console.log(`返回 ${transformedResult.items.length} 个项目，总计 ${transformedResult.total} 个:`);
      transformedResult.items.forEach((project, index) => {
        console.log(`  ${index + 1}. ID: ${project.id} (类型: ${typeof project.id}) | 编号: ${project.projectCode} | 名称: ${project.projectName}`);
      });

      return {
        success: true,
        data: transformedResult
      };
    }

    return result;
  } catch (error) {
    console.error('分页查询项目失败:', error);
    return {
      success: false,
      error: `分页查询项目失败: ${error}`,
    };
  }
}

/**
 * 处理更新项目
 */
async function handleProjectUpdate(event: any, id: number, updateData: any): Promise<DatabaseResult<any>> {
  try {
    console.log('收到更新项目请求:', { id, updateData });
    return await projectService.update(id, updateData);
  } catch (error) {
    console.error('更新项目失败:', error);
    return {
      success: false,
      error: `更新项目失败: ${error}`,
    };
  }
}

/**
 * 处理删除项目
 */
async function handleProjectDelete(event: any, id: number): Promise<DatabaseResult<boolean>> {
  try {
    console.log('收到删除项目请求:', id, '类型:', typeof id);

    // 调试：在删除前列出所有项目
    console.log('=== 删除前调试信息 ===');
    const allProjects = await projectService.findAll();
    if (allProjects.success && allProjects.data) {
      console.log(`当前数据库中有 ${allProjects.data.length} 个项目:`);
      allProjects.data.forEach(project => {
        console.log(`  ID: ${project.id} | 编号: ${project.projectCode} | 名称: ${project.projectName}`);
      });
    }

    return await projectService.delete(id);
  } catch (error) {
    console.error('删除项目失败:', error);
    return {
      success: false,
      error: `删除项目失败: ${error}`,
    };
  }
}

/**
 * 处理按名称搜索项目
 */
async function handleProjectSearchByName(event: any, searchTerm: string): Promise<DatabaseResult<any>> {
  try {
    console.log('搜索项目:', searchTerm);
    return await projectService.searchByName(searchTerm);
  } catch (error) {
    console.error('搜索项目失败:', error);
    return {
      success: false,
      error: `搜索项目失败: ${error}`,
    };
  }
}



/**
 * 处理获取项目统计
 */
async function handleProjectGetStats(): Promise<DatabaseResult<any>> {
  try {
    return await projectService.getStats();
  } catch (error) {
    console.error('获取项目统计失败:', error);
    return {
      success: false,
      error: `获取项目统计失败: ${error}`,
    };
  }
}

/**
 * 处理批量导入项目
 */
async function handleProjectBatchImport(event: any, projects: any[]): Promise<DatabaseResult<any>> {
  try {
    console.log('收到批量导入项目请求:', projects.length);
    return await projectService.batchImport(projects);
  } catch (error) {
    console.error('批量导入项目失败:', error);
    return {
      success: false,
      error: `批量导入项目失败: ${error}`,
    };
  }
}

/**
 * 处理项目名称匹配
 */
async function handleProjectMatchByName(
  event: any,
  contractName: string,
  threshold: number = 0.6
): Promise<DatabaseResult<any>> {
  try {
    console.log('项目名称匹配:', contractName, threshold);
    return await projectService.matchByName(contractName, threshold);
  } catch (error) {
    console.error('项目名称匹配失败:', error);
    return {
      success: false,
      error: `项目名称匹配失败: ${error}`,
    };
  }
}

// ==================== 字段管理相关处理器 ====================

/**
 * 处理创建字段配置
 */
async function handleFieldCreate(event: any, fieldData: any): Promise<DatabaseResult<any>> {
  try {
    console.log('收到创建字段配置请求:', fieldData);
    return await fieldService.create(fieldData);
  } catch (error) {
    console.error('创建字段配置失败:', error);
    return {
      success: false,
      error: `创建字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理根据ID查找字段配置
 */
async function handleFieldFindById(event: any, id: number): Promise<DatabaseResult<any>> {
  try {
    console.log('根据ID查找字段配置:', id);
    return await fieldService.findById(id);
  } catch (error) {
    console.error('根据ID查找字段配置失败:', error);
    return {
      success: false,
      error: `根据ID查找字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理根据分类查找字段配置
 */
async function handleFieldFindByCategory(event: any, category: 'contract' | 'procurement'): Promise<DatabaseResult<any>> {
  try {
    console.log('根据分类查找字段配置:', category);
    return await fieldService.findByCategory(category);
  } catch (error) {
    console.error('根据分类查找字段配置失败:', error);
    return {
      success: false,
      error: `根据分类查找字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理根据名称查找字段配置
 */
async function handleFieldFindByName(event: any, fieldName: string, category?: 'contract' | 'procurement'): Promise<DatabaseResult<any>> {
  try {
    console.log('根据名称查找字段配置:', fieldName, category);
    return await fieldService.findByName(fieldName, category);
  } catch (error) {
    console.error('根据名称查找字段配置失败:', error);
    return {
      success: false,
      error: `根据名称查找字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理查找所有字段配置
 */
async function handleFieldFindAll(event: any): Promise<DatabaseResult<any>> {
  try {
    console.log('查找所有字段配置');
    return await fieldService.findAll();
  } catch (error) {
    console.error('查找所有字段配置失败:', error);
    return {
      success: false,
      error: `查找所有字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理更新字段配置
 */
async function handleFieldUpdate(event: any, id: number, fieldData: any): Promise<DatabaseResult<any>> {
  try {
    console.log('更新字段配置:', id, fieldData);
    return await fieldService.update(id, fieldData);
  } catch (error) {
    console.error('更新字段配置失败:', error);
    return {
      success: false,
      error: `更新字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理删除字段配置
 */
async function handleFieldDelete(event: any, id: number): Promise<DatabaseResult<any>> {
  try {
    console.log('删除字段配置:', id);
    return await fieldService.delete(id);
  } catch (error) {
    console.error('删除字段配置失败:', error);
    return {
      success: false,
      error: `删除字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理批量创建字段配置
 */
async function handleFieldBatchCreate(event: any, fields: any[]): Promise<DatabaseResult<any>> {
  try {
    console.log('批量创建字段配置:', fields.length);
    return await fieldService.batchCreate(fields);
  } catch (error) {
    console.error('批量创建字段配置失败:', error);
    return {
      success: false,
      error: `批量创建字段配置失败: ${error}`,
    };
  }
}

/**
 * 处理更新字段显示顺序
 */
async function handleFieldUpdateDisplayOrder(event: any, fieldId: number, newOrder: number): Promise<DatabaseResult<any>> {
  try {
    console.log('更新字段显示顺序:', fieldId, newOrder);
    return await fieldService.updateDisplayOrder(fieldId, newOrder);
  } catch (error) {
    console.error('更新字段显示顺序失败:', error);
    return {
      success: false,
      error: `更新字段显示顺序失败: ${error}`,
    };
  }
}

/**
 * 处理获取字段统计信息
 */
async function handleFieldGetStats(event: any): Promise<DatabaseResult<any>> {
  try {
    console.log('获取字段统计信息');
    return await fieldService.getStats();
  } catch (error) {
    console.error('获取字段统计信息失败:', error);
    return {
      success: false,
      error: `获取字段统计信息失败: ${error}`,
    };
  }
}

/**
 * 处理查找所有合同数据
 */
async function handleContractFindAll(event: any, options: any = {}): Promise<DatabaseResult<any>> {
  try {
    console.log('查询所有合同数据:', options);
    const db = DatabaseManager.getInstance().getDatabase();

    let sql = 'SELECT * FROM contracts';
    const params: any[] = [];

    // 构建WHERE条件
    const conditions: string[] = [];

    if (options.projectId) {
      conditions.push('projectId = ?');
      params.push(options.projectId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';

    const stmt = db.prepare(sql);
    const contracts = stmt.all(...params);

    console.log(`查询到 ${contracts.length} 条合同数据`);

    return {
      success: true,
      data: contracts
    };
  } catch (error) {
    console.error('查询合同数据失败:', error);
    return {
      success: false,
      error: `查询合同数据失败: ${error}`,
    };
  }
}

/**
 * 处理根据ID查找合同数据
 */
async function handleContractFindById(event: any, id: number): Promise<DatabaseResult<any>> {
  try {
    console.log('查找合同数据:', id);
    const db = DatabaseManager.getInstance().getDatabase();

    const stmt = db.prepare('SELECT * FROM contracts WHERE id = ?');
    const contract = stmt.get(id);

    return {
      success: true,
      data: contract || null
    };
  } catch (error) {
    console.error('查找合同数据失败:', error);
    return {
      success: false,
      error: `查找合同数据失败: ${error}`,
    };
  }
}

/**
 * 处理获取合同数据统计
 */
async function handleContractGetStats(event: any): Promise<DatabaseResult<any>> {
  try {
    console.log('获取合同数据统计');
    const db = DatabaseManager.getInstance().getDatabase();

    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM contracts');
    const total = totalStmt.get() as { total: number };

    const stats = {
      total: total.total,
      lastUpdated: new Date().toISOString()
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('获取合同数据统计失败:', error);
    return {
      success: false,
      error: `获取合同数据统计失败: ${error}`,
    };
  }
}

/**
 * 处理查找所有采购数据
 */
async function handleProcurementFindAll(event: any, options: any = {}): Promise<DatabaseResult<any>> {
  try {
    console.log('查询所有采购数据:', options);
    const db = DatabaseManager.getInstance().getDatabase();

    let sql = 'SELECT * FROM procurements';
    const params: any[] = [];

    // 构建WHERE条件
    const conditions: string[] = [];

    if (options.projectId) {
      conditions.push('projectId = ?');
      params.push(options.projectId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';

    const stmt = db.prepare(sql);
    const procurements = stmt.all(...params);

    console.log(`查询到 ${procurements.length} 条采购数据`);

    return {
      success: true,
      data: procurements
    };
  } catch (error) {
    console.error('查询采购数据失败:', error);
    return {
      success: false,
      error: `查询采购数据失败: ${error}`,
    };
  }
}

/**
 * 处理根据ID查找采购数据
 */
async function handleProcurementFindById(event: any, id: number): Promise<DatabaseResult<any>> {
  try {
    console.log('查找采购数据:', id);
    const db = DatabaseManager.getInstance().getDatabase();

    const stmt = db.prepare('SELECT * FROM procurements WHERE id = ?');
    const procurement = stmt.get(id);

    return {
      success: true,
      data: procurement || null
    };
  } catch (error) {
    console.error('查找采购数据失败:', error);
    return {
      success: false,
      error: `查找采购数据失败: ${error}`,
    };
  }
}

/**
 * 处理获取采购数据统计
 */
async function handleProcurementGetStats(event: any): Promise<DatabaseResult<any>> {
  try {
    console.log('获取采购数据统计');
    const db = DatabaseManager.getInstance().getDatabase();

    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM procurements');
    const total = totalStmt.get() as { total: number };

    const stats = {
      total: total.total,
      lastUpdated: new Date().toISOString()
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('获取采购数据统计失败:', error);
    return {
      success: false,
      error: `获取采购数据统计失败: ${error}`,
    };
  }
}

/**
 * 处理按文件路径删除合同数据
 */
async function handleContractDeleteByFilePath(event: any, filePath: string): Promise<DatabaseResult<any>> {
  try {
    console.log('按文件路径删除合同数据:', filePath);
    const db = DatabaseManager.getInstance().getDatabase();

    const stmt = db.prepare('DELETE FROM contracts WHERE filePath = ?');
    const result = stmt.run(filePath);

    console.log(`删除合同数据完成，影响行数: ${result.changes}`);

    return {
      success: true,
      data: result.changes
    };
  } catch (error) {
    console.error('按文件路径删除合同数据失败:', error);
    return {
      success: false,
      error: `删除合同数据失败: ${error}`,
    };
  }
}

/**
 * 处理按文件路径删除采购数据
 */
async function handleProcurementDeleteByFilePath(event: any, filePath: string): Promise<DatabaseResult<any>> {
  try {
    console.log('按文件路径删除采购数据:', filePath);
    const db = DatabaseManager.getInstance().getDatabase();

    const stmt = db.prepare('DELETE FROM procurements WHERE filePath = ?');
    const result = stmt.run(filePath);

    console.log(`删除采购数据完成，影响行数: ${result.changes}`);

    return {
      success: true,
      data: result.changes
    };
  } catch (error) {
    console.error('按文件路径删除采购数据失败:', error);
    return {
      success: false,
      error: `删除采购数据失败: ${error}`,
    };
  }
}

/**
 * 清理数据库IPC处理器
 */
export function cleanupDatabaseHandlers(): void {
  // 移除所有数据库相关的IPC监听器
  const channels = [
    'db:initialize', 'db:status', 'db:health-check', 'db:backup', 'db:reset',
    'project:create', 'project:findById', 'project:findByCode', 'project:findAll',
    'project:findPaginated', 'project:update', 'project:delete', 'project:searchByName',
    'project:getStats', 'project:batchImport', 'project:matchByName',
    'field:create', 'field:findById', 'field:findByCategory', 'field:findByName',
    'field:findAll', 'field:update', 'field:delete', 'field:batchCreate',
    'field:updateDisplayOrder', 'field:getStats',
    'contract:findAll', 'contract:findById', 'contract:getStats', 'contract:deleteByFilePath',
    'procurement:findAll', 'procurement:findById', 'procurement:getStats', 'procurement:deleteByFilePath'
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  console.log('数据库IPC处理器清理完成');
}
