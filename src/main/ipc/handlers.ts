import { ipcMain, BrowserWindow, app } from 'electron'
import { IPC_CHANNELS } from '@shared/constants/ipcChannels'
import type { IApiResponse, IPaginationParams } from '@shared/types/common'

/**
 * 设置所有IPC处理器
 */
export function initializeHandlers(): void {
  setupSystemHandlers()
  setupProjectHandlers()
  setupContractHandlers()
  setupImportHandlers()
  setupFieldHandlers()
  setupFileHandlers()
}

/**
 * 系统相关处理器
 */
function setupSystemHandlers(): void {
  // 获取应用版本
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_VERSION, (): string => {
    return app.getVersion()
  })

  // 最小化窗口
  ipcMain.on(IPC_CHANNELS.SYSTEM_MINIMIZE, (): void => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.minimize()
    }
  })

  // 最大化/还原窗口
  ipcMain.on(IPC_CHANNELS.SYSTEM_MAXIMIZE, (): void => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })

  // 关闭窗口
  ipcMain.on(IPC_CHANNELS.SYSTEM_CLOSE, (): void => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.close()
    }
  })
}

/**
 * 项目管理处理器
 * 注意：项目的CRUD操作已在databaseHandlers.ts中实现，这里只保留必要的适配器
 */
function setupProjectHandlers(): void {
  // 项目管理的具体CRUD操作已在databaseHandlers.ts中实现
  // 这里可以添加其他非数据库相关的项目处理逻辑
  console.log('项目管理处理器设置完成（CRUD操作在databaseHandlers中）')
}

/**
 * 合同管理处理器
 */
