/**
 * ImportService修复验证测试
 * 验证ImportService能够正确初始化和处理Excel文件
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ImportService } from '../../src/main/services/ImportService'
import { DatabaseManager } from '../../src/main/database/DatabaseManager'
import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'

describe('ImportService修复验证', () => {
  let importService: ImportService
  let dbManager: DatabaseManager
  let testExcelPath: string

  beforeEach(async () => {
    // 初始化数据库管理器
    dbManager = DatabaseManager.getInstance()
    await dbManager.initialize(':memory:') // 使用内存数据库进行测试
    
    // 初始化导入服务
    importService = new ImportService()
    
    // 创建测试Excel文件
    testExcelPath = await createTestExcelFile()
  })

  afterEach(async () => {
    // 清理测试文件
    if (fs.existsSync(testExcelPath)) {
      fs.unlinkSync(testExcelPath)
    }
    
    // 关闭数据库连接
    dbManager.close()
  })

  it('应该能够正确初始化ImportService', () => {
    expect(importService).toBeDefined()
    expect(typeof importService.parseExcelFile).toBe('function')
    expect(typeof importService.startImport).toBe('function')
  })

  it('应该能够解析Excel文件', async () => {
    const result = await importService.parseExcelFile(testExcelPath)
    
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    
    if (result.data && result.data.length > 0) {
      const worksheet = result.data[0]
      expect(worksheet).toHaveProperty('sheetName')
      expect(worksheet).toHaveProperty('totalRows')
      expect(worksheet).toHaveProperty('dataRows')
      expect(worksheet).toHaveProperty('recognitionStatus')
    }
  })

  it('应该能够处理不存在的文件', async () => {
    const result = await importService.parseExcelFile('/path/to/nonexistent/file.xlsx')
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error).toContain('文件不存在')
  })

  it('应该能够启动导入过程', async () => {
    const settings = {
      matchMode: 'strict' as const,
      minMatchFields: 3,
      skipEmptyRows: true,
      trimWhitespace: true,
      validateData: true,
      autoUpdateEnabled: false,
      updateFrequency: 'daily' as const
    }

    const result = await importService.startImport([testExcelPath], settings)
    
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(typeof result.data).toBe('string') // 应该返回导入ID
  })

  // 辅助函数：创建测试Excel文件
  async function createTestExcelFile(): Promise<string> {
    const testData = [
      ['合同编号', '合同名称', '甲方', '乙方', '签订日期', '合同金额'],
      ['HT001', '测试合同1', '测试公司A', '测试公司B', '2024-01-01', '100000'],
      ['HT002', '测试合同2', '测试公司C', '测试公司D', '2024-01-02', '200000'],
      ['HT003', '测试合同3', '测试公司E', '测试公司F', '2024-01-03', '300000']
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(testData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '合同数据')

    const testDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }

    const filePath = path.join(testDir, `test-import-${Date.now()}.xlsx`)
    XLSX.writeFile(workbook, filePath)

    return filePath
  }
})
