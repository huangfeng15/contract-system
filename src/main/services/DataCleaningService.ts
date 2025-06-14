/**
 * 数据清洗服务
 * 负责根据配置规则对导入的数据进行清洗和格式化
 */

import { DatabaseManager } from '../database/DatabaseManager';
import type { DatabaseResult } from '@shared/types/database';

export interface CleaningRule {
  id: number;
  fieldName: string;
  fieldType: 'contract' | 'procurement';
  dataType: 'date' | 'number' | 'text';
  cleaningType: string;
  ruleConfig: any;
  isActive: boolean;
  priority: number;
  description?: string;
}

export interface CleaningResult {
  fieldName: string;
  originalValue: any;
  cleanedValue: any;
  appliedRules: string[];
  status: 'success' | 'warning' | 'error';
  message?: string;
}

export interface CleaningLog {
  recordId: number;
  tableName: string;
  results: CleaningResult[];
  timestamp: string;
  totalFields: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
}

export class DataCleaningService {
  private dbManager: DatabaseManager;
  private cleaningRules: Map<string, CleaningRule[]> = new Map();

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * 初始化清洗规则缓存
   */
  public async initializeRules(): Promise<DatabaseResult<boolean>> {
    try {
      const result = await this.dbManager.executeQuery(
        'SELECT * FROM dataCleaningRules WHERE isActive = 1 ORDER BY priority ASC'
      );

      if (!result.success) {
        return result;
      }

      // 按字段类型分组缓存规则
      this.cleaningRules.clear();
      for (const rule of result.data) {
        const key = `${rule.fieldType}.${rule.fieldName}`;
        if (!this.cleaningRules.has(key)) {
          this.cleaningRules.set(key, []);
        }
        this.cleaningRules.get(key)!.push({
          ...rule,
          ruleConfig: JSON.parse(rule.ruleConfig)
        });
      }

      console.log(`已加载 ${result.data.length} 条数据清洗规则`);
      return { success: true, data: true };

    } catch (error) {
      console.error('初始化清洗规则失败:', error);
      return {
        success: false,
        error: `初始化清洗规则失败: ${error}`,
      };
    }
  }

  /**
   * 清洗单条记录的数据
   */
  public async cleanRecord(
    recordData: Record<string, any>,
    fieldType: 'contract' | 'procurement'
  ): Promise<{
    cleanedData: Record<string, any>;
    cleaningLog: CleaningLog;
  }> {
    const cleanedData = { ...recordData };
    const results: CleaningResult[] = [];
    const timestamp = new Date().toISOString();

    for (const [fieldName, originalValue] of Object.entries(recordData)) {
      if (originalValue === null || originalValue === undefined) {
        continue;
      }

      const ruleKey = `${fieldType}.${fieldName}`;
      const fieldRules = this.cleaningRules.get(ruleKey) || [];

      if (fieldRules.length === 0) {
        continue;
      }

      const cleaningResult = await this.cleanField(
        fieldName,
        originalValue,
        fieldRules
      );

      results.push(cleaningResult);
      cleanedData[fieldName] = cleaningResult.cleanedValue;
    }

    const cleaningLog: CleaningLog = {
      recordId: recordData.id || 0,
      tableName: fieldType === 'contract' ? 'contracts' : 'procurements',
      results,
      timestamp,
      totalFields: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      warningCount: results.filter(r => r.status === 'warning').length,
      errorCount: results.filter(r => r.status === 'error').length,
    };

    return { cleanedData, cleaningLog };
  }

  /**
   * 清洗单个字段的值
   */
  private async cleanField(
    fieldName: string,
    originalValue: any,
    rules: CleaningRule[]
  ): Promise<CleaningResult> {
    let cleanedValue = originalValue;
    const appliedRules: string[] = [];
    let status: 'success' | 'warning' | 'error' = 'success';
    let message = '';

    try {
      for (const rule of rules) {
        const previousValue = cleanedValue;

        switch (rule.cleaningType) {
          case 'date_format':
            cleanedValue = this.cleanDateField(cleanedValue, rule.ruleConfig);
            break;
          case 'number_format':
            cleanedValue = this.cleanNumberField(cleanedValue, rule.ruleConfig);
            break;
          case 'text_clean':
            cleanedValue = this.cleanTextField(cleanedValue, rule.ruleConfig);
            break;
          case 'remove_chars':
            cleanedValue = this.removeCharacters(cleanedValue, rule.ruleConfig);
            break;
          case 'trim_spaces':
            cleanedValue = this.trimSpaces(cleanedValue, rule.ruleConfig);
            break;
          default:
            console.warn(`未知的清洗类型: ${rule.cleaningType}`);
            continue;
        }

        if (previousValue !== cleanedValue) {
          appliedRules.push(rule.cleaningType);
        }
      }

      // 检查清洗结果
      if (cleanedValue === null || cleanedValue === undefined || cleanedValue === '') {
        status = 'warning';
        message = '清洗后值为空';
      }

    } catch (error) {
      status = 'error';
      message = `清洗失败: ${error}`;
      cleanedValue = originalValue; // 保留原值
    }

    return {
      fieldName,
      originalValue,
      cleanedValue,
      appliedRules,
      status,
      message,
    };
  }

