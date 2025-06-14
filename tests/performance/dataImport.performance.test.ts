/**
 * 数据导入模块性能测试
 * 测试Excel解析速度、内存使用、并发处理能力等性能指标
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { performance } from 'perf_hooks'
import { ImportService } from '../../src/main/services/ImportService'
import { DatabaseManager } from '../../src/main/database/DatabaseManager'

describe('数据导入模块性能测试', () => {
  let importService: ImportService
  let dbManager: DatabaseManager
  let testDataDir: string

  beforeEach(async () => {
    // 初始化数据库管理器
    dbManager = DatabaseManager.getInstance()
    await dbManager.initialize(':memory:')
    
    // 初始化导入服务
    importService = new ImportService()
    
    // 创建测试数据目录
    testDataDir = path.join(__dirname, '../data/performance')
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
  })

  afterEach(async () => {
    // 清理测试文件
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir)
      for (const file of files) {
        fs.unlinkSync(path.join(testDataDir, file))
      }
    }
    
    // 关闭数据库连接
    dbManager.close()
  })

  describe('Excel解析性能测试', () => {
    it('应该能够在1秒内解析1000行数据', async () => {
      const testFilePath = await createLargeExcelFile(1000)
      
      const startTime = performance.now()
      const result = await importService.parseExcelFile(testFilePath)
      const endTime = performance.now()
      
      const parseTime = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(parseTime).toBeLessThan(1000) // 小于1秒
      
      console.log(`解析1000行数据耗时: ${parseTime.toFixed(2)}ms`)
    })

    it('应该能够处理大型Excel文件（10000行）', async () => {
      const testFilePath = await createLargeExcelFile(10000)
      
      const startTime = performance.now()
      const result = await importService.parseExcelFile(testFilePath)
      const endTime = performance.now()
      
      const parseTime = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(result.data![0].totalRows).toBe(10001) // 包含标题行
      expect(result.data![0].dataRows).toBe(10000)
      
      // 解析速度应该≥1000行/秒
      const rowsPerSecond = 10000 / (parseTime / 1000)
      expect(rowsPerSecond).toBeGreaterThanOrEqual(1000)
      
      console.log(`解析10000行数据耗时: ${parseTime.toFixed(2)}ms`)
      console.log(`解析速度: ${rowsPerSecond.toFixed(0)}行/秒`)
    })

    it('应该能够处理多个工作表的大型文件', async () => {
      const testFilePath = await createMultiSheetLargeFile()
      
      const startTime = performance.now()
      const result = await importService.parseExcelFile(testFilePath)
      const endTime = performance.now()
      
      const parseTime = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(result.data!.length).toBe(3) // 3个工作表
      
      console.log(`解析多工作表文件耗时: ${parseTime.toFixed(2)}ms`)
    })
  })

  describe('数据导入性能测试', () => {
    it('应该能够在合理时间内完成大量数据导入', async () => {
      const testFilePath = await createLargeExcelFile(5000)
      
      const settings = {
        matchMode: 'fuzzy' as const,
        minMatchFields: 2,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      const startTime = performance.now()
      const startResult = await importService.startImport([testFilePath], settings)
      expect(startResult.success).toBe(true)
      
      const importId = startResult.data!
      
      // 等待导入完成
      await waitForImportCompletion(importId, 30000) // 最多等待30秒
      
      const endTime = performance.now()
      const importTime = endTime - startTime
      
      const progress = importService.getImportProgress(importId)
      expect(progress!.status).toBe('completed')
      
      // 计算导入速度
      const rowsPerSecond = 5000 / (importTime / 1000)
      console.log(`导入5000行数据耗时: ${importTime.toFixed(2)}ms`)
      console.log(`导入速度: ${rowsPerSecond.toFixed(0)}行/秒`)
      
      // 导入速度应该合理（至少100行/秒）
      expect(rowsPerSecond).toBeGreaterThanOrEqual(100)
    })

    it('应该能够处理并发导入而不影响性能', async () => {
      const testFile1 = await createLargeExcelFile(1000, 'concurrent1')
      const testFile2 = await createLargeExcelFile(1000, 'concurrent2')
      const testFile3 = await createLargeExcelFile(1000, 'concurrent3')

      const settings = {
        matchMode: 'fuzzy' as const,
        minMatchFields: 2,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      const startTime = performance.now()
      
      // 同时启动三个导入任务
      const [result1, result2, result3] = await Promise.all([
        importService.startImport([testFile1], settings),
        importService.startImport([testFile2], settings),
        importService.startImport([testFile3], settings)
      ])

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)

      // 等待所有导入完成
      await Promise.all([
        waitForImportCompletion(result1.data!, 20000),
        waitForImportCompletion(result2.data!, 20000),
        waitForImportCompletion(result3.data!, 20000)
      ])

      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`并发导入3000行数据耗时: ${totalTime.toFixed(2)}ms`)
      
      // 验证所有导入都成功完成
      const progress1 = importService.getImportProgress(result1.data!)
      const progress2 = importService.getImportProgress(result2.data!)
      const progress3 = importService.getImportProgress(result3.data!)

      expect(progress1!.status).toBe('completed')
      expect(progress2!.status).toBe('completed')
      expect(progress3!.status).toBe('completed')
    })
  })

  describe('内存使用测试', () => {
    it('应该能够处理大文件而不造成内存泄漏', async () => {
      const initialMemory = process.memoryUsage()
      
      // 处理多个大文件
      for (let i = 0; i < 5; i++) {
        const testFilePath = await createLargeExcelFile(2000, `memory-test-${i}`)
        
        const result = await importService.parseExcelFile(testFilePath)
        expect(result.success).toBe(true)
        
        // 清理文件
        fs.unlinkSync(testFilePath)
        
        // 强制垃圾回收（如果可用）
        if (global.gc) {
          global.gc()
        }
      }
      
      const finalMemory = process.memoryUsage()
      
      // 内存增长应该在合理范围内（小于100MB）
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024
      
      console.log(`内存增长: ${memoryIncreaseMB.toFixed(2)}MB`)
      expect(memoryIncreaseMB).toBeLessThan(100)
    })
  })

  describe('数据库性能测试', () => {
    it('应该能够快速查询导入的数据', async () => {
      // 先导入一些数据
      const testFilePath = await createLargeExcelFile(1000)
      
      const settings = {
        matchMode: 'fuzzy' as const,
        minMatchFields: 2,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      const startResult = await importService.startImport([testFilePath], settings)
      expect(startResult.success).toBe(true)
      
      await waitForImportCompletion(startResult.data!, 15000)

      // 测试查询性能
      const queryStartTime = performance.now()
      const queryResult = await dbManager.executeQuery('SELECT COUNT(*) as count FROM contracts')
      const queryEndTime = performance.now()
      
      const queryTime = queryEndTime - queryStartTime
      
      expect(queryResult.success).toBe(true)
      expect(queryResult.data[0].count).toBeGreaterThan(0)
      
      // 查询时间应该小于100ms
      expect(queryTime).toBeLessThan(100)
      
      console.log(`查询1000条记录耗时: ${queryTime.toFixed(2)}ms`)
    })
  })

  // 辅助函数
  async function createLargeExcelFile(rowCount: number, suffix: string = ''): Promise<string> {
    const workbook = XLSX.utils.book_new()
    
    // 创建标题行
    const data = [['合同编号', '合同名称', '甲方', '乙方', '合同金额', '签订日期', '工期']]
    
    // 生成大量数据行
    for (let i = 1; i <= rowCount; i++) {
      data.push([
        `HT${i.toString().padStart(6, '0')}`,
        `测试合同${i}`,
        `甲方${i % 100}`,
        `乙方${i % 50}`,
        (Math.random() * 1000000).toFixed(2),
        `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        Math.floor(Math.random() * 365) + 30
      ])
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, '合同数据')
    
    const fileName = `large-test-data-${rowCount}${suffix ? '-' + suffix : ''}.xlsx`
    const filePath = path.join(testDataDir, fileName)
    XLSX.writeFile(workbook, filePath)
    
    return filePath
  }

  async function createMultiSheetLargeFile(): Promise<string> {
    const workbook = XLSX.utils.book_new()
    
    // 创建3个工作表，每个1000行
    for (let sheetIndex = 1; sheetIndex <= 3; sheetIndex++) {
      const data = [['合同编号', '合同名称', '甲方', '乙方', '合同金额']]
      
      for (let i = 1; i <= 1000; i++) {
        data.push([
          `HT${sheetIndex}${i.toString().padStart(4, '0')}`,
          `工作表${sheetIndex}合同${i}`,
          `甲方${i % 50}`,
          `乙方${i % 30}`,
          (Math.random() * 500000).toFixed(2)
        ])
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, `合同数据${sheetIndex}`)
    }
    
    const filePath = path.join(testDataDir, 'multi-sheet-large.xlsx')
    XLSX.writeFile(workbook, filePath)
    
    return filePath
  }

  async function waitForImportCompletion(importId: string, timeout: number): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const progress = importService.getImportProgress(importId)
      if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
        if (progress.status === 'failed') {
          throw new Error(`导入失败: ${progress.errors.map(e => e.message).join('; ')}`)
        }
        return
      }
      
      // 等待100ms后再检查
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error(`导入超时: ${importId}`)
  }
})
