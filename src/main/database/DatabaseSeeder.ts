/**
 * 数据库种子数据管理器
 * 负责插入默认的字段配置、清洗规则和系统配置
 */

import { DatabaseManager } from './DatabaseManager';
import type { DatabaseResult } from '@shared/types/database';

export class DatabaseSeeder {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * 执行数据库种子数据插入
   */
  public async seed(): Promise<DatabaseResult<boolean>> {
    try {
      console.log('开始插入种子数据...');

      // 1. 插入字段配置
      const fieldConfigResult = await this.seedFieldConfigs();
      if (!fieldConfigResult.success) {
        return fieldConfigResult;
      }

      // 2. 插入数据清洗规则
      const cleaningRulesResult = await this.seedCleaningRules();
      if (!cleaningRulesResult.success) {
        return cleaningRulesResult;
      }

      // 3. 插入系统配置
      const systemConfigResult = await this.seedSystemConfigs();
      if (!systemConfigResult.success) {
        return systemConfigResult;
      }

      // 4. 插入示例项目数据
      const projectsResult = await this.seedProjects();
      if (!projectsResult.success) {
        return projectsResult;
      }

      console.log('种子数据插入完成');
      return { success: true, data: true };

    } catch (error) {
      console.error('种子数据插入失败:', error);
      return {
        success: false,
        error: `种子数据插入失败: ${error}`,
      };
    }
  }

