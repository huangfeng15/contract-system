/**
 * 数据导入模块端到端测试
 * 在Electron环境中测试完整的用户交互流程
 */

import { test, expect } from '@playwright/test'
import { ElectronApplication, Page, _electron as electron } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'
import * as XLSX from 'xlsx'

let electronApp: ElectronApplication
let page: Page

test.describe('数据导入模块E2E测试', () => {
  test.beforeAll(async () => {
    // 启动Electron应用
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      timeout: 30000
    })
    
    // 获取主窗口
    page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    
    // 等待应用完全加载
    await page.waitForTimeout(2000)
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test.beforeEach(async () => {
    // 导航到数据导入页面
    await page.click('[data-testid="nav-data-import"]')
    await page.waitForSelector('.data-import-view')
  })

  test('应该能够显示数据导入页面', async () => {
    // 验证页面标题
    await expect(page.locator('.page-title')).toContainText('数据导入')
    
    // 验证上传区域
    await expect(page.locator('.upload-area-compact')).toBeVisible()
    
    // 验证文件列表表格
    await expect(page.locator('.data-table')).toBeVisible()
    
    // 验证导入设置按钮
    await expect(page.locator('button:has-text("导入设置")')).toBeVisible()
  })

  test('应该能够选择和解析Excel文件', async () => {
    // 创建测试Excel文件
    const testFilePath = await createTestExcelFile()
    
    try {
      // 模拟文件选择（注意：在实际E2E测试中，文件选择需要特殊处理）
      await page.evaluate(async (filePath) => {
        // 模拟文件选择的结果
        const mockFiles = [filePath]
        
        // 触发文件处理逻辑
        const dataImportView = (window as any).dataImportViewInstance
        if (dataImportView && dataImportView.processSelectedFiles) {
          await dataImportView.processSelectedFiles(mockFiles)
        }
      }, testFilePath)
      
      // 等待文件处理完成
      await page.waitForTimeout(2000)
      
      // 验证文件列表中出现了新文件
      await expect(page.locator('.data-table tbody tr')).toHaveCount(1)
      
      // 验证文件信息显示正确
      await expect(page.locator('.data-table tbody tr td:nth-child(2)')).toContainText('test-contract-data.xlsx')
      await expect(page.locator('.data-table tbody tr td:nth-child(5)')).toContainText('已完成')
      
      // 验证统计信息更新
      await expect(page.locator('.page-stats')).toContainText('总文件 1')
    } finally {
      // 清理测试文件
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('应该能够查看文件详情', async () => {
    // 首先添加一个测试文件
    const testFilePath = await createTestExcelFile()
    
    try {
      // 添加文件到列表
      await page.evaluate(async (filePath) => {
        const dataImportView = (window as any).dataImportViewInstance
        if (dataImportView && dataImportView.processSelectedFiles) {
          await dataImportView.processSelectedFiles([filePath])
        }
      }, testFilePath)
      
      await page.waitForTimeout(1000)
      
      // 点击查看详情按钮
      await page.click('button:has-text("📋 查看详情")')
      
      // 验证详情模态框出现
      await expect(page.locator('.file-detail-modal')).toBeVisible()
      
      // 验证工作表信息显示
      await expect(page.locator('.worksheet-info')).toBeVisible()
      
      // 验证字段匹配信息
      await expect(page.locator('.matched-fields')).toBeVisible()
      
      // 关闭模态框
      await page.click('.modal-close')
      await expect(page.locator('.file-detail-modal')).not.toBeVisible()
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('应该能够配置导入设置', async () => {
    // 点击导入设置按钮
    await page.click('button:has-text("导入设置")')
    
    // 验证设置模态框出现
    await expect(page.locator('.import-settings-modal')).toBeVisible()
    
    // 测试匹配模式选择
    await page.selectOption('select[name="matchMode"]', 'fuzzy')
    
    // 测试最少匹配字段数设置
    await page.fill('input[name="minMatchFields"]', '2')
    
    // 测试其他设置选项
    await page.check('input[name="skipEmptyRows"]')
    await page.check('input[name="trimWhitespace"]')
    await page.check('input[name="validateData"]')
    
    // 保存设置
    await page.click('button:has-text("保存设置")')
    
    // 验证模态框关闭
    await expect(page.locator('.import-settings-modal')).not.toBeVisible()
    
    // 验证设置已保存（可以通过重新打开设置来验证）
    await page.click('button:has-text("导入设置")')
    await expect(page.locator('select[name="matchMode"]')).toHaveValue('fuzzy')
    await expect(page.locator('input[name="minMatchFields"]')).toHaveValue('2')
  })

  test('应该能够执行完整的导入流程', async () => {
    const testFilePath = await createTestExcelFile()
    
    try {
      // 1. 添加文件
      await page.evaluate(async (filePath) => {
        const dataImportView = (window as any).dataImportViewInstance
        if (dataImportView && dataImportView.processSelectedFiles) {
          await dataImportView.processSelectedFiles([filePath])
        }
      }, testFilePath)
      
      await page.waitForTimeout(1000)
      
      // 2. 配置导入设置
      await page.click('button:has-text("导入设置")')
      await page.selectOption('select[name="matchMode"]', 'fuzzy')
      await page.fill('input[name="minMatchFields"]', '2')
      await page.click('button:has-text("保存设置")')
      
      // 3. 查看文件详情并启动导入
      await page.click('button:has-text("📋 查看详情")')
      await page.click('button:has-text("导入此文件")')
      
      // 4. 等待导入完成
      await page.waitForTimeout(5000)
      
      // 5. 验证导入结果
      // 这里可以检查数据库或者其他指标来验证导入是否成功
      
      // 验证成功消息
      await expect(page.locator('.el-message--success')).toBeVisible()
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('应该能够处理多个文件的批量导入', async () => {
    const testFile1 = await createTestExcelFile('file1')
    const testFile2 = await createTestExcelFile('file2')
    
    try {
      // 添加多个文件
      await page.evaluate(async (filePaths) => {
        const dataImportView = (window as any).dataImportViewInstance
        if (dataImportView && dataImportView.processSelectedFiles) {
          await dataImportView.processSelectedFiles(filePaths)
        }
      }, [testFile1, testFile2])
      
      await page.waitForTimeout(2000)
      
      // 验证文件列表显示两个文件
      await expect(page.locator('.data-table tbody tr')).toHaveCount(2)
      
      // 验证统计信息
      await expect(page.locator('.page-stats')).toContainText('总文件 2')
      
      // 测试手动更新所有文件功能
      await page.click('button:has-text("手动更新所有文件数据")')
      
      // 确认更新操作
      await page.click('button:has-text("确定")')
      
      // 等待更新完成
      await page.waitForTimeout(3000)
      
      // 验证更新成功消息
      await expect(page.locator('.el-message--success')).toBeVisible()
    } finally {
      if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1)
      if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2)
    }
  })

  test('应该能够删除文件', async () => {
    const testFilePath = await createTestExcelFile()
    
    try {
      // 添加文件
      await page.evaluate(async (filePath) => {
        const dataImportView = (window as any).dataImportViewInstance
        if (dataImportView && dataImportView.processSelectedFiles) {
          await dataImportView.processSelectedFiles([filePath])
        }
      }, testFilePath)
      
      await page.waitForTimeout(1000)
      
      // 验证文件已添加
      await expect(page.locator('.data-table tbody tr')).toHaveCount(1)
      
      // 点击删除按钮
      await page.click('button:has-text("🗑️ 删除")')
      
      // 验证文件已删除
      await expect(page.locator('.data-table tbody tr')).toHaveCount(0)
      
      // 验证统计信息更新
      await expect(page.locator('.page-stats')).toContainText('总文件 0')
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('应该能够处理拖拽上传', async () => {
    const testFilePath = await createTestExcelFile()
    
    try {
      // 模拟拖拽文件到上传区域
      await page.evaluate(async (filePath) => {
        const uploadArea = document.querySelector('.upload-area-compact')
        if (uploadArea) {
          // 创建模拟的拖拽事件
          const file = new File([''], path.basename(filePath), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          Object.defineProperty(file, 'path', { value: filePath })
          
          const dataTransfer = new DataTransfer()
          dataTransfer.files.add(file)
          
          const dropEvent = new DragEvent('drop', {
            dataTransfer: dataTransfer,
            bubbles: true,
            cancelable: true
          })
          
          uploadArea.dispatchEvent(dropEvent)
        }
      }, testFilePath)
      
      await page.waitForTimeout(2000)
      
      // 验证文件已添加
      await expect(page.locator('.data-table tbody tr')).toHaveCount(1)
      
      // 验证成功消息
      await expect(page.locator('.el-message--success')).toBeVisible()
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  // 辅助函数
  async function createTestExcelFile(suffix: string = ''): Promise<string> {
    const workbook = XLSX.utils.book_new()
    
    const contractData = [
      ['合同编号', '合同名称', '甲方', '乙方', '合同金额', '签订日期'],
      ['HT001', '测试合同1', '甲方A', '乙方A', '100000', '2024-01-15'],
      ['HT002', '测试合同2', '甲方B', '乙方B', '200000', '2024-02-01'],
      ['HT003', '测试合同3', '甲方C', '乙方C', '300000', '2024-03-01']
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(contractData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '合同数据')
    
    const fileName = `test-contract-data${suffix ? '-' + suffix : ''}.xlsx`
    const testDataDir = path.join(__dirname, '../data')
    
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
    
    const filePath = path.join(testDataDir, fileName)
    XLSX.writeFile(workbook, filePath)
    
    return filePath
  }
})
