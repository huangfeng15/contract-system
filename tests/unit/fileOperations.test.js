/**
 * 文件操作功能测试
 * 测试字段管理、项目管理、合同管理、采购管理的导入导出功能
 */

import { describe, it, expect } from 'vitest'

describe('文件操作工具类测试', () => {
  it('应该能够导入文件操作工具类', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')
    expect(FileOperationsUtil).toBeDefined()
    expect(typeof FileOperationsUtil.generateFileName).toBe('function')
    expect(typeof FileOperationsUtil.getExportDirectory).toBe('function')
    expect(typeof FileOperationsUtil.validateImportFile).toBe('function')
    expect(typeof FileOperationsUtil.formatExportData).toBe('function')
  })

  it('应该能够生成正确的文件名', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    const fileName = FileOperationsUtil.generateFileName('field', 'fields_export_')
    expect(fileName).toMatch(/^fields_export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.*\.json$/)
  })

  it('应该能够获取正确的导出目录', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    expect(FileOperationsUtil.getExportDirectory('field')).toBe('exports/fields')
    expect(FileOperationsUtil.getExportDirectory('project')).toBe('exports/projects')
    expect(FileOperationsUtil.getExportDirectory('contract')).toBe('exports/contracts')
    expect(FileOperationsUtil.getExportDirectory('procurement')).toBe('exports/procurements')
  })

  it('应该能够验证导入文件格式', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    // 测试有效的JSON文件
    const validResult = FileOperationsUtil.validateImportFile('test.json', 1024)
    expect(validResult.valid).toBe(true)

    // 测试无效的文件扩展名
    const invalidExtResult = FileOperationsUtil.validateImportFile('test.txt', 1024)
    expect(invalidExtResult.valid).toBe(false)
    expect(invalidExtResult.error).toContain('不支持的文件格式')

    // 测试文件过大
    const largeSizeResult = FileOperationsUtil.validateImportFile('test.json', 20 * 1024 * 1024)
    expect(largeSizeResult.valid).toBe(false)
    expect(largeSizeResult.error).toContain('文件大小超出限制')
  })

  it('应该能够验证JSON数据格式', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    // 测试有效的数组数据
    const validData = [{ name: 'test', type: 'text' }]
    const validResult = FileOperationsUtil.validateJsonData(validData)
    expect(validResult.valid).toBe(true)

    // 测试非数组数据
    const invalidData = { name: 'test' }
    const invalidResult = FileOperationsUtil.validateJsonData(invalidData)
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.error).toContain('JSON数据必须是数组格式')

    // 测试空数组
    const emptyResult = FileOperationsUtil.validateJsonData([])
    expect(emptyResult.valid).toBe(false)
    expect(emptyResult.error).toContain('没有可导出的数据')
  })

  it('应该能够格式化字段导出数据', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    const fieldData = [
      {
        id: 1,
        name: '合同编号',
        type: '文本',
        aliases: ['编号', '合同号'],
        fieldType: 'contract',
        isVisible: true,
        displayOrder: 1
      }
    ]

    const formatted = FileOperationsUtil.formatExportData(fieldData, 'field')
    expect(formatted).toHaveLength(1)
    expect(formatted[0]).toHaveProperty('字段名称', '合同编号')
    expect(formatted[0]).toHaveProperty('字段类型', '文本')
    expect(formatted[0]).toHaveProperty('别名列表', '编号, 合同号')
    expect(formatted[0]).toHaveProperty('字段分类', 'contract')
  })

  it('应该能够格式化项目导出数据', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    const projectData = [
      {
        id: 1,
        projectCode: 'PRJ001',
        projectName: '测试项目',
        projectAlias: '测试',
        description: '项目描述',
        status: '进行中',
        contractCount: 5,
        procurementCount: 3,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      }
    ]

    const formatted = FileOperationsUtil.formatExportData(projectData, 'project')
    expect(formatted).toHaveLength(1)
    expect(formatted[0]).toHaveProperty('项目编号', 'PRJ001')
    expect(formatted[0]).toHaveProperty('项目名称', '测试项目')
    expect(formatted[0]).toHaveProperty('项目别名', '测试')
    expect(formatted[0]).toHaveProperty('合同数量', 5)
    expect(formatted[0]).toHaveProperty('采购数量', 3)
  })

  it('应该能够格式化合同导出数据', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    const contractData = [
      {
        id: 1,
        contractNumber: 'HT001',
        projectName: '测试项目',
        partyA: '甲方公司',
        partyB: '乙方公司',
        signDate: '2024-01-01',
        amount: 1000000,
        status: '执行中'
      }
    ]

    const formatted = FileOperationsUtil.formatExportData(contractData, 'contract')
    expect(formatted).toHaveLength(1)
    expect(formatted[0]).toHaveProperty('合同编号', 'HT001')
    expect(formatted[0]).toHaveProperty('关联项目', '测试项目')
    expect(formatted[0]).toHaveProperty('甲方单位', '甲方公司')
    expect(formatted[0]).toHaveProperty('乙方单位', '乙方公司')
    expect(formatted[0]).toHaveProperty('合同金额', 1000000)
  })

  it('应该能够格式化采购导出数据', async () => {
    const { FileOperationsUtil } = await import('../../src/shared/utils/fileOperations.util.ts')

    const procurementData = [
      {
        id: 1,
        procurementNumber: 'CG001',
        projectName: '测试项目',
        supplier: '供应商公司',
        content: '采购内容',
        amount: 500000,
        date: '2024-01-01',
        status: '进行中'
      }
    ]

    const formatted = FileOperationsUtil.formatExportData(procurementData, 'procurement')
    expect(formatted).toHaveLength(1)
    expect(formatted[0]).toHaveProperty('采购编号', 'CG001')
    expect(formatted[0]).toHaveProperty('关联项目', '测试项目')
    expect(formatted[0]).toHaveProperty('供应商', '供应商公司')
    expect(formatted[0]).toHaveProperty('采购内容', '采购内容')
    expect(formatted[0]).toHaveProperty('采购金额', 500000)
  })
})

