/**
 * 字段管理服务
 * 负责字段配置的数据库操作
 */

import { BaseService } from './BaseService';
import type { DatabaseResult } from '@shared/types/database';
import type { DatabaseManager } from '../database/DatabaseManager';

export interface FieldConfig {
  id?: number;
  fieldName: string;
  fieldAlias: string;
  fieldType: string;
  dataType: string;
  fieldCategory: 'contract' | 'procurement';
  isVisible: boolean;
  displayOrder: number;
  isRequired: boolean;
  defaultValue?: string;
  validationRule?: string;
  cleaningRule?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class FieldService extends BaseService<FieldConfig> {
  constructor(dbManager: DatabaseManager) {
    super('fieldConfigs', dbManager);
  }

  /**
   * 初始化验证规则 - 简化版本，减少约束提高效率
   */
  protected initializeValidationRules(): void {
    this.validationRules = {
      fieldName: {
        required: true,
        type: 'string',
        maxLength: 100
      },
      fieldType: {
        required: true,
        type: 'string',
        maxLength: 50
      },
      fieldCategory: {
        required: true,
        type: 'string'
        // 移除严格的枚举验证，允许更灵活的值
      },
      fieldAlias: {
        type: 'string',
        maxLength: 500
      },
      dataType: {
        type: 'string',
        maxLength: 20
      },
      isVisible: {
        type: 'boolean'
      },
      displayOrder: {
        type: 'number',
        min: 0
      },
      isRequired: {
        type: 'boolean'
      }
    };
  }

  /**
   * 预处理字段数据，确保SQLite兼容性
   */
  private preprocessFieldData(data: any): any {
    const processed = { ...data };

    // 将布尔值转换为数字（SQLite兼容）
    if (typeof processed.isVisible === 'boolean') {
      processed.isVisible = processed.isVisible ? 1 : 0;
    }
    if (typeof processed.isRequired === 'boolean') {
      processed.isRequired = processed.isRequired ? 1 : 0;
    }

    // 确保数字类型
    if (processed.displayOrder !== undefined) {
      processed.displayOrder = Number(processed.displayOrder) || 0;
    }

    // 确保字符串类型，处理null/undefined
    if (processed.fieldAlias === null || processed.fieldAlias === undefined) {
      processed.fieldAlias = '';
    }
    if (processed.defaultValue === null || processed.defaultValue === undefined) {
      processed.defaultValue = '';
    }
    if (processed.validationRule === null || processed.validationRule === undefined) {
      processed.validationRule = '';
    }
    if (processed.cleaningRule === null || processed.cleaningRule === undefined) {
      processed.cleaningRule = '';
    }

    return processed;
  }



  /**
   * 创建字段配置
   */
  public async create(data: Omit<FieldConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<FieldConfig>> {
    try {
      // 先验证原始数据
      const validation = this.validate(data as Partial<FieldConfig>);
      if (!validation.success) {
        return validation as DatabaseResult<FieldConfig>;
      }

      // 验证通过后再预处理数据
      const processedData = this.preprocessFieldData(data);

      const db = this.dbManager.getDatabase();
      const sql = `
        INSERT INTO fieldConfigs (
          fieldName, fieldAlias, fieldType, dataType, fieldCategory,
          isVisible, displayOrder, isRequired, defaultValue, validationRule, cleaningRule
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const stmt = db.prepare(sql);
      const result = stmt.run(
        processedData.fieldName,
        processedData.fieldAlias || '',
        processedData.fieldType,
        processedData.dataType || 'TEXT',
        processedData.fieldCategory,
        processedData.isVisible,
        processedData.displayOrder || 0,
        processedData.isRequired,
        processedData.defaultValue || '',
        processedData.validationRule || '',
        processedData.cleaningRule || ''
      );

      if (result.changes === 0) {
        return {
          success: false,
          error: '字段创建失败'
        };
      }

      // 获取创建的字段
      const createdField = await this.findById(Number(result.lastInsertRowid));

      return createdField;

    } catch (error) {
      console.error('创建字段配置失败:', error);
      return {
        success: false,
        error: `创建字段配置失败: ${error}`
      };
    }
  }

  /**
   * 更新字段配置
   */
  public async update(id: number, data: Partial<Omit<FieldConfig, 'id' | 'createdAt'>>): Promise<DatabaseResult<FieldConfig>> {
    try {
      // 检查字段是否存在
      const existingField = await this.findById(id);
      if (!existingField.success || !existingField.data) {
        return {
          success: false,
          error: `未找到ID为 ${id} 的字段配置`
        };
      }

      // 先验证原始数据
      const validation = this.validate(data as Partial<FieldConfig>, true);
      if (!validation.success) {
        return validation as DatabaseResult<FieldConfig>;
      }

      // 验证通过后再预处理数据
      const processedData = this.preprocessFieldData(data);

      const db = this.dbManager.getDatabase();
      const fields = Object.keys(processedData);
      const values = Object.values(processedData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const sql = `
        UPDATE fieldConfigs
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const stmt = db.prepare(sql);
      const result = stmt.run(...values, id);

      if (result.changes === 0) {
        return {
          success: false,
          error: '字段配置更新失败，没有行被更新'
        };
      }

      // 获取更新后的字段
      const updatedField = await this.findById(id);

      return updatedField;

    } catch (error) {
      console.error('更新字段配置失败:', error);
      return {
        success: false,
        error: `更新字段配置失败: ${error}`
      };
    }
  }

  /**
   * 根据字段分类获取字段列表
   */
  public async findByCategory(category: 'contract' | 'procurement'): Promise<DatabaseResult<FieldConfig[]>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE fieldCategory = ?
        ORDER BY displayOrder ASC, createdAt ASC
      `;
      const stmt = db.prepare(sql);
      const rows = stmt.all(category);

      return {
        success: true,
        data: rows as FieldConfig[]
      };
    } catch (error) {
      console.error('根据分类查询字段失败:', error);
      return {
        success: false,
        error: `根据分类查询字段失败: ${error}`
      };
    }
  }

  /**
   * 根据字段名称查找字段
   */
  public async findByName(fieldName: string, category?: 'contract' | 'procurement'): Promise<DatabaseResult<FieldConfig | null>> {
    try {
      const db = this.dbManager.getDatabase();
      let sql = `SELECT * FROM ${this.tableName} WHERE fieldName = ?`;
      const params: any[] = [fieldName];

      if (category) {
        sql += ' AND fieldCategory = ?';
        params.push(category);
      }

      const stmt = db.prepare(sql);
      const row = stmt.get(...params);

      return {
        success: true,
        data: row as FieldConfig || null
      };
    } catch (error) {
      console.error('根据名称查询字段失败:', error);
      return {
        success: false,
        error: `根据名称查询字段失败: ${error}`
      };
    }
  }

  /**
   * 批量创建字段配置
   */
  public async batchCreate(fields: Omit<FieldConfig, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<DatabaseResult<FieldConfig[]>> {
    try {
      const db = this.dbManager.getDatabase();
      const createdFields: FieldConfig[] = [];

      // 开始事务
      const transaction = db.transaction(() => {
        for (const fieldData of fields) {
          // 验证原始数据
          const validation = this.validate(fieldData as Partial<FieldConfig>);
          if (!validation.success) {
            throw new Error(validation.error);
          }

          // 预处理数据
          const processedData = this.preprocessFieldData(fieldData);

          const sql = `
            INSERT INTO ${this.tableName} (
              fieldName, fieldAlias, fieldType, dataType, fieldCategory,
              isVisible, displayOrder, isRequired, defaultValue, validationRule, cleaningRule
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const stmt = db.prepare(sql);
          const result = stmt.run(
            processedData.fieldName,
            processedData.fieldAlias || '',
            processedData.fieldType,
            processedData.dataType || 'TEXT',
            processedData.fieldCategory,
            processedData.isVisible,
            processedData.displayOrder || 0,
            processedData.isRequired,
            processedData.defaultValue || '',
            processedData.validationRule || '',
            processedData.cleaningRule || ''
          );

          // 获取插入的记录
          const insertedField = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(result.lastInsertRowid);
          createdFields.push(insertedField as FieldConfig);
        }
      });