function setupContractHandlers(): void {
  // 获取合同列表
  ipcMain.handle(
    IPC_CHANNELS.CONTRACT_GET_LIST,
    async (event, params: IPaginationParams): Promise<IApiResponse> => {
      try {
        // TODO: 实现合同列表获取逻辑
        console.log('Getting contract list with params:', params)

        return {
          success: true,
          data: {
            items: [],
            total: 0,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: 0
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )

  // 获取合同详情
  ipcMain.handle(
    IPC_CHANNELS.CONTRACT_GET_DETAIL,
    async (event, id: number): Promise<IApiResponse> => {
      try {
        // TODO: 实现合同详情获取逻辑
        console.log('Getting contract detail for id:', id)

        return {
          success: true,
          data: null
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )

  // 更新合同项目关联
  ipcMain.handle(
    IPC_CHANNELS.CONTRACT_UPDATE_PROJECT,
    async (event, contractId: number, projectId: number): Promise<IApiResponse> => {
      try {
        // TODO: 实现合同项目关联更新逻辑
        console.log('Updating contract project:', { contractId, projectId })

        return {
          success: true
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )
}



/**
 * 数据导入处理器
 */
function setupImportHandlers(): void {
  // 延迟加载ImportService以避免循环依赖
  let importService: any = null
  let initializationPromise: Promise<any> | null = null

  const getImportService = async (): Promise<any> => {
    if (!importService && !initializationPromise) {
      initializationPromise = (async () => {
        try {
          console.log('开始初始化ImportService...');

          // 动态导入数据库管理器
          const { DatabaseManager } = await import('../database/DatabaseManager');
          const dbManager = DatabaseManager.getInstance();

          // 检查数据库连接状态
          if (!dbManager.isConnected()) {
            console.error('数据库管理器未连接，尝试初始化...');
            const initResult = await dbManager.initialize();
            if (!initResult.success) {
              throw new Error(`数据库初始化失败: ${initResult.error}`);
            }
          }

          // 验证数据库状态
          if (!dbManager.isConnected()) {
            throw new Error('数据库连接失败');
          }

          console.log('数据库连接验证成功');

          // 动态导入ImportService
          const { ImportService } = await import('../services/ImportService');
          const service = new ImportService(dbManager);

          // 等待服务初始化完成
          let retryCount = 0;
          const maxRetries = 10;
          while (!service.isServiceInitialized() && retryCount < maxRetries) {
            console.log(`等待ImportService依赖服务初始化... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200));
            retryCount++;
          }

          if (!service.isServiceInitialized()) {
            throw new Error('ImportService依赖服务初始化超时');
          }

          importService = service;
          console.log('ImportService初始化成功');
          return importService;
        } catch (error) {
          console.error('ImportService初始化失败:', error);
          console.error('错误详情:', error.stack);
          initializationPromise = null; // 重置以允许重试
          throw error;
        }
      })();
    }

    if (initializationPromise) {
      await initializationPromise;
    }

    return importService;
  };

  // 选择文件
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_SELECT_FILES,
    async (): Promise<IApiResponse> => {
      try {
        console.log('选择导入文件');

        // 简化版本：直接使用Electron的dialog
        const { dialog } = require('electron');

        const result = await dialog.showOpenDialog({
          title: '选择Excel文件',
          filters: [
            { name: 'Excel文件', extensions: ['xlsx', 'xls'] },
            { name: '所有文件', extensions: ['*'] }
          ],
          properties: ['openFile', 'multiSelections']
        });

        if (result.canceled || !result.filePaths.length) {
          return {
            success: false,
            error: '未选择文件'
          };
        }

        return {
          success: true,
          data: result.filePaths,
          message: `成功选择 ${result.filePaths.length} 个文件`
        };
      } catch (error) {
        console.error('选择文件失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // 开始导入
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_START,
    async (event, filePaths: string[], settings?: any): Promise<IApiResponse> => {
      try {
        console.log('开始导入文件:', filePaths);

        const service = await getImportService();
        if (!service) {
          return {
            success: false,
            error: 'ImportService未能正确初始化'
          };
        }

        return await service.startImport(filePaths, settings);
      } catch (error) {
        console.error('开始导入失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // 获取导入进度
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_GET_PROGRESS,
    async (event, importId: string): Promise<IApiResponse> => {
      try {
        console.log('获取导入进度:', importId);

        const service = await getImportService();
        if (!service) {
          return {
            success: false,
            error: 'ImportService未能正确初始化'
          };
        }

        const progress = service.getImportProgress(importId);
        if (progress) {
          return {
            success: true,
            data: progress
          };
        } else {
          return {
            success: false,
            error: '导入进度不存在'
          };
        }
      } catch (error) {
        console.error('获取导入进度失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // 解析Excel文件（用于预览）
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_PARSE_FILE,
    async (event, filePath: string): Promise<IApiResponse> => {
      try {
        console.log('解析Excel文件:', filePath);

        const service = await getImportService();
        if (!service) {
          return {
            success: false,
            error: 'ImportService未能正确初始化'
          };
        }

        return await service.parseExcelFile(filePath);
      } catch (error) {
        console.error('解析文件失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // 清理导入进度
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_CLEAR_PROGRESS,
    async (event, importId: string): Promise<IApiResponse> => {
      try {
        console.log('清理导入进度:', importId);

        const service = await getImportService();
        if (!service) {
          return {
            success: false,
            error: 'ImportService未能正确初始化'
          };
        }

        service.clearImportProgress(importId);
        return {
          success: true,
          data: null
        };
      } catch (error) {
        console.error('清理导入进度失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // 获取所有导入进度
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_GET_ALL_PROGRESS,
    async (): Promise<IApiResponse> => {
      try {
        console.log('获取所有导入进度');

        const service = await getImportService();
        if (!service) {
          return {
            success: false,
            error: 'ImportService未能正确初始化'
          };
        }

        const allProgress = service.getAllImportProgress();
        return {
          success: true,
          data: allProgress
        };
      } catch (error) {
        console.error('获取所有导入进度失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // 按文件路径清理导入进度
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_CLEAR_PROGRESS_BY_FILE,
    async (event, filePath: string): Promise<IApiResponse> => {
      try {
        console.log('按文件路径清理导入进度:', filePath);

        const service = await getImportService();
        if (!service) {
          return {
            success: false,
            error: 'ImportService未能正确初始化'
          };
        }

        service.clearImportProgressByFile(filePath);
        return {
          success: true,
          data: null
        };
      } catch (error) {
        console.error('按文件路径清理导入进度失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // 注意：contract:findAll 处理器已在 databaseHandlers.ts 中实现，这里不重复注册

  // 注意：contract:deleteByFilePath 和 procurement:deleteByFilePath 处理器已在 databaseHandlers.ts 中实现，这里不重复注册
}

/**
 * 字段管理处理器
 * 注意：字段管理的CRUD操作已在databaseHandlers.ts中实现，这里只保留文件操作相关的处理器
 */
function setupFieldHandlers(): void {
  // 获取字段配置（映射到数据库处理器）
  ipcMain.handle(
    IPC_CHANNELS.FIELD_GET_CONFIG,
    async (event): Promise<IApiResponse> => {
      try {
        console.log('获取字段配置请求');

        // 动态导入数据库管理器和字段服务
        const { DatabaseManager } = await import('../database/DatabaseManager');
        const { FieldService } = await import('../services/FieldService');

        const dbManager = DatabaseManager.getInstance();
        const fieldService = new FieldService(dbManager);

        const result = await fieldService.findAll();
        console.log('字段配置获取结果:', result.success ? `成功，数量: ${result.data?.length}` : `失败: ${result.error}`);

        return result;
      } catch (error) {
        console.error('获取字段配置失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '获取字段配置失败'
        };
      }
    }
  );

  // 更新字段配置（映射到数据库处理器）
  ipcMain.handle(
    IPC_CHANNELS.FIELD_UPDATE_CONFIG,
    async (event, config: any[]): Promise<IApiResponse> => {
      try {
        console.log('更新字段配置请求，配置数量:', config.length);

        // 动态导入数据库管理器和字段服务
        const { DatabaseManager } = await import('../database/DatabaseManager');
        const { FieldService } = await import('../services/FieldService');

        const dbManager = DatabaseManager.getInstance();
        const fieldService = new FieldService(dbManager);

        // 批量更新字段配置
        const result = await fieldService.batchCreate(config);
        console.log('字段配置更新结果:', result.success ? '成功' : `失败: ${result.error}`);

        return result;
      } catch (error) {
        console.error('更新字段配置失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '更新字段配置失败'
        };
      }
    }
  );

  // 同步字段列（暂时返回成功）
  ipcMain.handle(
    IPC_CHANNELS.FIELD_SYNC_COLUMNS,
    async (event): Promise<IApiResponse> => {
      try {
        console.log('同步字段列请求');

        return {
          success: true,
          data: '字段列同步完成'
        };
      } catch (error) {
        console.error('同步字段列失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '同步字段列失败'
        };
      }
    }
  );

  // 字段JSON导入
  ipcMain.handle(
    IPC_CHANNELS.FIELD_IMPORT_JSON,
    async (event, filePath: string): Promise<IApiResponse> => {
      try {
        const fs = await import('fs/promises')
        const { FileOperationsUtil } = await import('@shared/utils/fileOperations.util')

        // 读取文件
        const fileContent = await fs.readFile(filePath, 'utf-8')
        const jsonData = JSON.parse(fileContent)

        // 验证数据格式
        const validation = FileOperationsUtil.validateJsonData(jsonData, ['字段名称', '字段类型'])
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error
          }
        }

        console.log('Field JSON import successful:', filePath)
        return {
          success: true,
          data: jsonData
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'JSON导入失败'
        }
      }
    }
  )

  // 字段JSON导出
  ipcMain.handle(
    IPC_CHANNELS.FIELD_EXPORT_JSON,
    async (event, data: any[], type: string): Promise<IApiResponse> => {
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        const { app } = await import('electron')
        const { FileOperationsUtil } = await import('@shared/utils/fileOperations.util')

        // 格式化导出数据
        const exportData = FileOperationsUtil.formatExportData(data, 'field')

        // 生成文件路径
        const userDataPath = app.getPath('userData')
        const exportDir = path.join(userDataPath, FileOperationsUtil.getExportDirectory('field'))
        const fileName = FileOperationsUtil.generateFileName('field', FileOperationsUtil.getFilePrefix('field'))
        const filePath = path.join(exportDir, fileName)

        // 确保目录存在
        await fs.mkdir(exportDir, { recursive: true })

        // 写入文件
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8')

        console.log('Field JSON export successful:', filePath)
        return {
          success: true,
          data: filePath
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'JSON导出失败'
        }
      }
    }
  )
}

/**
 * 文件操作处理器
 */
function setupFileHandlers(): void {
  // 通用JSON导出
  ipcMain.handle(
    IPC_CHANNELS.FILE_EXPORT_JSON,
    async (event, data: any[], type: string, fileName?: string): Promise<IApiResponse> => {
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        const { dialog } = await import('electron')
        const { FileOperationsUtil } = await import('@shared/utils/fileOperations.util')

        if (!data || data.length === 0) {
          return {
            success: false,
            error: '没有可导出的数据'
          }
        }

        // 格式化导出数据
        const exportData = FileOperationsUtil.formatExportData(data, type)

        // 生成默认文件名
        const defaultFileName = fileName || FileOperationsUtil.generateFileName(type, FileOperationsUtil.getFilePrefix(type))

        // 显示文件保存对话框
        const result = await dialog.showSaveDialog({
          title: `导出${type === 'field' ? '字段' : type === 'project' ? '项目' : type === 'contract' ? '合同' : '采购'}数据`,
          defaultPath: path.join(process.cwd(), defaultFileName),
          filters: [
            { name: 'JSON文件', extensions: ['json'] },
            { name: '所有文件', extensions: ['*'] }
          ]
        })

        if (result.canceled) {
          return {
            success: false,
            error: '用户取消导出'
          }
        }

        const filePath = result.filePath!

        // 确保目录存在
        await fs.mkdir(path.dirname(filePath), { recursive: true })

        // 写入文件
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8')

        console.log(`${type} JSON export successful:`, filePath)
        return {
          success: true,
          data: filePath
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'JSON导出失败'
        }
      }
    }
  )

  // 通用JSON导入
  ipcMain.handle(
    IPC_CHANNELS.FILE_IMPORT_JSON,
    async (event, filePath: string): Promise<IApiResponse> => {
      try {
        const fs = await import('fs/promises')
        const { FileOperationsUtil } = await import('@shared/utils/fileOperations.util')

        // 检查文件是否存在
        await fs.access(filePath)

        // 获取文件信息
        const stats = await fs.stat(filePath)

        // 验证文件格式
        const validation = FileOperationsUtil.validateImportFile(filePath, stats.size)
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error
          }
        }

        // 读取文件
        const fileContent = await fs.readFile(filePath, 'utf-8')
        const jsonData = JSON.parse(fileContent)

        // 验证JSON数据
        const dataValidation = FileOperationsUtil.validateJsonData(jsonData)
        if (!dataValidation.valid) {
          return {
            success: false,
            error: dataValidation.error
          }
        }

        console.log('JSON import successful:', filePath)
        return {
          success: true,
          data: jsonData
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'JSON导入失败'
        }
      }
    }
  )

  // 选择导入文件
  ipcMain.handle(
    IPC_CHANNELS.FILE_SELECT_IMPORT,
    async (): Promise<IApiResponse> => {
      try {
        const { dialog } = await import('electron')

        const result = await dialog.showOpenDialog({
          title: '选择要导入的JSON文件',
          filters: [
            { name: 'JSON文件', extensions: ['json'] },
            { name: '所有文件', extensions: ['*'] }
          ],
          properties: ['openFile', 'multiSelections']
        })

        if (result.canceled) {
          return {
            success: false,
            error: '用户取消选择'
          }
        }

        return {
          success: true,
          data: result.filePaths
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '文件选择失败'
        }
      }
    }
  )

  // 选择导出目录
  ipcMain.handle(
    IPC_CHANNELS.FILE_SELECT_EXPORT_DIR,
    async (): Promise<IApiResponse> => {
      try {
        const { dialog } = await import('electron')

        const result = await dialog.showOpenDialog({
          title: '选择导出目录',
          properties: ['openDirectory']
        })

        if (result.canceled) {
          return {
            success: false,
            error: '用户取消选择'
          }
        }

        return {
          success: true,
          data: result.filePaths[0]
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '目录选择失败'
        }
      }
    }
  )
}

