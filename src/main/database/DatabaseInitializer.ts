/**
 * 数据库初始化器
 * 负责数据库的完整初始化流程
 */

import { DatabaseManager } from './DatabaseManager';
import { MigrationManager } from './MigrationManager';
import { DatabaseSeeder } from './DatabaseSeeder';
import type { DatabaseResult } from '@shared/types/database';

export class DatabaseInitializer {
  private dbManager: DatabaseManager;
  private migrationManager: MigrationManager;
  private seeder: DatabaseSeeder;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.migrationManager = new MigrationManager();
    this.seeder = new DatabaseSeeder();
  }

  /**
   * 完整的数据库初始化流程
   */
  public async initialize(): Promise<DatabaseResult<boolean>> {
    try {
      console.log('开始数据库初始化...');

      // 1. 初始化数据库连接
      console.log('1. 初始化数据库连接...');
      const connectionResult = await this.dbManager.initialize();
      if (!connectionResult.success) {
        return connectionResult;
      }

      // 2. 执行数据库迁移
      console.log('2. 执行数据库迁移...');
      const migrationResult = await this.migrationManager.migrate();
      if (!migrationResult.success) {
        return migrationResult;
      }

      // 3. 验证数据库结构
      console.log('3. 验证数据库结构...');
      const validationResult = await this.validateDatabaseStructure();
      if (!validationResult.success) {
        return validationResult;
      }

      // 4. 插入种子数据
      console.log('4. 插入种子数据...');
      const seedResult = await this.seeder.seed();
      if (!seedResult.success) {
        return seedResult;
      }

      // 5. 创建初始备份
      console.log('5. 创建初始备份...');
      const backupResult = await this.createInitialBackup();
      if (!backupResult.success) {
        console.warn('初始备份创建失败，但不影响系统运行:', backupResult.error);
      }

      console.log('数据库初始化完成！');

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('数据库初始化失败:', error);
      return {
        success: false,
        error: `数据库初始化失败: ${error}`,
      };
    }
  }

  /**
   * 验证数据库结构
   */
  private async validateDatabaseStructure(): Promise<DatabaseResult<boolean>> {
    try {
      const requiredTables = [
        'projects',
        'fieldConfigs',
        'dataCleaningRules',
        'contracts',
        'procurements',
        'systemConfigs',
      ];

      for (const tableName of requiredTables) {
        const exists = await this.dbManager.tableExists(tableName);
        if (!exists) {
          return {
            success: false,
            error: `必需的数据表 "${tableName}" 不存在`,
          };
        }
      }

      // 验证表结构完整性
      const structureValidation = await this.validateTableStructures();
      if (!structureValidation.success) {
        return structureValidation;
      }

      console.log('数据库结构验证通过');
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `数据库结构验证失败: ${error}`,
      };
    }
  }

  /**
   * 验证表结构
   */
  private async validateTableStructures(): Promise<DatabaseResult<boolean>> {
    try {
      // 验证projects表结构
      const projectsColumns = await this.getTableColumns('projects');
      const requiredProjectsColumns = [
        'id', 'projectCode', 'projectName', 'projectAlias',
        'description', 'status', 'createdAt', 'updatedAt'
      ];

      for (const column of requiredProjectsColumns) {
        if (!projectsColumns.includes(column)) {
          return {
            success: false,
            error: `projects表缺少必需的列: ${column}`,
          };
        }
      }

      // 验证fieldConfigs表结构
      const fieldConfigsColumns = await this.getTableColumns('fieldConfigs');
      const requiredFieldConfigsColumns = [
        'id', 'fieldName', 'fieldAlias', 'fieldType', 'dataType', 'fieldCategory',
        'isVisible', 'displayOrder', 'isRequired', 'defaultValue',
        'validationRule', 'cleaningRule', 'createdAt', 'updatedAt'
      ];

      for (const column of requiredFieldConfigsColumns) {
        if (!fieldConfigsColumns.includes(column)) {
          return {
            success: false,
            error: `fieldConfigs表缺少必需的列: ${column}`,
          };
        }
      }

      // 验证contracts表结构（混合模式）
      const contractsColumns = await this.getTableColumns('contracts');
      const requiredContractsColumns = [
        'id', 'projectId', 'contractSequence', 'contractNumber', 'contractName',
        'contractHandler', 'partyA', 'partyB', 'contractAmount', 'signDate',
        'filePath', 'fileName', 'sheetName', 'extendedFields', 'status',
        'matchScore', 'isVerified', 'hasErrors', 'errorInfo', 'cleaningLog',
        'createdAt', 'updatedAt'
      ];

      for (const column of requiredContractsColumns) {
        if (!contractsColumns.includes(column)) {
          return {
            success: false,
            error: `contracts表缺少必需的列: ${column}`,
          };
        }
      }

      console.log('表结构验证通过');
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `表结构验证失败: ${error}`,
      };
    }
  }

  /**
   * 获取表的列名
   */
  private async getTableColumns(tableName: string): Promise<string[]> {
    const result = await this.dbManager.executeQuery(
      `PRAGMA table_info(${tableName})`
    );

    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any) => row.name);
  }

  /**
   * 创建初始备份
   */
  private async createInitialBackup(): Promise<DatabaseResult<string>> {
    try {
      const backupResult = await this.dbManager.backup();
      if (backupResult.success) {
        console.log(`初始备份创建成功: ${backupResult.data}`);
      }
      return backupResult;
    } catch (error) {
      return {
        success: false,
        error: `创建初始备份失败: ${error}`,
      };
    }
  }

  /**
   * 重置数据库（仅开发环境）
   */
  public async reset(): Promise<DatabaseResult<boolean>> {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: '生产环境不允许重置数据库',
      };
    }

    try {
      console.log('开始重置数据库...');

      // 1. 重置数据库结构
      const resetResult = await this.migrationManager.reset();
      if (!resetResult.success) {
        return resetResult;
      }

      // 2. 重新初始化
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }

      console.log('数据库重置完成！');
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('数据库重置失败:', error);
      return {
        success: false,
        error: `数据库重置失败: ${error}`,
      };
    }
  }

  /**
   * 获取数据库状态信息
   */
  public async getStatus(): Promise<DatabaseResult<{
    connected: boolean;
    version: number;
    tableCount: number;
    totalRecords: number;
    databaseSize: number;
  }>> {
    try {
      const dbInfo = this.dbManager.getDatabaseInfo();

      // 获取数据库版本
      const versionResult = await this.dbManager.executeQuery(
        "SELECT configValue FROM systemConfigs WHERE configKey = 'db.version'"
      );
      const version = versionResult.success && versionResult.data.length > 0
        ? parseInt(versionResult.data[0].configValue)
        : 0;

      // 获取表数量
      const tableCountResult = await this.dbManager.executeQuery(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
      );
      const tableCount = tableCountResult.success
        ? tableCountResult.data[0].count
        : 0;

      // 获取总记录数（主要业务表）
      const recordCountQueries = [
        'SELECT COUNT(*) as count FROM projects',
        'SELECT COUNT(*) as count FROM contracts',
        'SELECT COUNT(*) as count FROM procurements',
        'SELECT COUNT(*) as count FROM fieldConfigs',
      ];

      let totalRecords = 0;
      for (const query of recordCountQueries) {
        try {
          const result = await this.dbManager.executeQuery(query);
          if (result.success) {
            totalRecords += result.data[0].count;
          }
        } catch {
          // 忽略单个表的查询错误
        }
      }

      return {
        success: true,
        data: {
          connected: dbInfo.connected,
          version,
          tableCount,
          totalRecords,
          databaseSize: dbInfo.size,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `获取数据库状态失败: ${error}`,
      };
    }
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<DatabaseResult<{
    status: 'healthy' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message: string;
    }>;
  }>> {
    const checks = [];
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';

    try {
      // 检查数据库连接
      const connectionCheck = this.dbManager.isConnected();
      checks.push({
        name: '数据库连接',
        status: connectionCheck ? 'pass' : 'fail',
        message: connectionCheck ? '连接正常' : '连接失败',
      });

      if (!connectionCheck) {
        overallStatus = 'error';
      }

      // 检查表结构
      const structureResult = await this.validateDatabaseStructure();
      checks.push({
        name: '表结构完整性',
        status: structureResult.success ? 'pass' : 'fail',
        message: structureResult.success ? '结构完整' : structureResult.error || '结构异常',
      });

      if (!structureResult.success) {
        overallStatus = 'error';
      }

      // 检查数据完整性
      try {
        const dataIntegrityResult = await this.checkDataIntegrity();
        checks.push({
          name: '数据完整性',
          status: dataIntegrityResult.success ? 'pass' : 'fail',
          message: dataIntegrityResult.success ? '数据完整' : dataIntegrityResult.error || '数据异常',
        });

        if (!dataIntegrityResult.success && overallStatus === 'healthy') {
          overallStatus = 'warning';
        }
      } catch (error) {
        checks.push({
          name: '数据完整性',
          status: 'fail',
          message: `检查失败: ${error}`,
        });
        overallStatus = 'warning';
      }

      return {
        success: true,
        data: {
          status: overallStatus,
          checks,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `健康检查失败: ${error}`,
      };
    }
  }

  /**
   * 检查数据完整性
   */
  private async checkDataIntegrity(): Promise<DatabaseResult<boolean>> {
    try {
      // 检查外键约束
      const foreignKeyChecks = [
        'SELECT COUNT(*) as count FROM contracts WHERE projectId IS NOT NULL AND projectId NOT IN (SELECT id FROM projects)',
        'SELECT COUNT(*) as count FROM procurements WHERE projectId IS NOT NULL AND projectId NOT IN (SELECT id FROM projects)',
      ];

      for (const query of foreignKeyChecks) {
        const result = await this.dbManager.executeQuery(query);
        if (result.success && result.data[0].count > 0) {
          return {
            success: false,
            error: '发现外键约束违反',
          };
        }
      }

      // 检查JSON字段格式
      const jsonChecks = [
        'SELECT COUNT(*) as count FROM contracts WHERE extendedFields IS NOT NULL AND NOT json_valid(extendedFields)',
        'SELECT COUNT(*) as count FROM procurements WHERE extendedFields IS NOT NULL AND NOT json_valid(extendedFields)',
        'SELECT COUNT(*) as count FROM fieldConfigs WHERE validationRule IS NOT NULL AND NOT json_valid(validationRule)',
        'SELECT COUNT(*) as count FROM dataCleaningRules WHERE ruleConfig IS NOT NULL AND NOT json_valid(ruleConfig)',
      ];

      for (const query of jsonChecks) {
        const result = await this.dbManager.executeQuery(query);
        if (result.success && result.data[0].count > 0) {
          return {
            success: false,
            error: '发现无效的JSON数据',
          };
        }
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `数据完整性检查失败: ${error}`,
      };
    }
  }
}