  /**
   * 插入字段配置数据
   */
  private async seedFieldConfigs(): Promise<DatabaseResult<boolean>> {
    try {
      // 检查是否已有数据
      const existingResult = await this.dbManager.executeQuery(
        'SELECT COUNT(*) as count FROM fieldConfigs'
      );

      if (existingResult.success && existingResult.data[0].count > 0) {
        console.log('字段配置已存在，跳过插入');
        return { success: true, data: true };
      }

      // 合同核心字段配置
      const contractFields = [
        ['contractSequence', '合同序号', 'contract', 'text', 'core', 1, 1, 0],
        ['contractNumber', '合同编号,合同号', 'contract', 'text', 'core', 1, 2, 1],
        ['contractName', '合同名称,项目名称', 'contract', 'text', 'core', 1, 3, 1],
        ['contractHandler', '合同签订经办人,经办人', 'contract', 'text', 'core', 1, 4, 0],
        ['partyA', '甲方,发包方', 'contract', 'text', 'core', 1, 5, 1],
        ['partyB', '乙方,承包方', 'contract', 'text', 'core', 1, 6, 1],
        ['partyBContact', '乙方负责人及联系方式,乙方联系方式', 'contract', 'text', 'core', 1, 7, 0],
        ['contractContact', '合同文本内乙方联系人及方式,合同联系人', 'contract', 'text', 'core', 1, 8, 0],
        ['contractAmount', '含税签约合同价（元）,合同金额,总金额', 'contract', 'number', 'core', 1, 9, 1],
        ['signDate', '签订日期,签约日期', 'contract', 'date', 'core', 1, 10, 1],
        ['contractPeriod', '合同工期/服务期限,工期,服务期限', 'contract', 'text', 'core', 1, 11, 0],
        ['guaranteeReturnDate', '履约担保退回时间,担保退回日期', 'contract', 'date', 'core', 1, 12, 0],
      ];

      // 采购核心字段配置
      const procurementFields = [
        ['procurementNumber', '招采编号,采购编号', 'procurement', 'text', 'core', 1, 1, 1],
        ['procurementName', '采购名称,项目名称', 'procurement', 'text', 'core', 1, 2, 1],
        ['procurer', '采购人', 'procurement', 'text', 'core', 1, 3, 1],
        ['planCompleteDate', '采购计划完成日期,计划完成日期', 'procurement', 'date', 'core', 1, 4, 0],
        ['demandApprovalDate', '采购需求书审批完成日期（OA）,需求审批日期', 'procurement', 'date', 'core', 1, 5, 0],
        ['procurementHandler', '招采经办人,采购经办人', 'procurement', 'text', 'core', 1, 6, 0],
        ['demandDepartment', '需求部门', 'procurement', 'text', 'core', 1, 7, 0],
        ['demandContact', '需求部门经办人及联系方式,需求部门联系方式', 'procurement', 'text', 'core', 1, 8, 0],
        ['budgetAmount', '预算金额（元）,预算金额', 'procurement', 'number', 'core', 1, 9, 0],
        ['controlPrice', '采购控制价（元）,控制价', 'procurement', 'number', 'core', 1, 10, 0],
        ['winningPrice', '中标价（元）,中标价', 'procurement', 'number', 'core', 1, 11, 0],
        ['procurementPlatform', '采购平台', 'procurement', 'text', 'core', 1, 12, 0],
        ['procurementMethod', '采购方式', 'procurement', 'text', 'core', 1, 13, 0],
        ['evaluationMethod', '评标方法', 'procurement', 'text', 'core', 1, 14, 0],
        ['awardMethod', '定标方法', 'procurement', 'text', 'core', 1, 15, 0],
        ['bidOpeningDate', '开标日期', 'procurement', 'date', 'core', 1, 16, 0],
        ['evaluationCommittee', '评标委员会成员', 'procurement', 'text', 'core', 1, 17, 0],
        ['awardCommittee', '定标委员会成员', 'procurement', 'text', 'core', 1, 18, 0],
        ['resultPublishDate', '平台中标结果公示完成日期（阳光采购平台）,结果公示日期', 'procurement', 'date', 'core', 1, 19, 0],
        ['noticeIssueDate', '中标通知书发放日期,通知书发放日期', 'procurement', 'date', 'core', 1, 20, 0],
        ['winner', '中标人', 'procurement', 'text', 'core', 1, 21, 0],
        ['winnerContact', '中标人联系人及方式,中标人联系方式', 'procurement', 'text', 'core', 1, 22, 0],
      ];

      // 插入合同字段配置
      for (const field of contractFields) {
        await this.dbManager.executeUpdate(
          `INSERT INTO fieldConfigs (fieldName, fieldAlias, fieldType, dataType, fieldCategory, isVisible, displayOrder, isRequired)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          field
        );
      }

      // 插入采购字段配置
      for (const field of procurementFields) {
        await this.dbManager.executeUpdate(
          `INSERT INTO fieldConfigs (fieldName, fieldAlias, fieldType, dataType, fieldCategory, isVisible, displayOrder, isRequired)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          field
        );
      }

      console.log('字段配置插入完成');
      return { success: true, data: true };

    } catch (error) {
      console.error('字段配置插入失败:', error);
      return {
        success: false,
        error: `字段配置插入失败: ${error}`,
      };
    }
  }

