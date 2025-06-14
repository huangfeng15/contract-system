/**
 * 项目管理模块端到端测试
 * 在Electron环境下测试项目管理的完整功能
 */

import { test, expect, Page, ElectronApplication } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let electronApp: ElectronApplication
let page: Page

test.describe('项目管理模块 E2E 测试', () => {
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
    // 导航到项目管理页面
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('页面基础元素渲染正确', async () => {
    // 验证页面标题
    await expect(page.locator('.page-title')).toContainText('项目管理')

    // 验证统计信息显示
    await expect(page.locator('.page-stats')).toBeVisible()
    await expect(page.locator('.page-stats')).toContainText('总项目')
    await expect(page.locator('.page-stats')).toContainText('已关联')
    await expect(page.locator('.page-stats')).toContainText('未关联')

    // 验证操作工具栏
    await expect(page.locator('button:has-text("新建项目")')).toBeVisible()
    await expect(page.locator('button:has-text("刷新")')).toBeVisible()
    await expect(page.locator('button:has-text("导出")')).toBeVisible()

    // 验证搜索框
    await expect(page.locator('.search-input')).toBeVisible()
    await expect(page.locator('.search-input')).toHaveAttribute('placeholder', '搜索项目编号/名称/别名')

    // 验证数据表格
    await expect(page.locator('.data-table')).toBeVisible()
    await expect(page.locator('th:has-text("序号")')).toBeVisible()
    await expect(page.locator('th:has-text("项目编号")')).toBeVisible()
    await expect(page.locator('th:has-text("项目名称")')).toBeVisible()
    await expect(page.locator('th:has-text("项目别名")')).toBeVisible()
    await expect(page.locator('th:has-text("合同数")')).toBeVisible()
    await expect(page.locator('th:has-text("采购数")')).toBeVisible()
    await expect(page.locator('th:has-text("创建时间")')).toBeVisible()
    await expect(page.locator('th:has-text("操作")')).toBeVisible()
  })

  test('项目搜索功能', async () => {
    // 先创建一个测试项目
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'SEARCH_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '搜索测试项目')
    await page.fill('input[placeholder="请输入项目别名"]', '搜索别名')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 测试按项目编号搜索
    await page.fill('.search-input', 'SEARCH_TEST_001')
    await page.waitForTimeout(500)

    const searchResults = page.locator('.data-table tbody tr:visible')
    await expect(searchResults).toHaveCount(1)
    await expect(searchResults.first()).toContainText('SEARCH_TEST_001')

    // 测试按项目名称搜索
    await page.fill('.search-input', '搜索测试项目')
    await page.waitForTimeout(500)

    await expect(searchResults).toHaveCount(1)
    await expect(searchResults.first()).toContainText('搜索测试项目')

    // 测试按别名搜索
    await page.fill('.search-input', '搜索别名')
    await page.waitForTimeout(500)

    await expect(searchResults).toHaveCount(1)
    await expect(searchResults.first()).toContainText('搜索别名')

    // 清空搜索
    await page.fill('.search-input', '')
    await page.waitForTimeout(500)

    // 验证显示所有项目
    const allRows = page.locator('.data-table tbody tr')
    await expect(allRows).toHaveCountGreaterThan(0)
  })

  test('新建项目功能', async () => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    // 验证模态窗口打开
    await expect(page.locator('.project-modal')).toBeVisible()
    await expect(page.locator('.modal-title:has-text("新建项目")')).toBeVisible()

    // 填写项目信息
    await page.fill('input[placeholder="请输入项目编号"]', 'TEST_PROJECT_001')
    await page.fill('input[placeholder="请输入项目名称"]', '测试项目一')
    await page.fill('input[placeholder="请输入项目别名"]', '测试别名1, 测试别名2')
    await page.fill('textarea[placeholder="请输入项目描述"]', '这是一个测试项目')

    // 保存项目
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()
    await expect(page.locator('.el-message--success')).toContainText('项目创建成功')

    // 验证模态窗口关闭
    await expect(page.locator('.project-modal')).not.toBeVisible()

    // 验证新项目出现在列表中
    await expect(page.locator('.data-table tbody tr:has-text("TEST_PROJECT_001")')).toBeVisible()
    await expect(page.locator('.data-table tbody tr:has-text("测试项目一")')).toBeVisible()
  })

  test('编辑项目功能', async () => {
    // 先确保有项目可以编辑
    const firstEditBtn = page.locator('.data-table tbody tr:first-child button:has-text("编辑")')
    await expect(firstEditBtn).toBeVisible()

    // 点击编辑按钮
    await firstEditBtn.click()
    await page.waitForTimeout(500)

    // 验证模态窗口打开并预填充数据
    await expect(page.locator('.project-modal')).toBeVisible()
    await expect(page.locator('.modal-title:has-text("编辑项目")')).toBeVisible()

    // 修改项目名称
    const nameInput = page.locator('input[placeholder="请输入项目名称"]')
    await expect(nameInput).not.toHaveValue('')
    await nameInput.fill('修改后的项目名称')

    // 保存修改
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()
    await expect(page.locator('.el-message--success')).toContainText('项目更新成功')

    // 验证模态窗口关闭
    await expect(page.locator('.project-modal')).not.toBeVisible()

    // 验证项目名称已更新
    await expect(page.locator('.data-table tbody tr:has-text("修改后的项目名称")')).toBeVisible()
  })

  test('查看项目详情功能', async () => {
    // 点击第一行的详情按钮
    const firstDetailBtn = page.locator('.data-table tbody tr:first-child button:has-text("详情")')
    await expect(firstDetailBtn).toBeVisible()
    await firstDetailBtn.click()
    await page.waitForTimeout(500)

    // 验证详情模态窗口打开
    await expect(page.locator('.view-modal')).toBeVisible()
    await expect(page.locator('.modal-title:has-text("项目详情")')).toBeVisible()

    // 验证详情信息显示
    await expect(page.locator('.detail-item:has-text("项目编号")')).toBeVisible()
    await expect(page.locator('.detail-item:has-text("项目名称")')).toBeVisible()
    await expect(page.locator('.detail-item:has-text("项目别名")')).toBeVisible()
    await expect(page.locator('.detail-item:has-text("项目描述")')).toBeVisible()

    // 关闭详情窗口
    await page.click('button:has-text("关闭")')
    await page.waitForTimeout(500)

    // 验证详情窗口关闭
    await expect(page.locator('.view-modal')).not.toBeVisible()
  })

  test('删除项目功能', async () => {
    // 先创建一个测试项目用于删除
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'DELETE_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '待删除项目')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 获取删除前的行数
    const initialRowCount = await page.locator('.data-table tbody tr').count()

    // 找到待删除项目的删除按钮
    const deleteRow = page.locator('.data-table tbody tr:has-text("DELETE_TEST_001")')
    const deleteBtn = deleteRow.locator('button:has-text("删除")')
    await expect(deleteBtn).toBeVisible()
    await deleteBtn.click()
    await page.waitForTimeout(500)

    // 验证确认对话框
    await expect(page.locator('.el-message-box')).toBeVisible()
    await expect(page.locator('.el-message-box')).toContainText('确认删除')

    // 确认删除
    await page.click('.el-message-box button:has-text("确定")')
    await page.waitForTimeout(1000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()
    await expect(page.locator('.el-message--success')).toContainText('项目删除成功')

    // 验证项目已从列表中移除
    await expect(page.locator('.data-table tbody tr:has-text("DELETE_TEST_001")')).not.toBeVisible()

    // 验证行数减少
    const finalRowCount = await page.locator('.data-table tbody tr').count()
    expect(finalRowCount).toBe(initialRowCount - 1)
  })

  test('项目别名多值输入功能', async () => {
    // 创建项目测试多个别名
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'ALIAS_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '别名测试项目')
    await page.fill('input[placeholder="请输入项目别名"]', '别名1, 别名2, 别名3')

    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证项目创建成功
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 验证别名显示
    const aliasRow = page.locator('.data-table tbody tr:has-text("ALIAS_TEST_001")')
    await expect(aliasRow).toContainText('别名1, 别名2, 别名3')
  })

  test('数据库持久化验证 - 项目删除后刷新页面确认真正删除', async () => {
    // 创建一个测试项目
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'PERSIST_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '持久化测试项目')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证项目创建成功
    await expect(page.locator('.data-table tbody tr:has-text("PERSIST_TEST_001")')).toBeVisible()

    // 删除项目
    const deleteRow = page.locator('.data-table tbody tr:has-text("PERSIST_TEST_001")')
    const deleteBtn = deleteRow.locator('button:has-text("删除")')
    await deleteBtn.click()
    await page.waitForTimeout(500)

    // 确认删除
    await page.click('.el-message-box button:has-text("确定")')
    await page.waitForTimeout(1000)

    // 验证项目从界面消失
    await expect(page.locator('.data-table tbody tr:has-text("PERSIST_TEST_001")')).not.toBeVisible()

    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 导航回项目管理页面
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 验证项目确实被删除（数据库持久化生效）
    await expect(page.locator('.data-table tbody tr:has-text("PERSIST_TEST_001")')).not.toBeVisible()
  })

  test('数据库持久化验证 - 项目创建后刷新页面数据仍存在', async () => {
    // 创建一个测试项目
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'PERSIST_CREATE_001')
    await page.fill('input[placeholder="请输入项目名称"]', '持久化创建测试')
    await page.fill('input[placeholder="请输入项目别名"]', '持久化别名')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证项目创建成功
    await expect(page.locator('.data-table tbody tr:has-text("PERSIST_CREATE_001")')).toBeVisible()

    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 导航回项目管理页面
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 验证项目仍然存在（数据持久化生效）
    await expect(page.locator('.data-table tbody tr:has-text("PERSIST_CREATE_001")')).toBeVisible()
    await expect(page.locator('.data-table tbody tr:has-text("持久化创建测试")')).toBeVisible()
    await expect(page.locator('.data-table tbody tr:has-text("持久化别名")')).toBeVisible()
  })

  test('项目统计信息显示和更新', async () => {
    // 获取初始统计信息
    const initialStats = await page.locator('.page-stats').textContent()
    console.log('初始统计信息:', initialStats)

    // 创建新项目
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'STATS_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '统计测试项目')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 获取更新后的统计信息
    const updatedStats = await page.locator('.page-stats').textContent()
    console.log('更新后统计信息:', updatedStats)

    // 验证统计信息发生变化
    expect(updatedStats).not.toBe(initialStats)

    // 验证统计信息包含正确的数字格式
    expect(updatedStats).toMatch(/总项目\s+\d+/)
    expect(updatedStats).toMatch(/已关联\s+\d+/)
    expect(updatedStats).toMatch(/未关联\s+\d+/)
  })

  test('刷新功能', async () => {
    // 点击刷新按钮
    await page.click('button:has-text("刷新")')
    await page.waitForTimeout(1000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()
    await expect(page.locator('.el-message--success')).toContainText('项目数据刷新成功')

    // 验证数据表格仍然可见
    await expect(page.locator('.data-table')).toBeVisible()
  })

  test('导出功能', async () => {
    // 确保有数据可以导出
    const rowCount = await page.locator('.data-table tbody tr').count()
    if (rowCount === 0) {
      // 如果没有数据，先创建一个项目
      await page.click('button:has-text("新建项目")')
      await page.waitForTimeout(500)

      await page.fill('input[placeholder="请输入项目编号"]', 'EXPORT_TEST_001')
      await page.fill('input[placeholder="请输入项目名称"]', '导出测试项目')
      await page.click('button:has-text("保存")')
      await page.waitForTimeout(1000)
    }

    // 点击导出按钮
    await page.click('button:has-text("导出")')
    await page.waitForTimeout(2000)

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible()
    await expect(page.locator('.el-message--success')).toContainText('导出成功')
  })

  test('表单验证功能', async () => {
    // 打开新建项目模态窗口
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    // 不填写任何信息直接保存
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(500)

    // 验证错误消息
    await expect(page.locator('.el-message--error')).toBeVisible()

    // 只填写项目编号
    await page.fill('input[placeholder="请输入项目编号"]', 'VALIDATION_TEST')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(500)

    // 验证仍然有错误消息
    await expect(page.locator('.el-message--error')).toBeVisible()

    // 填写完整的必需信息
    await page.fill('input[placeholder="请输入项目名称"]', '验证测试项目')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证成功保存
    await expect(page.locator('.el-message--success')).toBeVisible()
  })

  test('项目编号唯一性验证', async () => {
    // 创建第一个项目
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'UNIQUE_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '唯一性测试项目1')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证第一个项目创建成功
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 尝试创建相同编号的项目
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'UNIQUE_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '唯一性测试项目2')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证错误消息
    await expect(page.locator('.el-message--error')).toBeVisible()
    await expect(page.locator('.el-message--error')).toContainText('已存在')
  })

  test('模态窗口关闭功能', async () => {
    // 测试新建项目模态窗口关闭
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)
    await expect(page.locator('.project-modal')).toBeVisible()

    // 点击取消按钮
    await page.click('button:has-text("取消")')
    await page.waitForTimeout(500)
    await expect(page.locator('.project-modal')).not.toBeVisible()

    // 再次打开并点击关闭按钮
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)
    await expect(page.locator('.project-modal')).toBeVisible()

    await page.click('.modal-close')
    await page.waitForTimeout(500)
    await expect(page.locator('.project-modal')).not.toBeVisible()
  })
})