      transaction();

      return {
        success: true,
        data: createdFields
      };
    } catch (error) {
      console.error('批量创建字段失败:', error);
      return {
        success: false,
        error: `批量创建字段失败: ${error}`
      };
    }
  }

  /**
   * 更新字段显示顺序
   */
  public async updateDisplayOrder(fieldId: number, newOrder: number): Promise<DatabaseResult<boolean>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = `UPDATE ${this.tableName} SET displayOrder = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      const stmt = db.prepare(sql);
      const result = stmt.run(newOrder, fieldId);

      if (result.changes === 0) {
        return {
          success: false,
          error: '字段不存在或更新失败'
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('更新字段显示顺序失败:', error);
      return {
        success: false,
        error: `更新字段显示顺序失败: ${error}`
      };
    }
  }

  /**
   * 删除字段配置
   */
  public async delete(id: number): Promise<DatabaseResult<boolean>> {
    try {
      // 检查字段是否存在
      const existingField = await this.findById(id);
      if (!existingField.success || !existingField.data) {
        return {
          success: false,
          error: `未找到ID为 ${id} 的字段配置`
        };
      }

      const db = this.dbManager.getDatabase();
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const stmt = db.prepare(sql);
      const result = stmt.run(id);

      if (result.changes === 0) {
        return {
          success: false,
          error: '字段配置删除失败'
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('删除字段配置失败:', error);
      return {
        success: false,
        error: `删除字段配置失败: ${error}`
      };
    }
  }

  /**
   * 获取字段统计信息
   */
  public async getStats(): Promise<DatabaseResult<{
    total: number;
    contractFields: number;
    procurementFields: number;
    visibleFields: number;
    requiredFields: number;
  }>> {
    try {
      const db = this.dbManager.getDatabase();

      const totalResult = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as { count: number };
      const contractResult = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE fieldCategory = 'contract'`).get() as { count: number };
      const procurementResult = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE fieldCategory = 'procurement'`).get() as { count: number };
      const visibleResult = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE isVisible = 1`).get() as { count: number };
      const requiredResult = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE isRequired = 1`).get() as { count: number };

      return {
        success: true,
        data: {
          total: totalResult.count,
          contractFields: contractResult.count,
          procurementFields: procurementResult.count,
          visibleFields: visibleResult.count,
          requiredFields: requiredResult.count
        }
      };
    } catch (error) {
      console.error('获取字段统计信息失败:', error);
      return {
        success: false,
        error: `获取字段统计信息失败: ${error}`
      };
    }
  }
}