  /**
   * 插入数据清洗规则
   */
  private async seedCleaningRules(): Promise<DatabaseResult<boolean>> {
    try {
      // 检查是否已有数据
      const existingResult = await this.dbManager.executeQuery(
        'SELECT COUNT(*) as count FROM dataCleaningRules'
      );

      if (existingResult.success && existingResult.data[0].count > 0) {
        console.log('数据清洗规则已存在，跳过插入');
        return { success: true, data: true };
      }

      // 日期字段清洗规则
      const dateRules = [
        ['signDate', 'contract', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '签订日期格式统一', 1],
        ['guaranteeReturnDate', 'contract', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '担保退回日期格式统一', 1],
        ['planCompleteDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '计划完成日期格式统一', 1],
        ['demandApprovalDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '需求审批日期格式统一', 1],
        ['bidOpeningDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '开标日期格式统一', 1],
        ['resultPublishDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '结果公示日期格式统一', 1],
        ['noticeIssueDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '通知书发放日期格式统一', 1],
      ];

      // 金额字段清洗规则
      const numberRules = [
        ['contractAmount', 'contract', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '合同金额格式统一', 1],
        ['budgetAmount', 'procurement', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '预算金额格式统一', 1],
        ['controlPrice', 'procurement', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '控制价格式统一', 1],
        ['winningPrice', 'procurement', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '中标价格式统一', 1],
      ];

      // 插入日期清洗规则
      for (const rule of dateRules) {
        await this.dbManager.executeUpdate(
          `INSERT INTO dataCleaningRules (fieldName, fieldType, dataType, cleaningType, ruleConfig, description, priority)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          rule
        );
      }

      // 插入金额清洗规则
      for (const rule of numberRules) {
        await this.dbManager.executeUpdate(
          `INSERT INTO dataCleaningRules (fieldName, fieldType, dataType, cleaningType, ruleConfig, description, priority)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          rule
        );
      }

      console.log('数据清洗规则插入完成');
      return { success: true, data: true };

    } catch (error) {
      console.error('数据清洗规则插入失败:', error);
      return {
        success: false,
        error: `数据清洗规则插入失败: ${error}`,
      };
    }
  }

  /**
   * 插入系统配置
   */
  private async seedSystemConfigs(): Promise<DatabaseResult<boolean>> {
    try {
      // 检查是否已有数据
      const existingResult = await this.dbManager.executeQuery(
        'SELECT COUNT(*) as count FROM systemConfigs'
      );

      if (existingResult.success && existingResult.data[0].count > 0) {
        console.log('系统配置已存在，跳过插入');
        return { success: true, data: true };
      }

      const systemConfigs = [
        ['app.version', '1.0.0', 'string', '应用版本', 1],
        ['db.version', '2', 'number', '数据库版本', 1],
        ['import.batchSize', '1000', 'number', '导入批次大小', 0],
        ['export.maxRows', '10000', 'number', '导出最大行数', 0],
        ['cleaning.enabled', 'true', 'boolean', '是否启用数据清洗', 0],
        ['cleaning.logLevel', 'info', 'string', '清洗日志级别', 0],
      ];

      for (const config of systemConfigs) {
        await this.dbManager.executeUpdate(
          `INSERT INTO systemConfigs (configKey, configValue, configType, description, isSystem)
           VALUES (?, ?, ?, ?, ?)`,
          config
        );
      }

      console.log('系统配置插入完成');
      return { success: true, data: true };

    } catch (error) {
      console.error('系统配置插入失败:', error);
      return {
        success: false,
        error: `系统配置插入失败: ${error}`,
      };
    }
  }

  /**
   * 插入示例项目数据
   */
  private async seedProjects(): Promise<DatabaseResult<boolean>> {
    try {
      // 检查是否已有项目数据
      const existingResult = await this.dbManager.executeQuery(
        'SELECT COUNT(*) as count FROM projects'
      );

      if (existingResult.success && existingResult.data[0].count > 0) {
        console.log('项目数据已存在，跳过插入');
        return { success: true, data: true };
      }

      const sampleProjects = [
        ['PROJ001', '智慧城市建设项目', '智慧城市,城市建设', '智慧城市基础设施建设与数字化改造项目', 'active'],
        ['PROJ002', '数字化办公系统', '数字办公,OA系统', '企业数字化办公平台开发与实施', 'active'],
        ['PROJ003', '绿色能源发展计划', '绿色能源,新能源', '可再生能源项目开发与推广', 'active'],
        ['PROJ004', '教育信息化升级', '教育信息化,智慧教育', '学校信息化设备采购与系统升级', 'active'],
        ['PROJ005', '医疗设备采购项目', '医疗设备,医院建设', '医院医疗设备更新与采购项目', 'active']
      ];

      for (const project of sampleProjects) {
        await this.dbManager.executeUpdate(
          `INSERT INTO projects (projectCode, projectName, projectAlias, description, status)
           VALUES (?, ?, ?, ?, ?)`,
          project
        );
      }

      console.log('示例项目数据插入完成');
      return { success: true, data: true };

    } catch (error) {
      console.error('示例项目数据插入失败:', error);
      return {
        success: false,
        error: `示例项目数据插入失败: ${error}`,
      };
    }
  }
}
