/**
 * 项目管理服务类
 * 负责项目的CRUD操作和业务逻辑
 */

import { DatabaseManager } from '../database/DatabaseManager';
import type { DatabaseResult, PaginatedResult } from '@shared/types/database';

export interface Project {
  id?: number;
  projectCode: string;
  projectName: string;
  projectAlias?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectSearchOptions {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  inactiveProjects: number;
  archivedProjects: number;
  totalContracts: number;
  totalProcurements: number;
}

export class ProjectService {
  private static instance: ProjectService;
  private dbManager: DatabaseManager;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  /**
   * 创建项目
   */
  public async create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<Project>> {
    try {
      console.log('开始创建项目:', projectData);

      // 检查项目编号是否已存在
      const existingProject = await this.findByCode(projectData.projectCode);
      if (existingProject.success && existingProject.data) {
        return {
          success: false,
          error: `项目编号 ${projectData.projectCode} 已存在`
        };
      }

      const db = this.dbManager.getDatabase();
      const sql = `
        INSERT INTO projects (projectCode, projectName, projectAlias, description, status)
        VALUES (?, ?, ?, ?, ?)
      `;

      const stmt = db.prepare(sql);
      const result = stmt.run(
        projectData.projectCode,
        projectData.projectName,
        projectData.projectAlias || null,
        projectData.description || null,
        projectData.status || 'active'
      );

      console.log('项目创建结果:', result);

      if (result.changes === 0) {
        return {
          success: false,
          error: '项目创建失败'
        };
      }

      // 获取创建的项目
      const createdProject = await this.findById(Number(result.lastInsertRowid));
      console.log('创建的项目:', createdProject);

      return createdProject;

    } catch (error) {
      console.error('创建项目失败:', error);
      return {
        success: false,
        error: `创建项目失败: ${error}`
      };
    }
  }

  /**
   * 根据ID查找项目
   */
  public async findById(id: number): Promise<DatabaseResult<Project | null>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM projects WHERE id = ?';
      const stmt = db.prepare(sql);
      const project = stmt.get(id) as Project | undefined;

