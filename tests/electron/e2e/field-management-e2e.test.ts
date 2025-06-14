/**
 * 字段管理模块端到端测试
 * 在Electron环境下测试字段管理的完整功能
 */

import { test, expect, Page, ElectronApplication } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let electronApp: ElectronApplication
let page: Page

test.describe('字段管理模块 E2E 测试', () => {
  test.beforeAll(async () => {
    // 启动Electron应用
    electronApp = await electron.launch({
      executablePath: require('electron'),
      args: [path.join(__dirname, '../../../dist-electron/main/main.js')],
      env: {
        NODE_ENV: 'test',
        DB_PATH: ':memory:', // 使用内存数据库
        LOG_LEVEL: 'error'
      }
    })

    // 获取主窗口
    page = await electronApp.firstWindow()

    // 等待应用加载完成
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000) // 等待Vue应用初始化
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test.beforeEach(async () => {
    // 导航到字段管理页面
    await page.goto('/#/field-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('页面基础元素渲染正确', async () => {
    // 验证页面标题
    await expect(page.locator('.page-title')).toContainText('字段管理')

    // 验证统计信息显示
    await expect(page.locator('.page-stats')).toBeVisible()

    // 验证标签页切换按钮
    await expect(page.locator('.tab-btn:has-text("合同字段")')).toBeVisible()
    await expect(page.locator('.tab-btn:has-text("采购字段")')).toBeVisible()

    // 验证操作工具栏
    await expect(page.locator('button:has-text("新增字段")')).toBeVisible()
    await expect(page.locator('button:has-text("导入字段")')).toBeVisible()
    await expect(page.locator('button:has-text("导出字段")')).toBeVisible()

    // 验证搜索框
    await expect(page.locator('.search-input')).toBeVisible()

    // 验证数据表格
    await expect(page.locator('.data-table')).toBeVisible()
    await expect(page.locator('th:has-text("序号")')).toBeVisible()
    await expect(page.locator('th:has-text("字段名称")')).toBeVisible()
    await expect(page.locator('th:has-text("字段类型")')).toBeVisible()
    await expect(page.locator('th:has-text("别名列表")')).toBeVisible()
    await expect(page.locator('th:has-text("操作")')).toBeVisible()
  })

  test('标签页切换功能', async () => {
    // 默认应该在合同字段标签页
    await expect(page.locator('.tab-btn:has-text("合同字段")')).toHaveClass(/active/)

    // 切换到采购字段标签页
    await page.click('.tab-btn:has-text("采购字段")')
    await page.waitForTimeout(500)

    // 验证标签页状态
    await expect(page.locator('.tab-btn:has-text("采购字段")')).toHaveClass(/active/)
    await expect(page.locator('.tab-btn:has-text("合同字段")')).not.toHaveClass(/active/)

    // 切换回合同字段标签页
    await page.click('.tab-btn:has-text("合同字段")')
    await page.waitForTimeout(500)

    // 验证标签页状态
    await expect(page.locator('.tab-btn:has-text("合同字段")')).toHaveClass(/active/)
    await expect(page.locator('.tab-btn:has-text("采购字段")')).not.toHaveClass(/active/)
  })

  test('字段搜索功能', async () => {
    // 输入搜索关键词
    await page.fill('.search-input', '合同编号')
    await page.waitForTimeout(500)

    // 验证搜索结果
    const visibleRows = page.locator('.data-table tbody tr:visible')
    await expect(visibleRows).toHaveCount(1)
    await expect(visibleRows.first()).toContainText('合同编号')

    // 清空搜索
    await page.fill('.search-input', '')
    await page.waitForTimeout(500)

    // 验证显示所有字段
    const allRows = page.locator('.data-table tbody tr')
    await expect(allRows).toHaveCountGreaterThan(1)
  })

  test('新增字段功能', async () => {
    // 点击新增字段按钮
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)

    // 验证模态窗口打开
    await expect(page.locator('.field-modal')).toBeVisible()
    await expect(page.locator('.modal-title:has-text("新增字段")')).toBeVisible()

    // 填写字段信息
    await page.fill('input[placeholder="请输入字段名称"]', '测试字段')
    await page.selectOption('select', '文本')
    await page.fill('textarea[placeholder="请输入字段别名"]', '测试别名1, 测试别名2')

    // 保存字段
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 验证模态窗口关闭
    await expect(page.locator('.field-modal')).not.toBeVisible()

    // 验证新字段出现在列表中
    await expect(page.locator('.data-table tbody tr:has-text("测试字段")')).toBeVisible()
  })

  test('编辑字段功能', async () => {
    // 先确保有字段可以编辑
    const firstEditBtn = page.locator('.data-table tbody tr:first-child button:has-text("编辑")')
    await expect(firstEditBtn).toBeVisible()

    // 点击编辑按钮
    await firstEditBtn.click()
    await page.waitForTimeout(500)

    // 验证模态窗口打开并预填充数据
    await expect(page.locator('.field-modal')).toBeVisible()
    await expect(page.locator('.modal-title:has-text("编辑字段")')).toBeVisible()

    // 修改字段名称
    const nameInput = page.locator('input[placeholder="请输入字段名称"]')
    await expect(nameInput).not.toHaveValue('')
    await nameInput.fill('修改后的字段名称')

    // 保存修改
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 验证模态窗口关闭
    await expect(page.locator('.field-modal')).not.toBeVisible()

    // 验证字段名称已更新
    await expect(page.locator('.data-table tbody tr:has-text("修改后的字段名称")')).toBeVisible()
  })

  test('删除字段功能', async () => {
    // 获取删除前的行数
    const initialRowCount = await page.locator('.data-table tbody tr').count()

    // 点击第一行的删除按钮
    const firstDeleteBtn = page.locator('.data-table tbody tr:first-child button:has-text("删除")')
    await expect(firstDeleteBtn).toBeVisible()
    await firstDeleteBtn.click()
    await page.waitForTimeout(500)

    // 验证确认对话框
    await expect(page.locator('.el-message-box')).toBeVisible()

    // 确认删除
    await page.click('.el-message-box button:has-text("确定")')
    await page.waitForTimeout(1000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 验证行数减少
    const finalRowCount = await page.locator('.data-table tbody tr').count()
    expect(finalRowCount).toBe(initialRowCount - 1)
  })

  test('模态窗口关闭功能', async () => {
    // 打开新增字段模态窗口
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)
    await expect(page.locator('.field-modal')).toBeVisible()

    // 点击关闭按钮
    await page.click('.modal-close')
    await page.waitForTimeout(500)

    // 验证模态窗口关闭
    await expect(page.locator('.field-modal')).not.toBeVisible()

    // 再次打开模态窗口
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)
    await expect(page.locator('.field-modal')).toBeVisible()

    // 点击取消按钮
    await page.click('button:has-text("取消")')
    await page.waitForTimeout(500)

    // 验证模态窗口关闭
    await expect(page.locator('.field-modal')).not.toBeVisible()
  })

  test('字段显示/隐藏切换功能', async () => {
    // 查找第一个字段的显示/隐藏切换按钮
    const firstRow = page.locator('.data-table tbody tr:first-child')
    const toggleBtn = firstRow.locator('button:has-text("隐藏"), button:has-text("显示")')

    if (await toggleBtn.count() > 0) {
      const initialText = await toggleBtn.textContent()

      // 点击切换按钮
      await toggleBtn.click()
      await page.waitForTimeout(500)

      // 验证按钮文本改变
      const newText = await toggleBtn.textContent()
      expect(newText).not.toBe(initialText)

      // 再次点击切换回来
      await toggleBtn.click()
      await page.waitForTimeout(500)

      // 验证按钮文本恢复
      const finalText = await toggleBtn.textContent()
      expect(finalText).toBe(initialText)
    }
  })

  test('字段排序功能', async () => {
    // 获取初始字段顺序
    const initialFields = await page.locator('.data-table tbody tr td:nth-child(2)').allTextContents()

    // 如果有排序功能，测试排序
    const sortBtn = page.locator('th:has-text("字段名称") .sort-btn')
    if (await sortBtn.count() > 0) {
      await sortBtn.click()
      await page.waitForTimeout(500)

      // 获取排序后的字段顺序
      const sortedFields = await page.locator('.data-table tbody tr td:nth-child(2)').allTextContents()

      // 验证顺序发生变化
      expect(sortedFields).not.toEqual(initialFields)
    }
  })

  test('数据库同步验证 - 页面刷新后数据持久化', async () => {
    // 添加一个新字段
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入字段名称"]', '持久化测试字段')
    await page.selectOption('select', '文本')
    await page.fill('textarea[placeholder="请输入字段别名"]', '持久化别名')

    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证字段添加成功
    await expect(page.locator('.data-table tbody tr:has-text("持久化测试字段")')).toBeVisible()

    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 导航回字段管理页面
    await page.goto('/#/field-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 验证字段仍然存在（数据持久化）
    await expect(page.locator('.data-table tbody tr:has-text("持久化测试字段")')).toBeVisible()
  })

  test('字段导出功能', async () => {
    // 点击导出按钮
    await page.click('button:has-text("导出字段")')
    await page.waitForTimeout(2000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 验证消息包含导出路径信息
    const successMessage = page.locator('.el-message--success')
    await expect(successMessage).toContainText('导出成功')
  })

  test('表单验证功能', async () => {
    // 打开新增字段模态窗口
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)

    // 不填写任何信息直接保存
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(500)

    // 验证错误消息
    await expect(page.locator('.el-message--error')).toBeVisible()
    await expect(page.locator('.el-message--error')).toContainText('请填写字段名称和类型')

    // 只填写字段名称
    await page.fill('input[placeholder="请输入字段名称"]', '测试字段')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(500)

    // 验证仍然有错误消息
    await expect(page.locator('.el-message--error')).toBeVisible()

    // 填写完整信息
    await page.selectOption('select', '文本')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证成功保存
    await expect(page.locator('.el-message--success')).toBeVisible()
  })

  test('字段统计信息更新', async () => {
    // 获取初始统计信息
    const initialStats = await page.locator('.page-stats').textContent()

    // 添加新字段
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入字段名称"]', '统计测试字段')
    await page.selectOption('select', '文本')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 获取更新后的统计信息
    const updatedStats = await page.locator('.page-stats').textContent()

    // 验证统计信息发生变化
    expect(updatedStats).not.toBe(initialStats)
  })

  test('采购字段标签页功能完整性', async () => {
    // 切换到采购字段标签页
    await page.click('.tab-btn:has-text("采购字段")')
    await page.waitForTimeout(500)

    // 验证采购字段数据加载
    const procurementRows = page.locator('.data-table tbody tr')
    await expect(procurementRows).toHaveCountGreaterThan(0)

    // 测试采购字段的新增功能
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入字段名称"]', '采购测试字段')
    await page.selectOption('select', '金额')
    await page.fill('textarea[placeholder="请输入字段别名"]', '采购别名')

    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证采购字段添加成功
    await expect(page.locator('.data-table tbody tr:has-text("采购测试字段")')).toBeVisible()
  })
})
