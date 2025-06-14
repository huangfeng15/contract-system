/**
 * 数据库迁移管理类
 * 负责数据库表结构的创建和版本管理
 */

import { DatabaseManager } from './DatabaseManager';
import {
  TABLE_NAMES,
  DATABASE_CONFIG,
  DB_ERROR_MESSAGES
} from '@shared/constants/database';
import type { Migration, DatabaseResult } from '@shared/types/database';

export class MigrationManager {
  private dbManager: DatabaseManager;
  private migrations: Migration[] = [];

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.initializeMigrations();
  }

  /**
   * 初始化迁移脚本
   */
  private initializeMigrations(): void {
    this.migrations = [
      {
        version: 1,
        description: '创建基础表结构',
        up: [
          // 创建项目表
          `CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.PROJECTS} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectCode TEXT UNIQUE NOT NULL,
            projectName TEXT NOT NULL,
            projectAlias TEXT,
            description TEXT,
            status TEXT DEFAULT 'active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            CHECK (status IN ('active', 'inactive', 'archived')),
            CHECK (length(projectCode) <= 50),
            CHECK (length(projectName) <= 200)
          )`,

          // 创建项目表索引
          `CREATE INDEX IF NOT EXISTS idx_projects_code ON ${TABLE_NAMES.PROJECTS}(projectCode)`,
          `CREATE INDEX IF NOT EXISTS idx_projects_name ON ${TABLE_NAMES.PROJECTS}(projectName)`,
          `CREATE INDEX IF NOT EXISTS idx_projects_status ON ${TABLE_NAMES.PROJECTS}(status)`,


          // 创建合同数据表（融入文件信息）
          `CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.CONTRACTS} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectId INTEGER,
            contractNumber TEXT,

            -- 原始数据
            data TEXT NOT NULL,
            processedData TEXT,

            -- 文件信息
            filePath TEXT NOT NULL,
            fileName TEXT NOT NULL,
            fileSize INTEGER,
            fileHash TEXT,
            sheetName TEXT NOT NULL,

            -- 处理状态
            status TEXT DEFAULT 'pending',
            totalRows INTEGER DEFAULT 0,
            processedRows INTEGER DEFAULT 0,
            errorRows INTEGER DEFAULT 0,

            -- 匹配和验证
            matchScore REAL DEFAULT 0,
            isVerified BOOLEAN DEFAULT 0,
            hasErrors BOOLEAN DEFAULT 0,
            errorInfo TEXT,
            processingLog TEXT,

            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (projectId) REFERENCES ${TABLE_NAMES.PROJECTS}(id) ON DELETE SET NULL,

            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            CHECK (matchScore >= 0 AND matchScore <= 1),
            CHECK (totalRows >= 0),
            CHECK (processedRows >= 0),
            CHECK (errorRows >= 0),
            CHECK (json_valid(data)),
            CHECK (processedData IS NULL OR json_valid(processedData))
          )`,

          // 创建合同数据表索引
          `CREATE INDEX IF NOT EXISTS idx_contracts_project ON ${TABLE_NAMES.CONTRACTS}(projectId)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_number ON ${TABLE_NAMES.CONTRACTS}(contractNumber)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_verified ON ${TABLE_NAMES.CONTRACTS}(isVerified)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_errors ON ${TABLE_NAMES.CONTRACTS}(hasErrors)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_score ON ${TABLE_NAMES.CONTRACTS}(matchScore)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_status ON ${TABLE_NAMES.CONTRACTS}(status)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_file ON ${TABLE_NAMES.CONTRACTS}(fileName)`,

          // 创建采购数据表（融入文件信息）
          `CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.PROCUREMENTS} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectId INTEGER,
            procurementNumber TEXT,

            -- 原始数据
            data TEXT NOT NULL,
            processedData TEXT,

            -- 文件信息
            filePath TEXT NOT NULL,
            fileName TEXT NOT NULL,
            fileSize INTEGER,
            fileHash TEXT,
            sheetName TEXT NOT NULL,

            -- 处理状态
            status TEXT DEFAULT 'pending',
            totalRows INTEGER DEFAULT 0,
            processedRows INTEGER DEFAULT 0,
            errorRows INTEGER DEFAULT 0,

            -- 匹配和验证
            matchScore REAL DEFAULT 0,
            isVerified BOOLEAN DEFAULT 0,
            hasErrors BOOLEAN DEFAULT 0,
            errorInfo TEXT,
            processingLog TEXT,

            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (projectId) REFERENCES ${TABLE_NAMES.PROJECTS}(id) ON DELETE SET NULL,

            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            CHECK (matchScore >= 0 AND matchScore <= 1),
            CHECK (totalRows >= 0),
            CHECK (processedRows >= 0),
            CHECK (errorRows >= 0),
            CHECK (json_valid(data)),
            CHECK (processedData IS NULL OR json_valid(processedData))
          )`,

          // 创建采购数据表索引
          `CREATE INDEX IF NOT EXISTS idx_procurements_project ON ${TABLE_NAMES.PROCUREMENTS}(projectId)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_number ON ${TABLE_NAMES.PROCUREMENTS}(procurementNumber)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_verified ON ${TABLE_NAMES.PROCUREMENTS}(isVerified)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_errors ON ${TABLE_NAMES.PROCUREMENTS}(hasErrors)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_score ON ${TABLE_NAMES.PROCUREMENTS}(matchScore)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_status ON ${TABLE_NAMES.PROCUREMENTS}(status)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_file ON ${TABLE_NAMES.PROCUREMENTS}(fileName)`,

        ],
        down: [
          `DROP TABLE IF EXISTS ${TABLE_NAMES.CONTRACTS}`,
          `DROP TABLE IF EXISTS ${TABLE_NAMES.PROCUREMENTS}`,
          `DROP TABLE IF EXISTS ${TABLE_NAMES.PROJECTS}`,
        ],
      },
      {
        version: 2,
        description: '升级到混合模式数据库结构',
        up: [
          // 删除旧表
          `DROP TABLE IF EXISTS ${TABLE_NAMES.CONTRACTS}`,
          `DROP TABLE IF EXISTS ${TABLE_NAMES.PROCUREMENTS}`,

          // 创建字段配置表 - 简化约束版本
          `CREATE TABLE IF NOT EXISTS fieldConfigs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fieldName TEXT NOT NULL,
            fieldAlias TEXT,
            fieldType TEXT NOT NULL,
            dataType TEXT NOT NULL,
            fieldCategory TEXT DEFAULT 'extended',
            isVisible BOOLEAN DEFAULT 1,
            displayOrder INTEGER DEFAULT 0,
            isRequired BOOLEAN DEFAULT 0,
            defaultValue TEXT,
            validationRule TEXT,
            cleaningRule TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            -- 简化约束，只保留必要的检查
            CHECK (displayOrder >= 0),
            UNIQUE(fieldName, fieldCategory)
          )`,

          // 创建字段配置表索引
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_type ON fieldConfigs(fieldType)`,
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_category ON fieldConfigs(fieldCategory)`,
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_order ON fieldConfigs(displayOrder)`,
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_visible ON fieldConfigs(isVisible)`,

          // 创建数据清洗规则表
          `CREATE TABLE IF NOT EXISTS dataCleaningRules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fieldName TEXT NOT NULL,
            fieldType TEXT NOT NULL,
            dataType TEXT NOT NULL,
            cleaningType TEXT NOT NULL,
            ruleConfig TEXT NOT NULL,
            isActive BOOLEAN DEFAULT 1,
            priority INTEGER DEFAULT 0,
            description TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            CHECK (fieldType IN ('contract', 'procurement')),
            CHECK (dataType IN ('date', 'number', 'text')),
            CHECK (cleaningType IN ('date_format', 'number_format', 'text_clean', 'remove_chars', 'trim_spaces')),
            CHECK (json_valid(ruleConfig)),
            CHECK (priority >= 0),
            UNIQUE(fieldName, fieldType, cleaningType)
          )`,

          // 创建数据清洗规则表索引
          `CREATE INDEX IF NOT EXISTS idx_cleaningRules_field ON dataCleaningRules(fieldName, fieldType)`,
          `CREATE INDEX IF NOT EXISTS idx_cleaningRules_type ON dataCleaningRules(cleaningType)`,
          `CREATE INDEX IF NOT EXISTS idx_cleaningRules_active ON dataCleaningRules(isActive)`,
          `CREATE INDEX IF NOT EXISTS idx_cleaningRules_priority ON dataCleaningRules(priority)`,

          // 创建合同数据表（混合模式）
          `CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.CONTRACTS} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectId INTEGER,

            -- 核心业务字段（固定列）
            contractSequence TEXT,
            contractNumber TEXT,
            contractName TEXT,
            contractHandler TEXT,
            partyA TEXT,
            partyB TEXT,
            partyBContact TEXT,
            contractContact TEXT,
            contractAmount DECIMAL(15,2),
            signDate DATE,
            contractPeriod TEXT,
            guaranteeReturnDate DATE,

            -- 文件信息
            filePath TEXT NOT NULL,
            fileName TEXT NOT NULL,
            fileSize INTEGER,
            fileHash TEXT,
            sheetName TEXT NOT NULL,

            -- 扩展字段
            extendedFields TEXT,

            -- 处理状态
            status TEXT DEFAULT 'pending',
            totalRows INTEGER DEFAULT 0,
            processedRows INTEGER DEFAULT 0,
            errorRows INTEGER DEFAULT 0,
            matchScore REAL DEFAULT 0,
            isVerified BOOLEAN DEFAULT 0,
            hasErrors BOOLEAN DEFAULT 0,
            errorInfo TEXT,
            processingLog TEXT,
            cleaningLog TEXT,

            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (projectId) REFERENCES ${TABLE_NAMES.PROJECTS}(id) ON DELETE SET NULL,

            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            CHECK (totalRows >= 0),
            CHECK (processedRows >= 0),
            CHECK (errorRows >= 0),
            CHECK (matchScore >= 0 AND matchScore <= 1),
            CHECK (contractAmount >= 0),
            CHECK (extendedFields IS NULL OR json_valid(extendedFields))
          )`,

          // 创建合同表核心字段索引
          `CREATE INDEX IF NOT EXISTS idx_contracts_project ON ${TABLE_NAMES.CONTRACTS}(projectId)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_sequence ON ${TABLE_NAMES.CONTRACTS}(contractSequence)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_number ON ${TABLE_NAMES.CONTRACTS}(contractNumber)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_name ON ${TABLE_NAMES.CONTRACTS}(contractName)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_amount ON ${TABLE_NAMES.CONTRACTS}(contractAmount)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_signDate ON ${TABLE_NAMES.CONTRACTS}(signDate)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_partyA ON ${TABLE_NAMES.CONTRACTS}(partyA)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_partyB ON ${TABLE_NAMES.CONTRACTS}(partyB)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_status ON ${TABLE_NAMES.CONTRACTS}(status)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_verified ON ${TABLE_NAMES.CONTRACTS}(isVerified)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_file ON ${TABLE_NAMES.CONTRACTS}(fileName)`,
          `CREATE INDEX IF NOT EXISTS idx_contracts_created ON ${TABLE_NAMES.CONTRACTS}(createdAt)`,

          // 创建采购数据表（混合模式）
          `CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.PROCUREMENTS} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectId INTEGER,

            -- 核心业务字段（固定列）
            procurementNumber TEXT,
            procurementName TEXT,
            procurer TEXT,
            planCompleteDate DATE,
            demandApprovalDate DATE,
            procurementHandler TEXT,
            demandDepartment TEXT,
            demandContact TEXT,
            budgetAmount DECIMAL(15,2),
            controlPrice DECIMAL(15,2),
            winningPrice DECIMAL(15,2),
            procurementPlatform TEXT,
            procurementMethod TEXT,
            evaluationMethod TEXT,
            awardMethod TEXT,
            bidOpeningDate DATE,
            evaluationCommittee TEXT,
            awardCommittee TEXT,
            resultPublishDate DATE,
            noticeIssueDate DATE,
            winner TEXT,
            winnerContact TEXT,

            -- 文件信息
            filePath TEXT NOT NULL,
            fileName TEXT NOT NULL,
            fileSize INTEGER,
            fileHash TEXT,
            sheetName TEXT NOT NULL,

            -- 扩展字段
            extendedFields TEXT,

            -- 处理状态
            status TEXT DEFAULT 'pending',
            totalRows INTEGER DEFAULT 0,
            processedRows INTEGER DEFAULT 0,
            errorRows INTEGER DEFAULT 0,
            matchScore REAL DEFAULT 0,
            isVerified BOOLEAN DEFAULT 0,
            hasErrors BOOLEAN DEFAULT 0,
            errorInfo TEXT,
            processingLog TEXT,
            cleaningLog TEXT,

            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (projectId) REFERENCES ${TABLE_NAMES.PROJECTS}(id) ON DELETE SET NULL,

            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            CHECK (totalRows >= 0),
            CHECK (processedRows >= 0),
            CHECK (errorRows >= 0),
            CHECK (matchScore >= 0 AND matchScore <= 1),
            CHECK (budgetAmount >= 0),
            CHECK (controlPrice >= 0),
            CHECK (winningPrice >= 0),
            CHECK (extendedFields IS NULL OR json_valid(extendedFields))
          )`,

          // 创建采购表核心字段索引
          `CREATE INDEX IF NOT EXISTS idx_procurements_project ON ${TABLE_NAMES.PROCUREMENTS}(projectId)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_number ON ${TABLE_NAMES.PROCUREMENTS}(procurementNumber)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_name ON ${TABLE_NAMES.PROCUREMENTS}(procurementName)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_procurer ON ${TABLE_NAMES.PROCUREMENTS}(procurer)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_budgetAmount ON ${TABLE_NAMES.PROCUREMENTS}(budgetAmount)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_controlPrice ON ${TABLE_NAMES.PROCUREMENTS}(controlPrice)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_winningPrice ON ${TABLE_NAMES.PROCUREMENTS}(winningPrice)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_planDate ON ${TABLE_NAMES.PROCUREMENTS}(planCompleteDate)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_bidDate ON ${TABLE_NAMES.PROCUREMENTS}(bidOpeningDate)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_status ON ${TABLE_NAMES.PROCUREMENTS}(status)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_verified ON ${TABLE_NAMES.PROCUREMENTS}(isVerified)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_file ON ${TABLE_NAMES.PROCUREMENTS}(fileName)`,
          `CREATE INDEX IF NOT EXISTS idx_procurements_created ON ${TABLE_NAMES.PROCUREMENTS}(createdAt)`,

          // 创建系统配置表
          `CREATE TABLE IF NOT EXISTS systemConfigs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            configKey TEXT UNIQUE NOT NULL,
            configValue TEXT,
            configType TEXT DEFAULT 'string',
            description TEXT,
            isSystem BOOLEAN DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            CHECK (configType IN ('string', 'number', 'boolean', 'json'))
          )`,

          // 创建系统配置表索引
          `CREATE INDEX IF NOT EXISTS idx_systemConfigs_key ON systemConfigs(configKey)`,
          `CREATE INDEX IF NOT EXISTS idx_systemConfigs_system ON systemConfigs(isSystem)`,
        ],
        down: [
          `DROP TABLE IF EXISTS dataCleaningRules`,
          `DROP TABLE IF EXISTS fieldConfigs`,
          `DROP TABLE IF EXISTS systemConfigs`,
          `DROP TABLE IF EXISTS ${TABLE_NAMES.CONTRACTS}`,
          `DROP TABLE IF EXISTS ${TABLE_NAMES.PROCUREMENTS}`,
        ],
      },
      {
        version: 3,
        description: '修复字段配置表约束问题',
        up: [
          // 重建字段配置表，移除过于严格的CHECK约束
          `DROP TABLE IF EXISTS fieldConfigs_backup`,
          `CREATE TABLE fieldConfigs_backup AS SELECT * FROM fieldConfigs`,
          `DROP TABLE fieldConfigs`,
          `CREATE TABLE fieldConfigs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fieldName TEXT NOT NULL,
            fieldAlias TEXT,
            fieldType TEXT NOT NULL,
            dataType TEXT NOT NULL,
            fieldCategory TEXT DEFAULT 'extended',
            isVisible BOOLEAN DEFAULT 1,
            displayOrder INTEGER DEFAULT 0,
            isRequired BOOLEAN DEFAULT 0,
            defaultValue TEXT,
            validationRule TEXT,
            cleaningRule TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            -- 简化约束，只保留必要的检查
            CHECK (displayOrder >= 0),
            UNIQUE(fieldName, fieldCategory)
          )`,
          `INSERT INTO fieldConfigs SELECT * FROM fieldConfigs_backup`,
          `DROP TABLE fieldConfigs_backup`,

          // 重建索引
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_type ON fieldConfigs(fieldType)`,
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_category ON fieldConfigs(fieldCategory)`,
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_order ON fieldConfigs(displayOrder)`,
          `CREATE INDEX IF NOT EXISTS idx_fieldConfigs_visible ON fieldConfigs(isVisible)`
        ],
        down: [
          // 回滚操作
          `DROP TABLE IF EXISTS fieldConfigs`
        ],
      },
    ];
  }

  /**
   * 执行数据库迁移
   */
  public async migrate(): Promise<DatabaseResult<boolean>> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const targetVersion = DATABASE_CONFIG.DB_VERSION;

      console.log(`当前数据库版本: ${currentVersion}, 目标版本: ${targetVersion}`);

      if (currentVersion >= targetVersion) {
        console.log('数据库已是最新版本，无需迁移');
        return { success: true, data: true };
      }

      // 执行迁移
      for (const migration of this.migrations) {
        if (migration.version > currentVersion && migration.version <= targetVersion) {
          console.log(`执行迁移: v${migration.version} - ${migration.description}`);

          const result = await this.executeMigration(migration);
          if (!result.success) {
            return result;
          }
        }
      }

      // 更新数据库版本号
      await this.updateDatabaseVersion(targetVersion);

      console.log('数据库迁移完成');
      return { success: true, data: true };

    } catch (error) {
      console.error('数据库迁移失败:', error);
      return {
        success: false,
        error: `${DB_ERROR_MESSAGES.MIGRATION_FAILED}: ${error}`,
      };
    }
  }

  /**
   * 获取当前数据库版本
   */
  private async getCurrentVersion(): Promise<number> {
    try {
      // 检查systemConfigs表是否存在
      const systemConfigsExists = await this.dbManager.tableExists('systemConfigs');
      if (!systemConfigsExists) {
        return 0;
      }

      // 从systemConfigs表中获取版本号
      const versionResult = await this.dbManager.executeQuery(
        "SELECT configValue FROM systemConfigs WHERE configKey = 'db.version'"
      );

      if (versionResult.success && versionResult.data && versionResult.data.length > 0) {
        return parseInt(versionResult.data[0].configValue) || 0;
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * 执行单个迁移
   */
  private async executeMigration(migration: Migration): Promise<DatabaseResult<boolean>> {
    return await this.dbManager.executeTransaction(() => {
      const db = this.dbManager.getDatabase();

      for (const sql of migration.up) {
        try {
          db.exec(sql);
        } catch (error) {
          throw new Error(`迁移SQL执行失败: ${sql} - ${error}`);
        }
      }

      return true;
    });
  }

  /**
   * 更新数据库版本号
   */
  private async updateDatabaseVersion(version: number): Promise<void> {
    try {
      await this.dbManager.executeUpdate(
        `INSERT OR REPLACE INTO systemConfigs (configKey, configValue, configType, description, isSystem)
         VALUES ('db.version', ?, 'number', '数据库版本号', 1)`,
        [version.toString()]
      );
      console.log(`数据库版本已更新为: ${version}`);
    } catch (error) {
      console.error('更新数据库版本失败:', error);
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
      // 执行所有迁移的回滚脚本
      for (const migration of this.migrations.reverse()) {
        for (const sql of migration.down) {
          await this.dbManager.executeUpdate(sql);
        }
      }

      console.log('数据库重置完成');
      return { success: true, data: true };

    } catch (error) {
      console.error('数据库重置失败:', error);
      return {
        success: false,
        error: `数据库重置失败: ${error}`,
      };
    }
  }
}