      return {
        success: true,
        data: project || null
      };
    } catch (error) {
      console.error('查找项目失败:', error);
      return {
        success: false,
        error: `查找项目失败: ${error}`
      };
    }
  }

  /**
   * 根据项目编号查找项目
   */
  public async findByCode(projectCode: string): Promise<DatabaseResult<Project | null>> {
    try {
      const db = this.dbManager.getDatabase();
      const sql = 'SELECT * FROM projects WHERE projectCode = ?';
      const stmt = db.prepare(sql);
      const project = stmt.get(projectCode) as Project | undefined;

      return {
        success: true,
        data: project || null
      };
    } catch (error) {
      console.error('查找项目失败:', error);
      return {
        success: false,
        error: `查找项目失败: ${error}`
      };
    }
  }

  /**
   * 查找所有项目
   */
  public async findAll(options: ProjectSearchOptions = {}): Promise<DatabaseResult<Project[]>> {
    try {
      const db = this.dbManager.getDatabase();
      let sql = 'SELECT * FROM projects';
      const params: any[] = [];

      // 构建WHERE条件
      const conditions: string[] = [];

      if (options.keyword) {
        conditions.push('(projectCode LIKE ? OR projectName LIKE ? OR projectAlias LIKE ?)');
        const keyword = `%${options.keyword}%`;
        params.push(keyword, keyword, keyword);
      }

      if (options.status) {
        conditions.push('status = ?');
        params.push(options.status);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY createdAt DESC';

      const stmt = db.prepare(sql);
      const projects = stmt.all(...params) as Project[];

      return {
        success: true,
        data: projects
      };
    } catch (error) {
      console.error('查询项目列表失败:', error);
      return {
        success: false,
        error: `查询项目列表失败: ${error}`
      };
    }
  }

  /**
   * 分页查询项目
   */
  public async findPaginated(
    page: number = 1,
    pageSize: number = 20,
    options: ProjectSearchOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<Project>>> {
    try {
      // 先获取总数
      const countResult = await this.getCount(options);
      if (!countResult.success) {
        return countResult as DatabaseResult<PaginatedResult<Project>>;
      }

      const total = countResult.data!;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;

      // 获取分页数据
      const db = this.dbManager.getDatabase();
      let sql = 'SELECT * FROM projects';
      const params: any[] = [];

      // 构建WHERE条件
      const conditions: string[] = [];

      if (options.keyword) {
        conditions.push('(projectCode LIKE ? OR projectName LIKE ? OR projectAlias LIKE ?)');
        const keyword = `%${options.keyword}%`;
        params.push(keyword, keyword, keyword);
      }

      if (options.status) {
        conditions.push('status = ?');
        params.push(options.status);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(pageSize, offset);

      const stmt = db.prepare(sql);
      const projects = stmt.all(...params) as Project[];

      return {
        success: true,
        data: {
          data: projects,
          total,
          page,
          pageSize,
          totalPages
        }
      };
    } catch (error) {
      console.error('分页查询项目失败:', error);
      return {
        success: false,
        error: `分页查询项目失败: ${error}`
      };
    }
  }

  /**
   * 获取项目总数
   */
  private async getCount(options: ProjectSearchOptions = {}): Promise<DatabaseResult<number>> {
    try {
      const db = this.dbManager.getDatabase();
      let sql = 'SELECT COUNT(*) as count FROM projects';
      const params: any[] = [];

      // 构建WHERE条件
      const conditions: string[] = [];

      if (options.keyword) {
        conditions.push('(projectCode LIKE ? OR projectName LIKE ? OR projectAlias LIKE ?)');
        const keyword = `%${options.keyword}%`;
        params.push(keyword, keyword, keyword);
      }

      if (options.status) {
        conditions.push('status = ?');
        params.push(options.status);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      const stmt = db.prepare(sql);
      const result = stmt.get(...params) as { count: number };

      return {
        success: true,
        data: result.count
      };
    } catch (error) {
      console.error('获取项目总数失败:', error);
      return {
        success: false,
        error: `获取项目总数失败: ${error}`
      };
    }
  }

  /**
   * 更新项目
   */
  public async update(id: number, updateData: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<DatabaseResult<Project>> {
    try {
      // 检查项目是否存在
      const existingProject = await this.findById(id);
      if (!existingProject.success || !existingProject.data) {
        return {
          success: false,
          error: `未找到ID为 ${id} 的项目`
        };
      }

      // 检查项目编号是否与其他项目冲突
      if (updateData.projectCode) {
        const conflictProject = await this.findByCode(updateData.projectCode);
        if (conflictProject.success && conflictProject.data && conflictProject.data.id !== id) {
          return {
            success: false,
            error: `项目编号 ${updateData.projectCode} 已被其他项目使用`
          };
        }
      }

      const db = this.dbManager.getDatabase();
      const fields = Object.keys(updateData).filter(key => key !== 'id' && key !== 'createdAt');
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => (updateData as any)[field]);

      const sql = `
        UPDATE projects
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const stmt = db.prepare(sql);
      const result = stmt.run(...values, id);

      if (result.changes === 0) {
        return {
          success: false,
          error: '项目更新失败'
        };
      }

      // 获取更新后的项目
      const updatedProject = await this.findById(id);
      return updatedProject;

    } catch (error) {
      console.error('更新项目失败:', error);
      return {
        success: false,
        error: `更新项目失败: ${error}`
      };
    }
  }

  /**
   * 删除项目
   */
  public async delete(id: number): Promise<DatabaseResult<boolean>> {
    try {
      console.log(`开始删除项目，原始ID: ${id}, 类型: ${typeof id}`);

      // 确保ID是数字类型，处理字符串转换
      let projectId: number;
      if (typeof id === 'string') {
        projectId = parseInt(id, 10);
      } else {
        projectId = Number(id);
      }

      if (isNaN(projectId) || projectId <= 0) {
        console.error('项目ID不是有效数字:', id);
        return {
          success: false,
          error: `项目ID不是有效数字: ${id}`
        };
      }

      console.log(`转换后的项目ID: ${projectId}, 类型: ${typeof projectId}`);

      // 检查项目是否存在
      const existingProject = await this.findById(projectId);

      if (!existingProject.success || !existingProject.data) {
        return {
          success: false,
          error: `未找到ID为 ${projectId} 的项目。请检查项目是否存在。`
        };
      }

      const db = this.dbManager.getDatabase();
      const sql = 'DELETE FROM projects WHERE id = ?';
      const stmt = db.prepare(sql);
      const result = stmt.run(projectId);

      if (result.changes === 0) {
        return {
          success: false,
          error: '项目删除失败，没有行被删除'
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('删除项目失败:', error);
      return {
        success: false,
        error: `删除项目失败: ${error}`
      };
    }
  }

  /**
   * 根据项目名称搜索项目
   */
  public async searchByName(keyword: string): Promise<DatabaseResult<Project[]>> {
    return this.findAll({ keyword });
  }

  /**
   * 获取项目统计信息
   */
  public async getStats(): Promise<DatabaseResult<ProjectStats>> {
    try {
      const db = this.dbManager.getDatabase();

      // 获取项目统计
      const projectStatsStmt = db.prepare(`
        SELECT
          COUNT(*) as totalProjects,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeProjects,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactiveProjects,
          SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archivedProjects
        FROM projects
      `);
      const projectStats = projectStatsStmt.get() as any;

      // 获取合同统计（如果表存在）
      let totalContracts = 0;
      try {
        const contractStatsStmt = db.prepare('SELECT COUNT(*) as count FROM contracts');
        const contractStats = contractStatsStmt.get() as any;
        totalContracts = contractStats.count || 0;
      } catch {
        // 合同表可能不存在，忽略错误
      }

      // 获取采购统计（如果表存在）
      let totalProcurements = 0;
      try {
        const procurementStatsStmt = db.prepare('SELECT COUNT(*) as count FROM procurements');
        const procurementStats = procurementStatsStmt.get() as any;
        totalProcurements = procurementStats.count || 0;
      } catch {
        // 采购表可能不存在，忽略错误
      }

      const stats: ProjectStats = {
        totalProjects: projectStats.totalProjects || 0,
        activeProjects: projectStats.activeProjects || 0,
        inactiveProjects: projectStats.inactiveProjects || 0,
        archivedProjects: projectStats.archivedProjects || 0,
        totalContracts,
        totalProcurements
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('获取项目统计失败:', error);
      return {
        success: false,
        error: `获取项目统计失败: ${error}`
      };
    }
  }

  /**
   * 根据项目名称或编号查找项目
   */
  public async findByNameOrCode(projectName?: string, projectCode?: string): Promise<DatabaseResult<Project>> {
    try {
      const db = this.dbManager.getDatabase();

      let sql = 'SELECT * FROM projects WHERE ';
      const params: any[] = [];
      const conditions: string[] = [];

      if (projectName) {
        conditions.push('(projectName = ? OR projectAlias LIKE ?)');
        params.push(projectName, `%${projectName}%`);
      }

      if (projectCode) {
        conditions.push('projectCode = ?');
        params.push(projectCode);
      }

      if (conditions.length === 0) {
        return {
          success: false,
          error: '必须提供项目名称或项目编号'
        };
      }

      sql += conditions.join(' OR ');
      sql += ' LIMIT 1';

      const stmt = db.prepare(sql);
      const project = stmt.get(...params) as Project;

      if (project) {
        return {
          success: true,
          data: project
        };
      } else {
        return {
          success: false,
          error: '未找到匹配的项目'
        };
      }
    } catch (error) {
      console.error('查找项目失败:', error);
      return {
        success: false,
        error: `查找项目失败: ${error}`
      };
    }
  }

  /**
   * 批量导入项目
   */
  public async batchImport(projects: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<DatabaseResult<Project[]>> {
    try {
      const db = this.dbManager.getDatabase();
      const importedProjects: Project[] = [];
      const errors: string[] = [];

      // 使用事务确保数据一致性
      const transaction = db.transaction(() => {
        for (const projectData of projects) {
          try {
            // 检查项目编号是否已存在
            const existingStmt = db.prepare('SELECT id FROM projects WHERE projectCode = ?');
            const existing = existingStmt.get(projectData.projectCode);

            if (existing) {
              errors.push(`项目编号 ${projectData.projectCode} 已存在，跳过导入`);
              continue;
            }

            // 插入项目
            const insertStmt = db.prepare(`
              INSERT INTO projects (projectCode, projectName, projectAlias, description, status)
              VALUES (?, ?, ?, ?, ?)
            `);

            const result = insertStmt.run(
              projectData.projectCode,
              projectData.projectName,
              projectData.projectAlias || null,
              projectData.description || null,
              projectData.status || 'active'
            );

            if (result.changes > 0) {
              // 获取插入的项目
              const selectStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
              const insertedProject = selectStmt.get(result.lastInsertRowid) as Project;
              importedProjects.push(insertedProject);
            }
          } catch (error) {
            errors.push(`导入项目 ${projectData.projectCode} 失败: ${error}`);
          }
        }
      });

      transaction();

      console.log(`批量导入完成: 成功 ${importedProjects.length} 个，失败 ${errors.length} 个`);
      if (errors.length > 0) {
        console.warn('导入错误:', errors);
      }

      return {
        success: true,
        data: importedProjects,
        message: errors.length > 0 ? `部分导入失败: ${errors.join('; ')}` : undefined
      };
    } catch (error) {
      console.error('批量导入项目失败:', error);
      return {
        success: false,
        error: `批量导入项目失败: ${error}`
      };
    }
  }

  /**
   * 根据项目名称匹配项目（用于数据导入时的项目匹配）
   */
  public async matchByName(projectName: string, threshold: number = 0.8): Promise<DatabaseResult<Project[]>> {
    try {
      const db = this.dbManager.getDatabase();

      // 精确匹配
      const exactStmt = db.prepare(`
        SELECT * FROM projects
        WHERE projectName = ? OR projectAlias LIKE ?
      `);
      const exactMatches = exactStmt.all(projectName, `%${projectName}%`) as Project[];

      if (exactMatches.length > 0) {
        return {
          success: true,
          data: exactMatches
        };
      }

      // 模糊匹配
      const fuzzyStmt = db.prepare(`
        SELECT * FROM projects
        WHERE projectName LIKE ? OR projectAlias LIKE ?
        ORDER BY
          CASE
            WHEN projectName LIKE ? THEN 1
            WHEN projectAlias LIKE ? THEN 2
            ELSE 3
          END
        LIMIT 10
      `);

      const keyword = `%${projectName}%`;
      const fuzzyMatches = fuzzyStmt.all(keyword, keyword, keyword, keyword) as Project[];

      return {
        success: true,
        data: fuzzyMatches
      };
    } catch (error) {
      console.error('项目名称匹配失败:', error);
      return {
        success: false,
        error: `项目名称匹配失败: ${error}`
      };
    }
  }
}
