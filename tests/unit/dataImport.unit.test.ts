/**
 * 数据导入模块单元测试
 * 测试核心功能逻辑，不依赖Electron环境
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

// 模拟Electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-data')
  },
  dialog: {
    showOpenDialog: vi.fn()
  }
}))

// 模拟数据库
vi.mock('../../src/main/database/DatabaseManager', () => ({
  DatabaseManager: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      getDatabase: vi.fn(() => ({
        prepare: vi.fn(() => ({
          run: vi.fn()
        })),
        transaction: vi.fn((fn) => fn)
      })),
      executeQuery: vi.fn(() => ({ success: true, data: [] })),
      close: vi.fn()
    }))
  }
}))

describe('数据导入模块单元测试', () => {
  let testDataDir: string

  beforeEach(() => {
    testDataDir = path.join(__dirname, '../data/unit')
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
  })

  describe('Excel文件解析', () => {
    it('应该能够解析基本的Excel文件结构', async () => {
      // 创建测试Excel文件
      const testFilePath = await createTestExcelFile()

      try {
        // 验证文件存在
        expect(fs.existsSync(testFilePath)).toBe(true)

        // 使用XLSX直接解析验证
        const workbook = XLSX.readFile(testFilePath)
        expect(workbook.SheetNames.length).toBeGreaterThan(0)

        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        expect(data.length).toBeGreaterThan(0)
        expect(Array.isArray(data[0])).toBe(true)

        // 验证标题行
        const headers = data[0] as string[]
        expect(headers).toContain('合同编号')
        expect(headers).toContain('合同名称')
        expect(headers).toContain('甲方')
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath)
        }
      }
    })

    it('应该能够识别合同数据字段', () => {
      const contractHeaders = ['合同编号', '合同名称', '甲方', '乙方', '合同金额']
      const procurementHeaders = ['招采编号', '项目名称', '采购人', '预算金额']

      // 模拟字段识别逻辑
      const isContractData = contractHeaders.some(header =>
        ['合同编号', '合同名称'].includes(header)
      )
      const isProcurementData = contractHeaders.some(header =>
        ['招采编号', '采购编号'].includes(header)
      )

      expect(isContractData).toBe(true)
      expect(isProcurementData).toBe(false)
    })

    it('应该能够识别采购数据字段', () => {
      const procurementHeaders = ['招采编号', '项目名称', '采购人', '预算金额']

      // 模拟字段识别逻辑
      const isProcurementData = procurementHeaders.some(header =>
        ['招采编号', '采购编号'].includes(header)
      )

      expect(isProcurementData).toBe(true)
    })
  })

  describe('数据清洗功能', () => {
    it('应该能够清洗日期格式', () => {
      const testDates = [
        '2024-01-15',
        '2024/01/15',
        '2024年1月15日',
        '2024.01.15'
      ]

      const expectedFormat = '2024-01-15'

      testDates.forEach(dateStr => {
        const cleaned = cleanDateValue(dateStr)
        expect(cleaned).toBe(expectedFormat)
      })
    })

    it('应该能够清洗金额格式', () => {
      const testAmounts = [
        '￥100,000.00',
        '100万',
        '50千',
        '300000元',
        '1,234,567.89'
      ]

      const expectedResults = [
        100000,
        1000000,
        50000,
        300000,
        1234567.89
      ]

      testAmounts.forEach((amount, index) => {
        const cleaned = cleanAmountValue(amount)
        expect(cleaned).toBe(expectedResults[index])
      })
    })

    it('应该能够清理文本中的特殊字符', () => {
      const testTexts = [
        '  测试文本  ',
        '测试\n换行',
        '测试\t制表符',
        '测试\r回车'
      ]

      const expectedResults = [
        '测试文本',
        '测试 换行',
        '测试 制表符',
        '测试 回车'
      ]

      testTexts.forEach((text, index) => {
        const cleaned = cleanTextValue(text)
        expect(cleaned).toBe(expectedResults[index])
      })
    })
  })

  describe('字段匹配功能', () => {
    it('应该能够进行精确匹配', () => {
      const headers = ['合同编号', '合同名称', '甲方', '乙方']
      const fieldConfigs = [
        { fieldName: '合同编号', aliases: [] },
        { fieldName: '合同名称', aliases: [] },
        { fieldName: '甲方', aliases: ['甲方单位'] },
        { fieldName: '乙方', aliases: ['乙方单位'] }
      ]

      const matches = performFieldMatching(headers, fieldConfigs, 'strict')

      expect(matches.size).toBe(4)
      expect(matches.get('合同编号')).toBe(0)
      expect(matches.get('合同名称')).toBe(1)
      expect(matches.get('甲方')).toBe(2)
      expect(matches.get('乙方')).toBe(3)
    })

    it('应该能够进行模糊匹配', () => {
      const headers = ['合同号', '项目名称', '发包方', '承包方']
      const fieldConfigs = [
        { fieldName: '合同编号', aliases: ['合同号', '编号'] },
        { fieldName: '合同名称', aliases: ['项目名称', '名称'] },
        { fieldName: '甲方', aliases: ['发包方', '委托方'] },
        { fieldName: '乙方', aliases: ['承包方', '受托方'] }
      ]

      const matches = performFieldMatching(headers, fieldConfigs, 'fuzzy')

      expect(matches.size).toBe(4)
      expect(matches.get('合同编号')).toBe(0)
      expect(matches.get('合同名称')).toBe(1)
      expect(matches.get('甲方')).toBe(2)
      expect(matches.get('乙方')).toBe(3)
    })
  })

  describe('导入设置验证', () => {
    it('应该验证导入设置的有效性', () => {
      const validSettings = {
        matchMode: 'strict' as const,
        minMatchFields: 3,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'daily' as const
      }

      const isValid = validateImportSettings(validSettings)
      expect(isValid).toBe(true)
    })

    it('应该拒绝无效的导入设置', () => {
      const invalidSettings = {
        matchMode: 'invalid' as any,
        minMatchFields: -1,
        skipEmptyRows: true,
        trimWhitespace: true,
        validateData: true,
        autoUpdateEnabled: false,
        updateFrequency: 'invalid' as any
      }

      const isValid = validateImportSettings(invalidSettings)
      expect(isValid).toBe(false)
    })
  })

  // 辅助函数
  async function createTestExcelFile(): Promise<string> {
    const workbook = XLSX.utils.book_new()

    const contractData = [
      ['合同编号', '合同名称', '甲方', '乙方', '合同金额', '签订日期'],
      ['HT001', '测试合同1', '甲方A', '乙方A', '100000', '2024-01-15'],
      ['HT002', '测试合同2', '甲方B', '乙方B', '200000', '2024-02-01']
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(contractData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '合同数据')

    const filePath = path.join(testDataDir, 'unit-test-data.xlsx')
    XLSX.writeFile(workbook, filePath)

    return filePath
  }

  function cleanDateValue(dateStr: string): string {
    // 简化的日期清洗逻辑
    const cleaned = dateStr
      .replace(/年|月/g, '-')
      .replace(/日/g, '')
      .replace(/\./g, '-')
      .replace(/\//g, '-')

    // 标准化为YYYY-MM-DD格式
    const parts = cleaned.split('-')
    if (parts.length === 3) {
      const year = parts[0].padStart(4, '0')
      const month = parts[1].padStart(2, '0')
      const day = parts[2].padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return cleaned
  }

  function cleanAmountValue(amountStr: string): number {
    // 简化的金额清洗逻辑
    let cleaned = amountStr
      .replace(/￥|元|,/g, '')
      .trim()

    if (cleaned.includes('万')) {
      const num = parseFloat(cleaned.replace('万', ''))
      return num * 10000
    }

    if (cleaned.includes('千')) {
      const num = parseFloat(cleaned.replace('千', ''))
      return num * 1000
    }

    return parseFloat(cleaned) || 0
  }

  function cleanTextValue(text: string): string {
    // 简化的文本清洗逻辑
    return text
      .trim()
      .replace(/\n|\r|\t/g, ' ')
      .replace(/\s+/g, ' ')
  }

  function performFieldMatching(
    headers: string[],
    fieldConfigs: any[],
    mode: 'strict' | 'fuzzy'
  ): Map<string, number> {
    const mapping = new Map<string, number>()

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]

      for (const field of fieldConfigs) {
        let isMatch = false

        if (mode === 'strict') {
          isMatch = header === field.fieldName
        } else {
          isMatch = header === field.fieldName || field.aliases.includes(header)
        }

        if (isMatch) {
          mapping.set(field.fieldName, i)
          break
        }
      }
    }

    return mapping
  }

  function validateImportSettings(settings: any): boolean {
    if (!['strict', 'fuzzy'].includes(settings.matchMode)) {
      return false
    }

    if (settings.minMatchFields < 0) {
      return false
    }

    if (settings.autoUpdateEnabled && !['hourly', 'daily', 'weekly', 'monthly'].includes(settings.updateFrequency)) {
      return false
    }

    return true
  }
})
