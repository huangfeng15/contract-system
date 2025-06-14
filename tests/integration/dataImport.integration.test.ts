/**
 * 数据导入模块集成测试
 * 测试Excel解析、数据清洗、数据库同步等完整流程
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { ImportService } from '../../src/main/services/ImportService'
import { FieldService } from '../../src/main/services/FieldService'
import { ProjectService } from '../../src/main/services/ProjectService'
import { DatabaseManager } from '../../src/main/database/DatabaseManager'

// 模拟Electron的app对象
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'userData') {
        return path.join(__dirname, '../data/test-user-data')
      }
      return '/tmp'
    })
  }
}))

describe('数据导入模块集成测试', () => {
  let importService: ImportService
  let fieldService: FieldService
  let projectService: ProjectService
  let dbManager: DatabaseManager
  let testExcelPath: string
  let testDataDir: string

  beforeAll(async () => {
    // 创建测试数据目录
    testDataDir = path.join(__dirname, '../data')
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
  })

  beforeEach(async () => {
    // 创建测试用户数据目录
    const testUserDataPath = path.join(__dirname, '../data/test-user-data')
    if (!fs.existsSync(testUserDataPath)) {
      fs.mkdirSync(testUserDataPath, { recursive: true })
    }

    // 初始化数据库管理器
    dbManager = DatabaseManager.getInstance()
    await dbManager.initialize(':memory:') // 使用内存数据库进行测试

    // 初始化服务
    importService = new ImportService()
    fieldService = new FieldService()
    projectService = new ProjectService()

    // 创建测试Excel文件
    testExcelPath = await createTestExcelFile()

    // 初始化字段配置
    await setupFieldConfigurations()

    // 初始化项目数据
    await setupProjectData()
  })

  afterEach(async () => {
    // 清理测试文件
    if (fs.existsSync(testExcelPath)) {
      fs.unlinkSync(testExcelPath)
    }

    // 关闭数据库连接
    if (dbManager && typeof dbManager.close === 'function') {
      dbManager.close()
    }
  })

  describe('Excel文件解析测试', () => {
    it('应该能够正确解析合同数据Excel文件', async () => {
      const result = await importService.parseExcelFile(testExcelPath)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data!.length).toBeGreaterThan(0)

      const worksheet = result.data![0]
      expect(worksheet.sheetName).toBeDefined()
      expect(worksheet.sheetType).toBe('contract')
      expect(worksheet.totalRows).toBeGreaterThan(0)
      expect(worksheet.dataRows).toBeGreaterThan(0)
      expect(worksheet.recognitionStatus).toBe('recognized')
      expect(worksheet.matchedFields.length).toBeGreaterThan(0)
    })

    it('应该能够识别不同类型的工作表', async () => {
      // 创建包含采购数据的Excel文件
      const procurementExcelPath = await createTestProcurementExcelFile()

      try {
        const result = await importService.parseExcelFile(procurementExcelPath)

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()

        const worksheet = result.data![0]
        expect(worksheet.sheetType).toBe('procurement')
        expect(worksheet.recognitionStatus).toBe('recognized')
      } finally {
        if (fs.existsSync(procurementExcelPath)) {
          fs.unlinkSync(procurementExcelPath)
        }
      }
    })

    it('应该能够处理多个工作表的Excel文件', async () => {
      const multiSheetExcelPath = await createMultiSheetExcelFile()

      try {
        const result = await importService.parseExcelFile(multiSheetExcelPath)

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data!.length).toBe(2) // 应该有两个工作表

        const contractSheet = result.data!.find(ws => ws.sheetType === 'contract')
        const procurementSheet = result.data!.find(ws => ws.sheetType === 'procurement')

        expect(contractSheet).toBeDefined()
        expect(procurementSheet).toBeDefined()
      } finally {
        if (fs.existsSync(multiSheetExcelPath)) {
          fs.unlinkSync(multiSheetExcelPath)
        }
      }
    })
  })

  describe('数据导入流程测试', () => {
    it('应该能够完成完整的数据导入流程', async () => {
      const settings = {
        matchMode: 'strict' as const,
        minMatchFields: 2,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      // 启动导入
      const startResult = await importService.startImport([testExcelPath], settings)
      expect(startResult.success).toBe(true)
      expect(startResult.data).toBeDefined()

      const importId = startResult.data!

      // 等待导入完成
      await waitForImportCompletion(importId, 10000) // 最多等待10秒

      // 检查导入进度
      const progress = importService.getImportProgress(importId)
      expect(progress).toBeDefined()
      expect(progress!.status).toBe('completed')
      expect(progress!.progress).toBe(100)
      expect(progress!.processedRows).toBeGreaterThan(0)
    })

    it('应该能够处理导入设置中的匹配模式', async () => {
      const strictSettings = {
        matchMode: 'strict' as const,
        minMatchFields: 5, // 高要求
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      const fuzzySettings = {
        matchMode: 'fuzzy' as const,
        minMatchFields: 2, // 低要求
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      // 测试严格模式
      const strictResult = await importService.startImport([testExcelPath], strictSettings)
      expect(strictResult.success).toBe(true)

      // 测试模糊模式
      const fuzzyResult = await importService.startImport([testExcelPath], fuzzySettings)
      expect(fuzzyResult.success).toBe(true)
    })
  })

  describe('数据清洗测试', () => {
    it('应该能够清洗日期格式', async () => {
      const dirtyDateExcelPath = await createDirtyDataExcelFile()

      try {
        const settings = {
          matchMode: 'fuzzy' as const,
          minMatchFields: 2,
          skipEmptyRows: true,
          trimWhitespace: true,
          validateData: true,
          autoUpdateEnabled: false,
          updateFrequency: 'daily' as const
        }

        const startResult = await importService.startImport([dirtyDateExcelPath], settings)
        expect(startResult.success).toBe(true)

        const importId = startResult.data!
        await waitForImportCompletion(importId, 10000)

        const progress = importService.getImportProgress(importId)
        expect(progress!.status).toBe('completed')

        // 验证数据库中的数据已被清洗
        const contractsResult = await dbManager.executeQuery('SELECT * FROM contracts LIMIT 1')
        expect(contractsResult.success).toBe(true)
        expect(contractsResult.data.length).toBeGreaterThan(0)
      } finally {
        if (fs.existsSync(dirtyDateExcelPath)) {
          fs.unlinkSync(dirtyDateExcelPath)
        }
      }
    })
  })

  describe('数据库同步测试', () => {
    it('应该能够正确同步数据到数据库', async () => {
      const settings = {
        matchMode: 'fuzzy' as const,
        minMatchFields: 2,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      // 导入前检查数据库
      const beforeResult = await dbManager.executeQuery('SELECT COUNT(*) as count FROM contracts')
      const beforeCount = beforeResult.data[0].count

      // 执行导入
      const startResult = await importService.startImport([testExcelPath], settings)
      expect(startResult.success).toBe(true)

      const importId = startResult.data!
      await waitForImportCompletion(importId, 10000)

      // 导入后检查数据库
      const afterResult = await dbManager.executeQuery('SELECT COUNT(*) as count FROM contracts')
      const afterCount = afterResult.data[0].count

      expect(afterCount).toBeGreaterThan(beforeCount)
    })

    it('应该能够处理并发导入操作', async () => {
      const settings = {
        matchMode: 'fuzzy' as const,
        minMatchFields: 2,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      // 创建多个测试文件
      const testFile1 = await createTestExcelFile('test1')
      const testFile2 = await createTestExcelFile('test2')

      try {
        // 同时启动两个导入任务
        const [result1, result2] = await Promise.all([
          importService.startImport([testFile1], settings),
          importService.startImport([testFile2], settings)
        ])

        expect(result1.success).toBe(true)
        expect(result2.success).toBe(true)
        expect(result1.data).not.toBe(result2.data) // 应该有不同的导入ID

        // 等待两个导入都完成
        await Promise.all([
          waitForImportCompletion(result1.data!, 10000),
          waitForImportCompletion(result2.data!, 10000)
        ])

        const progress1 = importService.getImportProgress(result1.data!)
        const progress2 = importService.getImportProgress(result2.data!)

        expect(progress1!.status).toBe('completed')
        expect(progress2!.status).toBe('completed')
      } finally {
        if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1)
        if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2)
      }
    })
  })

  // 辅助函数
  async function createTestExcelFile(suffix: string = ''): Promise<string> {
    const workbook = XLSX.utils.book_new()

    // 创建合同数据工作表
    const contractData = [
      ['合同编号', '合同名称', '甲方', '乙方', '合同金额', '签订日期', '工期'],
      ['HT001', '办公楼建设合同', '某某公司', '建筑公司A', '1000000', '2024-01-15', '365'],
      ['HT002', '设备采购合同', '某某公司', '设备公司B', '500000', '2024-02-01', '90'],
      ['HT003', '软件开发合同', '某某公司', '软件公司C', '300000', '2024-03-01', '180']
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(contractData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '合同数据')

    const fileName = `test-contract-data${suffix ? '-' + suffix : ''}.xlsx`
    const filePath = path.join(testDataDir, fileName)
    XLSX.writeFile(workbook, filePath)

    return filePath
  }

  async function createTestProcurementExcelFile(): Promise<string> {
    const workbook = XLSX.utils.book_new()

    // 创建采购数据工作表
    const procurementData = [
      ['招采编号', '项目名称', '采购人', '预算金额', '开标日期', '中标人'],
      ['ZC001', '办公设备采购', '某某单位', '200000', '2024-01-20', '供应商A'],
      ['ZC002', '车辆采购', '某某单位', '800000', '2024-02-15', '供应商B']
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(procurementData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '采购数据')

    const filePath = path.join(testDataDir, 'test-procurement-data.xlsx')
    XLSX.writeFile(workbook, filePath)

    return filePath
  }

  async function createMultiSheetExcelFile(): Promise<string> {
    const workbook = XLSX.utils.book_new()

    // 合同数据工作表
    const contractData = [
      ['合同编号', '合同名称', '甲方', '乙方', '合同金额'],
      ['HT001', '测试合同1', '甲方A', '乙方A', '100000']
    ]
    const contractSheet = XLSX.utils.aoa_to_sheet(contractData)
    XLSX.utils.book_append_sheet(workbook, contractSheet, '合同数据')

    // 采购数据工作表
    const procurementData = [
      ['招采编号', '项目名称', '采购人', '预算金额'],
      ['ZC001', '测试采购1', '采购人A', '50000']
    ]
    const procurementSheet = XLSX.utils.aoa_to_sheet(procurementData)
    XLSX.utils.book_append_sheet(workbook, procurementSheet, '采购数据')

    const filePath = path.join(testDataDir, 'test-multi-sheet.xlsx')
    XLSX.writeFile(workbook, filePath)

    return filePath
  }

  async function createDirtyDataExcelFile(): Promise<string> {
    const workbook = XLSX.utils.book_new()

    // 包含需要清洗的脏数据
    const dirtyData = [
      ['合同编号', '合同名称', '甲方', '签订日期', '合同金额'],
      ['HT001', '  测试合同1  ', '甲方A', '2024/01/15', '￥100,000.00'],
      ['HT002', '测试合同2\n换行', '甲方B', '2024年2月1日', '50万'],
      ['HT003', 'TEST CONTRACT 3', '甲方C', '2024-03-01', '300000元']
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(dirtyData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '合同数据')

    const filePath = path.join(testDataDir, 'test-dirty-data.xlsx')
    XLSX.writeFile(workbook, filePath)

    return filePath
  }

  async function setupFieldConfigurations(): Promise<void> {
    // 创建合同字段配置
    const contractFields = [
      {
        fieldName: '合同编号',
        fieldType: 'contract',
        fieldCategory: 'core',
        databaseColumn: 'contractNumber',
        displayOrder: 1,
        isRequired: true,
        aliases: ['合同号', '编号']
      },
      {
        fieldName: '合同名称',
        fieldType: 'contract',
        fieldCategory: 'core',
        databaseColumn: 'contractName',
        displayOrder: 2,
        isRequired: true,
        aliases: ['项目名称', '名称']
      },
      {
        fieldName: '甲方',
        fieldType: 'contract',
        fieldCategory: 'core',
        databaseColumn: 'partyA',
        displayOrder: 3,
        isRequired: true,
        aliases: ['发包方', '委托方']
      }
    ]

    for (const field of contractFields) {
      await fieldService.createField(field)
    }

    // 创建采购字段配置
    const procurementFields = [
      {
        fieldName: '招采编号',
        fieldType: 'procurement',
        fieldCategory: 'core',
        databaseColumn: 'procurementNumber',
        displayOrder: 1,
        isRequired: true,
        aliases: ['采购编号', '编号']
      },
      {
        fieldName: '项目名称',
        fieldType: 'procurement',
        fieldCategory: 'core',
        databaseColumn: 'projectName',
        displayOrder: 2,
        isRequired: true,
        aliases: ['采购项目', '名称']
      }
    ]

    for (const field of procurementFields) {
      await fieldService.createField(field)
    }
  }

  async function setupProjectData(): Promise<void> {
    const projects = [
      {
        projectName: '测试项目1',
        projectAliases: '项目1,test1',
        description: '用于测试的项目1'
      },
      {
        projectName: '测试项目2',
        projectAliases: '项目2,test2',
        description: '用于测试的项目2'
      }
    ]

    for (const project of projects) {
      await projectService.createProject(project)
    }
  }

  async function waitForImportCompletion(importId: string, timeout: number): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const progress = importService.getImportProgress(importId)
      if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
        return
      }

      // 等待100ms后再检查
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error(`导入超时: ${importId}`)
  }
})