  /**
   * 清洗日期字段
   */
  private cleanDateField(value: any, config: any): any {
    if (!value || typeof value !== 'string') {
      return value;
    }

    // 移除跨行符号和多余空格
    let cleanValue = value.replace(/[\r\n]/g, '').trim();

    // 处理空值
    if (config.nullValues && config.nullValues.includes(cleanValue)) {
      return null;
    }

    // 尝试解析各种日期格式
    const formats = config.formats || [];
    for (const format of formats) {
      try {
        const date = this.parseDate(cleanValue, format);
        if (date) {
          return this.formatDate(date, config.output || 'YYYY-MM-DD');
        }
      } catch {
        continue;
      }
    }

    // 如果无法解析，返回原值
    return value;
  }

  /**
   * 清洗数值字段
   */
  private cleanNumberField(value: any, config: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    let cleanValue = String(value);

    // 移除指定字符
    if (config.remove_chars) {
      for (const char of config.remove_chars) {
        cleanValue = cleanValue.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }
    }

    // 移除跨行符号和空格
    cleanValue = cleanValue.replace(/[\r\n\s]/g, '');

    // 处理空值
    if (!cleanValue || (config.nullValues && config.nullValues.includes(cleanValue))) {
      return null;
    }

    // 转换为数值
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) {
      return value; // 无法转换时返回原值
    }

    // 处理小数位数
    if (config.decimal_places !== undefined) {
      return parseFloat(numValue.toFixed(config.decimal_places));
    }

