/**
 * 基础服务类
 * 提供通用的CRUD操作和数据验证功能
 */

import { DatabaseManager } from '../database/DatabaseManager';
import type {
  DatabaseResult,
  QueryOptions,
  PaginatedResult,
  BaseEntity,
  ValidationRule,
  FieldValidation
} from '@shared/types/database';

export abstract class BaseService<T extends BaseEntity> {
  protected dbManager: DatabaseManager;
  protected tableName: string;
  protected validationRules: FieldValidation = {};

  constructor(tableName: string, dbManager?: DatabaseManager) {
    // 支持传入数据库管理器实例，用于依赖注入
    this.dbManager = dbManager || DatabaseManager.getInstance();
    this.tableName = tableName;
    this.initializeValidationRules();
  }

  /**
   * 初始化验证规则（子类实现）
   */
  protected abstract initializeValidationRules(): void;

  /**
   * 数据验证
   */
  protected validate(data: Partial<T>, isUpdate = false): DatabaseResult<boolean> {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(this.validationRules)) {
      const value = (data as any)[field];
      const error = this.validateField(field, value, rule, isUpdate);
      if (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `数据验证失败: ${errors.join(', ')}`,
      };
    }

    return { success: true, data: true };
  }

  /**
   * 单字段验证
   */
  private validateField(
    field: string,
    value: any,
    rule: ValidationRule,
    isUpdate: boolean
  ): string | null {
    // 必填验证
    if (rule.required && !isUpdate && (value === undefined || value === null || value === '')) {
      return `${field} 是必填字段`;
    }

    // 如果值为空且非必填，跳过其他验证
    if (value === undefined || value === null || value === '') {
      return null;
    }

    // 类型验证
    if (rule.type) {
      const typeError = this.validateType(field, value, rule.type);
      if (typeError) return typeError;
    }

    // 长度验证
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${field} 长度不能少于 ${rule.minLength} 个字符`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${field} 长度不能超过 ${rule.maxLength} 个字符`;
      }
    }

    // 数值范围验证
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${field} 不能小于 ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${field} 不能大于 ${rule.max}`;
      }
    }

    // 正则表达式验证
    if (rule.pattern && typeof value === 'string') {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        return `${field} 格式不正确`;
      }
    }

    // 自定义验证
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        return customResult;
      }
      if (customResult === false) {
        return `${field} 验证失败`;
      }
    }

    return null;
  }

  /**
   * 类型验证
   */
  private validateType(field: string, value: any, type: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} 必须是字符串类型`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} 必须是数字类型`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field} 必须是布尔类型`;
        }
        break;
      case 'date':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          return `${field} 必须是有效的日期`;
        }
        break;
      case 'email':
        if (typeof value === 'string' && !this.isValidEmail(value)) {
          return `${field} 必须是有效的邮箱地址`;
        }
        break;
      case 'url':
        if (typeof value === 'string' && !this.isValidUrl(value)) {
          return `${field} 必须是有效的URL`;
        }
        break;
    }
    return null;
  }

  /**
   * 验证日期字符串
   */
  private isValidDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 创建记录
   */
  public async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<T>> {
    // 验证数据
    const validation = this.validate(data as Partial<T>);
    if (!validation.success) {
      return validation as DatabaseResult<T>;
    }

    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(', ');

      const sql = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      const result = await this.dbManager.executeUpdate(sql, values);

      if (!result.success) {
        return result as DatabaseResult<T>;
      }

      // 获取插入的记录
      const insertedRecord = await this.findById(result.insertId!);
      return insertedRecord;

    } catch (error) {
      return {
        success: false,
        error: `创建记录失败: ${error}`,
      };
    }
  }

  /**
   * 根据ID查找记录
   */
  public async findById(id: number): Promise<DatabaseResult<T | null>> {
    try {
      const result = await this.dbManager.executeQuery(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (!result.success) {
        return result as DatabaseResult<T | null>;
      }

      const record = result.data && result.data.length > 0 ? result.data[0] as T : null;

      return {
        success: true,
        data: record,
      };
    } catch (error) {
      return {
        success: false,
        error: `查找记录失败: ${error}`,
      };
    }
  }

  /**
   * 查找所有记录
   */
  public async findAll(options: QueryOptions = {}): Promise<DatabaseResult<T[]>> {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];

      // 构建WHERE条件
      if (options.where) {
        const whereConditions = Object.entries(options.where)
          .map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
          });

        if (whereConditions.length > 0) {
          sql += ` WHERE ${whereConditions.join(' AND ')}`;
        }
      }

      // 构建ORDER BY
      if (options.orderBy) {
        const direction = options.orderDirection || 'ASC';
        sql += ` ORDER BY ${options.orderBy} ${direction}`;
      }

      // 构建LIMIT和OFFSET
      if (options.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);

        if (options.offset) {
          sql += ` OFFSET ?`;
          params.push(options.offset);
        }
      }

      const result = await this.dbManager.executeQuery(sql, params);

      if (!result.success) {
        return result as DatabaseResult<T[]>;
      }

      return {
        success: true,
        data: result.data as T[],
      };
    } catch (error) {
      return {
        success: false,
        error: `查询记录失败: ${error}`,
      };
    }
  }

  /**
   * 分页查询
   */
  public async findPaginated(
    page: number = 1,
    pageSize: number = 20,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<DatabaseResult<PaginatedResult<T>>> {
    try {
      // 计算总数
      let countSql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      const countParams: any[] = [];

      if (options.where) {
        const whereConditions = Object.entries(options.where)
          .map(([key, value]) => {
            countParams.push(value);
            return `${key} = ?`;
          });

        if (whereConditions.length > 0) {
          countSql += ` WHERE ${whereConditions.join(' AND ')}`;
        }
      }

      const countResult = await this.dbManager.executeQuery(countSql, countParams);
      if (!countResult.success) {
        return countResult as DatabaseResult<PaginatedResult<T>>;
      }

      const total = countResult.data[0].total;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;

      // 查询数据
      const dataResult = await this.findAll({
        ...options,
        limit: pageSize,
        offset,
      });

      if (!dataResult.success) {
        return dataResult as DatabaseResult<PaginatedResult<T>>;
      }

      return {
        success: true,
        data: {
          data: dataResult.data!,
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `分页查询失败: ${error}`,
      };
    }
  }

  /**
   * 更新记录
   */
  public async update(id: number, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<DatabaseResult<T>> {
    // 验证数据
    const validation = this.validate(data as Partial<T>, true);
    if (!validation.success) {
      return validation as DatabaseResult<T>;
    }

    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const sql = `
        UPDATE ${this.tableName}
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const result = await this.dbManager.executeUpdate(sql, [...values, id]);

      if (!result.success) {
        return result as DatabaseResult<T>;
      }

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: '记录不存在或未发生更改',
        };
      }

      // 获取更新后的记录
      const updatedRecord = await this.findById(id);
      return updatedRecord;

    } catch (error) {
      return {
        success: false,
        error: `更新记录失败: ${error}`,
      };
    }
  }

  /**
   * 删除记录
   */
  public async delete(id: number): Promise<DatabaseResult<boolean>> {
    try {
      const result = await this.dbManager.executeUpdate(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (!result.success) {
        return result as DatabaseResult<boolean>;
      }

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: '记录不存在',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `删除记录失败: ${error}`,
      };
    }
  }

  /**
   * 统计记录数量
   */
  public async count(where?: Record<string, any>): Promise<DatabaseResult<number>> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params: any[] = [];

      if (where) {
        const whereConditions = Object.entries(where)
          .map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
          });

        if (whereConditions.length > 0) {
          sql += ` WHERE ${whereConditions.join(' AND ')}`;
        }
      }

      const result = await this.dbManager.executeQuery(sql, params);

      if (!result.success) {
        return result as DatabaseResult<number>;
      }

      return {
        success: true,
        data: result.data[0].count,
      };
    } catch (error) {
      return {
        success: false,
        error: `统计记录失败: ${error}`,
      };
    }
  }
}