describe('文件操作配置常量测试', () => {
  it('应该有正确的文件操作配置', async () => {
    const { FILE_OPERATION_CONFIG } = await import('../../src/shared/utils/fileOperations.util.ts')

    expect(FILE_OPERATION_CONFIG).toBeDefined()
    expect(FILE_OPERATION_CONFIG.EXPORT).toBeDefined()
    expect(FILE_OPERATION_CONFIG.IMPORT).toBeDefined()
    expect(FILE_OPERATION_CONFIG.FILENAME_FORMAT).toBeDefined()

    // 检查导出配置
    expect(FILE_OPERATION_CONFIG.EXPORT.DEFAULT_DIR).toBe('exports')
    expect(FILE_OPERATION_CONFIG.EXPORT.FIELD_DIR).toBe('fields')
    expect(FILE_OPERATION_CONFIG.EXPORT.PROJECT_DIR).toBe('projects')
    expect(FILE_OPERATION_CONFIG.EXPORT.CONTRACT_DIR).toBe('contracts')
    expect(FILE_OPERATION_CONFIG.EXPORT.PROCUREMENT_DIR).toBe('procurements')

    // 检查导入配置
    expect(FILE_OPERATION_CONFIG.IMPORT.ALLOWED_EXTENSIONS).toContain('.json')
    expect(FILE_OPERATION_CONFIG.IMPORT.MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    expect(FILE_OPERATION_CONFIG.IMPORT.ENCODING).toBe('utf-8')
  })

  it('应该有正确的错误消息常量', async () => {
    const { FILE_OPERATION_ERRORS } = await import('../../src/shared/utils/fileOperations.util.ts')

    expect(FILE_OPERATION_ERRORS).toBeDefined()
    expect(FILE_OPERATION_ERRORS.INVALID_FILE_FORMAT).toContain('不支持的文件格式')
    expect(FILE_OPERATION_ERRORS.FILE_TOO_LARGE).toContain('文件大小超出限制')
    expect(FILE_OPERATION_ERRORS.EMPTY_DATA).toContain('没有可导出的数据')
  })
})
