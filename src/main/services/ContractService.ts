/**
 * 合同管理服务类
 * 负责合同数据的CRUD操作和业务逻辑
 */

import { BaseService } from './BaseService';
import type { DatabaseResult } from '@shared/types/database';
import type { DatabaseManager } from '../database/DatabaseManager';

export interface Contract {
  id?: number;
  projectId?: number;
  contractSequence?: string;
  contractNumber?: string;
  contractName?: string;
  contractHandler?: string;
  partyA?: string;
  partyB?: string;
  partyBContact?: string;
  contractContact?: string;
  contractAmount?: number;
  signDate?: string;
  contractPeriod?: string;
  guaranteeReturnDate?: string;
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

export class ContractService extends BaseService<Contract> {
  constructor(dbManager: DatabaseManager) {
    super('contracts', dbManager);
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
      contractNumber: {
        type: 'string',
        maxLength: 100
      },
      contractName: {
        type: 'string',
        maxLength: 500
      },
      contractAmount: {
        type: 'number',
        min: 0
      },
      status: {
        type: 'string'
      }
    };
  }

  /**
   * 查找所有合同数据
   */
  public async findAll(): Promise<DatabaseResult<Contract[]>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM contracts ORDER BY createdAt DESC';
      const stmt = db.prepare(sql);
      const contracts = stmt.all() as Contract[];

      return {
        success: true,
        data: contracts
      };
    } catch (error) {
      console.error('查询合同数据失败:', error);
      return {
        success: false,
        error: `查询合同数据失败: ${error}`
      };
    }
  }

  /**
   * 按文件路径删除合同数据
   */
  public async deleteByFilePath(filePath: string): Promise<DatabaseResult<number>> {
    try {
      console.log(`开始删除文件路径为 ${filePath} 的合同数据`);
      
      const db = this.dbManager.getDatabase();
      const sql = 'DELETE FROM contracts WHERE filePath = ?';
      const stmt = db.prepare(sql);
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
        error: `删除合同数据失败: ${error}`
      };
    }
  }

  /**
   * 按项目ID查找合同
   */
  public async findByProjectId(projectId: number): Promise<DatabaseResult<Contract[]>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM contracts WHERE projectId = ? ORDER BY createdAt DESC';
      const stmt = db.prepare(sql);
      const contracts = stmt.all(projectId) as Contract[];

      return {
        success: true,
        data: contracts
      };
    } catch (error) {
      console.error('按项目ID查询合同数据失败:', error);
      return {
        success: false,
        error: `查询合同数据失败: ${error}`
      };
    }
  }

  /**
   * 按合同编号查找合同
   */
  public async findByContractNumber(contractNumber: string): Promise<DatabaseResult<Contract | null>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM contracts WHERE contractNumber = ? LIMIT 1';
      const stmt = db.prepare(sql);
      const contract = stmt.get(contractNumber) as Contract | undefined;

      return {
        success: true,
        data: contract || null
      };
    } catch (error) {
      console.error('按合同编号查询合同数据失败:', error);
      return {
        success: false,
        error: `查询合同数据失败: ${error}`
      };
    }
  }

  /**
   * 获取合同统计信息
   */
  public async getStats(): Promise<DatabaseResult<{
    total: number;
    byStatus: Record<string, number>;
    byProject: Record<string, number>;
  }>> {
    try {
      const db = this.dbManager.getDatabase();
      
      // 总数统计
      const totalResult = db.prepare('SELECT COUNT(*) as total FROM contracts').get() as { total: number };
      
      // 按状态统计
      const statusStats = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM contracts 
        GROUP BY status
      `).all() as { status: string; count: number }[];
      
      // 按项目统计
      const projectStats = db.prepare(`
        SELECT p.projectName, COUNT(c.id) as count
        FROM contracts c
        LEFT JOIN projects p ON c.projectId = p.id
        GROUP BY c.projectId, p.projectName
      `).all() as { projectName: string; count: number }[];

      const byStatus: Record<string, number> = {};
      statusStats.forEach(stat => {
        byStatus[stat.status || 'unknown'] = stat.count;
      });

      const byProject: Record<string, number> = {};
      projectStats.forEach(stat => {
        byProject[stat.projectName || 'unknown'] = stat.count;
      });

      return {
        success: true,
        data: {
          total: totalResult.total,
          byStatus,
          byProject
        }
      };
    } catch (error) {
      console.error('获取合同统计信息失败:', error);
      return {
        success: false,
        error: `获取统计信息失败: ${error}`
      };
    }
  }
}
