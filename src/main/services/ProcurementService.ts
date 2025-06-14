/**
 * 采购管理服务类
 * 负责采购数据的CRUD操作和业务逻辑
 */

import { BaseService } from './BaseService';
import type { DatabaseResult } from '@shared/types/database';
import type { DatabaseManager } from '../database/DatabaseManager';

export interface Procurement {
  id?: number;
  projectId?: number;
  procurementNumber?: string;
  procurementName?: string;
  procurer?: string;
  planCompleteDate?: string;
  demandApprovalDate?: string;
  procurementHandler?: string;
  demandDepartment?: string;
  demandContact?: string;
  budgetAmount?: number;
  controlPrice?: number;
  winningPrice?: number;
  procurementPlatform?: string;
  procurementMethod?: string;
  evaluationMethod?: string;
  awardMethod?: string;
  bidOpeningDate?: string;
  evaluationCommittee?: string;
  awardCommittee?: string;
  resultPublishDate?: string;
  noticeIssueDate?: string;
  winner?: string;
  winnerContact?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  fileHash?: string;
  sheetName: string;
  extendedFields?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows?: number;
  processedRows?: number;
  errorRows?: number;
  matchScore?: number;
  isVerified?: boolean;
  hasErrors?: boolean;
  errorInfo?: string;
  processingLog?: string;
  cleaningLog?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ProcurementService extends BaseService<Procurement> {
  constructor(dbManager: DatabaseManager) {
    super('procurements', dbManager);
  }

  /**
   * 初始化验证规则
   */
  protected initializeValidationRules(): void {
    this.validationRules = {
      filePath: {
        required: true,
        type: 'string',
        maxLength: 500
      },
      fileName: {
        required: true,
        type: 'string',
        maxLength: 255
      },
      sheetName: {
        required: true,
        type: 'string',
        maxLength: 100
      },
      procurementNumber: {
        type: 'string',
        maxLength: 100
      },
      procurementName: {
        type: 'string',
        maxLength: 500
      },
      budgetAmount: {
        type: 'number',
        min: 0
      },
      controlPrice: {
        type: 'number',
        min: 0
      },
      winningPrice: {
        type: 'number',
        min: 0
      },
      status: {
        type: 'string'
      }
    };
  }

  /**
   * 查找所有采购数据
   */
  public async findAll(): Promise<DatabaseResult<Procurement[]>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM procurements ORDER BY createdAt DESC';
      const stmt = db.prepare(sql);
      const procurements = stmt.all() as Procurement[];

      return {
        success: true,
        data: procurements
      };
    } catch (error) {
      console.error('查询采购数据失败:', error);
      return {
        success: false,
        error: `查询采购数据失败: ${error}`
      };
    }
  }

  /**
   * 按文件路径删除采购数据
   */
  public async deleteByFilePath(filePath: string): Promise<DatabaseResult<number>> {
    try {
      console.log(`开始删除文件路径为 ${filePath} 的采购数据`);
      
      const db = this.dbManager.getDatabase();
      const sql = 'DELETE FROM procurements WHERE filePath = ?';
      const stmt = db.prepare(sql);
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
        error: `删除采购数据失败: ${error}`
      };
    }
  }

  /**
   * 按项目ID查找采购
   */
  public async findByProjectId(projectId: number): Promise<DatabaseResult<Procurement[]>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM procurements WHERE projectId = ? ORDER BY createdAt DESC';
      const stmt = db.prepare(sql);
      const procurements = stmt.all(projectId) as Procurement[];

      return {
        success: true,
        data: procurements
      };
    } catch (error) {
      console.error('按项目ID查询采购数据失败:', error);
      return {
        success: false,
        error: `查询采购数据失败: ${error}`
      };
    }
  }

  /**
   * 按采购编号查找采购
   */
  public async findByProcurementNumber(procurementNumber: string): Promise<DatabaseResult<Procurement | null>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM procurements WHERE procurementNumber = ? LIMIT 1';
      const stmt = db.prepare(sql);
      const procurement = stmt.get(procurementNumber) as Procurement | undefined;

      return {
        success: true,
        data: procurement || null
      };
    } catch (error) {
      console.error('按采购编号查询采购数据失败:', error);
      return {
        success: false,
        error: `查询采购数据失败: ${error}`
      };
    }
  }

  /**
   * 获取采购统计信息
   */
  public async getStats(): Promise<DatabaseResult<{
    total: number;
    byStatus: Record<string, number>;
    byProject: Record<string, number>;
    byMethod: Record<string, number>;
  }>> {
    try {
      const db = this.dbManager.getDatabase();
      
      // 总数统计
      const totalResult = db.prepare('SELECT COUNT(*) as total FROM procurements').get() as { total: number };
      
      // 按状态统计
      const statusStats = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM procurements 
        GROUP BY status
      `).all() as { status: string; count: number }[];
      
      // 按项目统计
      const projectStats = db.prepare(`
        SELECT p.projectName, COUNT(pr.id) as count
        FROM procurements pr
        LEFT JOIN projects p ON pr.projectId = p.id
        GROUP BY pr.projectId, p.projectName
      `).all() as { projectName: string; count: number }[];

      // 按采购方式统计
      const methodStats = db.prepare(`
        SELECT procurementMethod, COUNT(*) as count 
        FROM procurements 
        WHERE procurementMethod IS NOT NULL
        GROUP BY procurementMethod
      `).all() as { procurementMethod: string; count: number }[];

      const byStatus: Record<string, number> = {};
      statusStats.forEach(stat => {
        byStatus[stat.status || 'unknown'] = stat.count;
      });

      const byProject: Record<string, number> = {};
      projectStats.forEach(stat => {
        byProject[stat.projectName || 'unknown'] = stat.count;
      });

      const byMethod: Record<string, number> = {};
      methodStats.forEach(stat => {
        byMethod[stat.procurementMethod || 'unknown'] = stat.count;
      });

      return {
        success: true,
        data: {
          total: totalResult.total,
          byStatus,
          byProject,
          byMethod
        }
      };
    } catch (error) {
      console.error('获取采购统计信息失败:', error);
      return {
        success: false,
        error: `获取统计信息失败: ${error}`
      };
    }
  }
}