    return numValue;
  }

  /**
   * 清洗文本字段
   */
  private cleanTextField(value: any, config: any): any {
    if (!value || typeof value !== 'string') {
      return value;
    }

    let cleanValue = value;

    // 移除跨行符号
    if (config.remove_line_breaks) {
      cleanValue = cleanValue.replace(/[\r\n]/g, ' ');
    }

    // 标准化空格
    if (config.normalize_spaces) {
      cleanValue = cleanValue.replace(/\s+/g, ' ');
    }

    // 去除前后空格
    if (config.trim) {
      cleanValue = cleanValue.trim();
    }

    // 处理空值
    if (!cleanValue || (config.nullValues && config.nullValues.includes(cleanValue))) {
      return null;
    }

    return cleanValue;
  }

  /**
   * 移除指定字符
   */
  private removeCharacters(value: any, config: any): any {
    if (!value || typeof value !== 'string') {
      return value;
    }

    let cleanValue = value;
    if (config.characters) {
      for (const char of config.characters) {
        cleanValue = cleanValue.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }
    }

    return cleanValue;
  }

  /**
   * 去除空格
   */
  private trimSpaces(value: any, config: any): any {
    if (!value || typeof value !== 'string') {
      return value;
    }

    return value.trim();
  }

  /**
   * 解析日期字符串
   */
  private parseDate(dateStr: string, format: string): Date | null {
    // 简化的日期解析逻辑
    // 实际项目中可以使用 moment.js 或 date-fns 等库

    if (format === 'YYYY-MM-DD') {
      const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
    }

    if (format === 'YYYY/MM/DD') {
      const match = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
      if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
    }

    // 中文日期格式
    if (format === 'YYYY年MM月DD日') {
      const match = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
      if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
    }

    return null;
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date, format: string): string {
    if (format === 'YYYY-MM-DD') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * 批量清洗数据
   */
  public async batchCleanData(
    tableName: 'contracts' | 'procurements',
    batchSize: number = 100
  ): Promise<DatabaseResult<{ processedCount: number; errorCount: number }>> {
    try {
      await this.initializeRules();

      const fieldType = tableName === 'contracts' ? 'contract' : 'procurement';
      let processedCount = 0;
      let errorCount = 0;
      let offset = 0;

      while (true) {
        // 分批获取数据
        const result = await this.dbManager.executeQuery(
          `SELECT * FROM ${tableName} WHERE cleaningLog IS NULL LIMIT ? OFFSET ?`,
          [batchSize, offset]
        );

        if (!result.success || result.data.length === 0) {
          break;
        }

        // 清洗每条记录
        for (const record of result.data) {
          try {
            const { cleanedData, cleaningLog } = await this.cleanRecord(record, fieldType);

            // 更新记录
            const updateResult = await this.updateCleanedRecord(
              tableName,
              record.id,
              cleanedData,
              cleaningLog
            );

            if (updateResult.success) {
              processedCount++;
            } else {
              errorCount++;
            }

          } catch (error) {
            console.error(`清洗记录 ${record.id} 失败:`, error);
            errorCount++;
          }
        }

        offset += batchSize;
      }

      return {
        success: true,
        data: { processedCount, errorCount },
      };

    } catch (error) {
      console.error('批量清洗数据失败:', error);
      return {
        success: false,
        error: `批量清洗数据失败: ${error}`,
      };
    }
  }

  /**
   * 简化的字段值清洗方法（用于ImportService）
   */
  public async cleanFieldValue(value: any, fieldType: string): Promise<any> {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    try {
      // 基础文本清洗
      let cleanValue = String(value).trim();

      // 移除跨行字符
      cleanValue = cleanValue.replace(/[\r\n\t]/g, ' ');

      // 合并多个空格
      cleanValue = cleanValue.replace(/\s+/g, ' ');

      // 根据字段类型进行特定清洗
      switch (fieldType) {
        case 'date':
          return this.cleanDateValue(cleanValue);
        case 'number':
        case 'amount':
          return this.cleanNumberValue(cleanValue);
        default:
          return cleanValue || null;
      }
    } catch (error) {
      console.error(`清洗字段值失败: ${value}, 类型: ${fieldType}`, error);
      return value;
    }
  }

  /**
   * 简化的日期值清洗
   */
  private cleanDateValue(value: string): string | null {
    if (!value) return null;

    try {
      // 移除常见的无效字符
      let dateStr = value.replace(/[^\d\-\/\.\s年月日]/g, '');

      // 处理中文日期格式
      if (dateStr.includes('年') || dateStr.includes('月') || dateStr.includes('日')) {
        dateStr = dateStr
          .replace(/年/g, '-')
          .replace(/月/g, '-')
          .replace(/日/g, '');
      }

      // 标准化分隔符
      dateStr = dateStr.replace(/[\/\.]/g, '-');

      // 移除多余的空格和连字符
      dateStr = dateStr.replace(/\s+/g, '').replace(/-+/g, '-');

      // 尝试解析日期
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return null;
      }

      // 返回标准格式 YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * 简化的数值清洗
   */
  private cleanNumberValue(value: string): number | null {
    if (!value) return null;

    try {
      // 移除货币符号和单位
      let numStr = value.replace(/[￥$€£¥元万千百十,，\s]/g, '');

      // 处理中文数字单位
      if (numStr.includes('万')) {
        numStr = numStr.replace('万', '');
        const num = parseFloat(numStr);
        return isNaN(num) ? null : num * 10000;
      }

      // 解析数字
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    } catch (error) {
      return null;
    }
  }

  /**
   * 更新清洗后的记录
   */
  private async updateCleanedRecord(
    tableName: string,
    recordId: number,
    cleanedData: Record<string, any>,
    cleaningLog: CleaningLog
  ): Promise<DatabaseResult<boolean>> {
    try {
      // 构建更新SQL
      const updateFields = [];
      const updateValues = [];

      for (const [field, value] of Object.entries(cleanedData)) {
        if (field !== 'id') {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      }

      updateFields.push('cleaningLog = ?');
      updateValues.push(JSON.stringify(cleaningLog));
      updateValues.push(recordId);

      const sql = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE id = ?`;

      return await this.dbManager.executeUpdate(sql, updateValues);

    } catch (error) {
      return {
        success: false,
        error: `更新记录失败: ${error}`,
      };
    }
  }
}
