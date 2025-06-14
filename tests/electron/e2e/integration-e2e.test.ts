/**
 * 字段管理和项目管理模块集成测试
 * 测试模块间的数据同步和交互功能
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

test.describe('模块集成 E2E 测试', () => {
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

  test('应用启动和导航功能', async () => {
    // 验证应用成功启动
    await expect(page).toHaveTitle(/采购合同管理系统/)

    // 验证左侧导航栏
    await expect(page.locator('.sidebar')).toBeVisible()

    // 测试导航到字段管理
    await page.click('a[href="#/field-management"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.locator('.page-title')).toContainText('字段管理')

    // 测试导航到项目管理
    await page.click('a[href="#/project-management"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.locator('.page-title')).toContainText('项目管理')

    // 测试导航到数据导入
    await page.click('a[href="#/data-import"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.locator('.page-title')).toContainText('数据导入')

    // 测试导航到合同管理
    await page.click('a[href="#/contract-management"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.locator('.page-title')).toContainText('合同管理')
  })

  test('数据库连接和基础数据验证', async () => {
    // 导航到项目管理页面
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 验证数据表格加载
    await expect(page.locator('.data-table')).toBeVisible()

    // 创建测试项目验证数据库写入
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'DB_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '数据库测试项目')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证项目创建成功
    await expect(page.locator('.el-message--success')).toBeVisible()
    await expect(page.locator('.data-table tbody tr:has-text("DB_TEST_001")')).toBeVisible()
  })

  test('字段管理和项目管理数据一致性', async () => {
    // 在字段管理中添加项目相关字段
    await page.goto('/#/field-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 添加项目编号字段
    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入字段名称"]', '项目编号')
    await page.selectOption('select', '文本')
    await page.fill('textarea[placeholder="请输入字段别名"]', '项目号, 工程编号')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证字段添加成功
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 切换到项目管理验证数据独立性
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 验证项目管理功能正常
    await expect(page.locator('.data-table')).toBeVisible()
    await expect(page.locator('button:has-text("新建项目")')).toBeVisible()
  })

  test('跨模块数据持久化验证', async () => {
    // 在项目管理中创建项目
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'CROSS_TEST_001')
    await page.fill('input[placeholder="请输入项目名称"]', '跨模块测试项目')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 在字段管理中添加字段
    await page.goto('/#/field-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.click('button:has-text("新增字段")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入字段名称"]', '跨模块测试字段')
    await page.selectOption('select', '文本')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 刷新应用验证数据持久化
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 验证项目数据仍然存在
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.locator('.data-table tbody tr:has-text("CROSS_TEST_001")')).toBeVisible()

    // 验证字段数据仍然存在
    await page.goto('/#/field-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.locator('.data-table tbody tr:has-text("跨模块测试字段")')).toBeVisible()
  })

  test('错误处理和恢复机制', async () => {
    // 测试无效数据输入
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    // 输入无效的项目编号（空格）
    await page.fill('input[placeholder="请输入项目编号"]', '   ')
    await page.fill('input[placeholder="请输入项目名称"]', '错误测试项目')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证错误处理
    await expect(page.locator('.el-message--error')).toBeVisible()

    // 修正数据
    await page.fill('input[placeholder="请输入项目编号"]', 'ERROR_TEST_001')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 验证恢复成功
    await expect(page.locator('.el-message--success')).toBeVisible()
  })

  test('界面响应性和用户体验', async () => {
    // 测试快速操作响应
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 测试搜索响应速度
    const startTime = Date.now()
    await page.fill('.search-input', 'TEST')
    await page.waitForTimeout(500)
    const searchTime = Date.now() - startTime

    // 验证搜索响应时间合理（应该小于1秒）
    expect(searchTime).toBeLessThan(1000)

    // 测试页面切换响应速度
    const navStartTime = Date.now()
    await page.goto('/#/field-management')
    await page.waitForLoadState('networkidle')
    const navTime = Date.now() - navStartTime

    // 验证页面切换时间合理（应该小于3秒）
    expect(navTime).toBeLessThan(3000)
  })

  test('内存泄漏和性能验证', async () => {
    // 执行多次操作验证内存稳定性
    for (let i = 0; i < 5; i++) {
      // 切换页面
      await page.goto('/#/project-management')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await page.goto('/#/field-management')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // 执行操作
      await page.fill('.search-input', `test${i}`)
      await page.waitForTimeout(200)
      await page.fill('.search-input', '')
      await page.waitForTimeout(200)
    }

    // 验证应用仍然响应正常
    await expect(page.locator('.page-title')).toBeVisible()
    await expect(page.locator('.data-table')).toBeVisible()
  })

  test('数据导出功能集成测试', async () => {
    // 确保有数据可以导出
    await page.goto('/#/project-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 创建测试数据
    await page.click('button:has-text("新建项目")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="请输入项目编号"]', 'EXPORT_INTEGRATION_001')
    await page.fill('input[placeholder="请输入项目名称"]', '导出集成测试')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)

    // 测试项目导出
    await page.click('button:has-text("导出")')
    await page.waitForTimeout(2000)
    await expect(page.locator('.el-message--success')).toBeVisible()

    // 测试字段导出
    await page.goto('/#/field-management')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.click('button:has-text("导出字段")')
    await page.waitForTimeout(2000)
    await expect(page.locator('.el-message--success')).toBeVisible()
  })
})
