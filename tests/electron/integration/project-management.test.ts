import { test, expect, createTestUtils } from '../fixtures/electron-test'

/**
 * 项目管理模块集成测试 - Electron环境
 * 测试项目管理功能在真实Electron环境中的API集成和数据库操作
 */

test.describe('项目管理模块集成测试', () => {
  test.beforeEach(async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 等待应用完全加载
    await utils.waitForAppReady()
    
    // 导航到项目管理页面
    await utils.navigateToPage('/project-management')
    
    // 等待数据加载完成
    await utils.waitForDataLoaded()
  })

  test('应用启动和页面加载', async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 验证应用标题
    await expect(page).toHaveTitle(/采购合同管理系统/)
    
    // 验证主要UI元素存在
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible()
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.main-content')).toBeVisible()
    
    // 验证项目管理页面加载
    await expect(page.locator('h1:has-text("项目管理")')).toBeVisible()
  })

  test('项目列表数据加载', async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 验证表格存在
    await expect(page.locator('.el-table')).toBeVisible()
    
    // 验证表格列标题
    await expect(page.locator('.el-table th:has-text("项目编号")')).toBeVisible()
    await expect(page.locator('.el-table th:has-text("项目名称")')).toBeVisible()
    await expect(page.locator('.el-table th:has-text("项目别名")')).toBeVisible()
    
    // 验证数据行存在（如果有数据）
    const tableRows = page.locator('.el-table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      // 验证第一行数据
      await expect(tableRows.first()).toBeVisible()
      await expect(tableRows.first().locator('td').first()).toContainText(/\w+/)
    }
  })

  test('创建新项目功能', async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")')
    
    // 验证对话框打开
    await expect(page.locator('.el-dialog:has-text("新建项目")')).toBeVisible()
    
    // 填写项目信息
    const projectCode = `TEST_${Date.now()}`
    await page.fill('input[placeholder*="项目编号"]', projectCode)
    await page.fill('input[placeholder*="项目名称"]', '集成测试项目')
    await page.fill('input[placeholder*="项目别名"]', '测试别名')
    await page.fill('textarea[placeholder*="项目描述"]', '这是一个集成测试项目')
    
    // 提交表单
    await page.click('button:has-text("创建")')
    
    // 等待成功通知
    await utils.waitForNotification('项目创建成功')
    
    // 验证对话框关闭
    await expect(page.locator('.el-dialog:has-text("新建项目")')).not.toBeVisible()
    
    // 验证新项目出现在列表中
    await utils.waitForDataLoaded()
    await expect(page.locator(`.el-table tbody tr:has-text("${projectCode}")`)).toBeVisible()
  })

  test('编辑项目功能', async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 首先创建一个测试项目
    await page.click('button:has-text("新建项目")')
    const originalCode = `EDIT_TEST_${Date.now()}`
    await page.fill('input[placeholder*="项目编号"]', originalCode)
    await page.fill('input[placeholder*="项目名称"]', '待编辑项目')
    await page.click('button:has-text("创建")')
    await utils.waitForNotification('项目创建成功')
    await utils.waitForDataLoaded()
    
    // 点击编辑按钮
    const projectRow = page.locator(`.el-table tbody tr:has-text("${originalCode}")`)
    await projectRow.locator('button:has-text("编辑")').click()
    
    // 验证编辑对话框打开
    await expect(page.locator('.el-dialog:has-text("编辑项目")')).toBeVisible()
    
    // 验证项目编号字段可编辑（这是我们修复的功能）
    const projectCodeInput = page.locator('input[placeholder*="项目编号"]')
    await expect(projectCodeInput).toBeEnabled()
    await expect(projectCodeInput).toHaveValue(originalCode)
    
    // 修改项目编号和名称
    const newCode = `MODIFIED_${Date.now()}`
    await projectCodeInput.clear()
    await projectCodeInput.fill(newCode)
    await page.fill('input[placeholder*="项目名称"]', '已修改的项目')
    
    // 提交修改
    await page.click('button:has-text("更新")')
    
    // 等待成功通知
    await utils.waitForNotification('项目更新成功')
    
    // 验证修改后的项目出现在列表中
    await utils.waitForDataLoaded()
    await expect(page.locator(`.el-table tbody tr:has-text("${newCode}")`)).toBeVisible()
    await expect(page.locator(`.el-table tbody tr:has-text("已修改的项目")`)).toBeVisible()
    
    // 验证原项目编号不再存在
    await expect(page.locator(`.el-table tbody tr:has-text("${originalCode}")`)).not.toBeVisible()
  })

  test('项目编号唯一性验证', async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 创建第一个项目
    await page.click('button:has-text("新建项目")')
    const duplicateCode = `UNIQUE_TEST_${Date.now()}`
    await page.fill('input[placeholder*="项目编号"]', duplicateCode)
    await page.fill('input[placeholder*="项目名称"]', '唯一性测试项目1')
    await page.click('button:has-text("创建")')
    await utils.waitForNotification('项目创建成功')
    await utils.waitForDataLoaded()
    
    // 尝试创建相同项目编号的项目
    await page.click('button:has-text("新建项目")')
    await page.fill('input[placeholder*="项目编号"]', duplicateCode)
    await page.fill('input[placeholder*="项目名称"]', '唯一性测试项目2')
    
    // 触发验证（失去焦点）
    await page.click('input[placeholder*="项目名称"]')
    
    // 验证错误提示
    await expect(page.locator('.el-form-item__error:has-text("项目编号已存在")')).toBeVisible()
    
    // 验证创建按钮被禁用或创建失败
    const createButton = page.locator('button:has-text("创建")')
    await createButton.click()
    
    // 应该没有成功通知，对话框仍然打开
    await expect(page.locator('.el-dialog:has-text("新建项目")')).toBeVisible()
  })

  test('表格横向滚动功能', async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 验证表格容器存在
    const tableContainer = page.locator('.table-scroll-container')
    await expect(tableContainer).toBeVisible()
    
    // 验证表格宽度超出容器（需要滚动）
    const containerWidth = await tableContainer.evaluate(el => el.clientWidth)
    const tableWidth = await page.locator('.el-table').evaluate(el => el.scrollWidth)
    
    // 如果表格宽度大于容器宽度，应该有横向滚动
    if (tableWidth > containerWidth) {
      // 验证可以横向滚动
      await tableContainer.evaluate(el => {
        el.scrollLeft = 100
      })
      
      const scrollLeft = await tableContainer.evaluate(el => el.scrollLeft)
      expect(scrollLeft).toBeGreaterThan(0)
    }
  })

  test('搜索和筛选功能', async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 创建测试数据
    const testProjects = [
      { code: `SEARCH_A_${Date.now()}`, name: '搜索测试项目A' },
      { code: `SEARCH_B_${Date.now()}`, name: '搜索测试项目B' }
    ]
    
    for (const project of testProjects) {
      await page.click('button:has-text("新建项目")')
      await page.fill('input[placeholder*="项目编号"]', project.code)
      await page.fill('input[placeholder*="项目名称"]', project.name)
      await page.click('button:has-text("创建")')
      await utils.waitForNotification('项目创建成功')
      await utils.waitForDataLoaded()
    }
    
    // 测试搜索功能
    const searchInput = page.locator('input[placeholder*="搜索"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('SEARCH_A')
      await utils.waitForDataLoaded()
      
      // 验证搜索结果
      await expect(page.locator(`.el-table tbody tr:has-text("SEARCH_A")`)).toBeVisible()
      await expect(page.locator(`.el-table tbody tr:has-text("SEARCH_B")`)).not.toBeVisible()
      
      // 清除搜索
      await searchInput.clear()
      await utils.waitForDataLoaded()
      
      // 验证所有项目重新显示
      await expect(page.locator(`.el-table tbody tr:has-text("SEARCH_A")`)).toBeVisible()
      await expect(page.locator(`.el-table tbody tr:has-text("SEARCH_B")`)).toBeVisible()
    }
  })

  test.afterEach(async ({ page, electronApp }) => {
    const utils = createTestUtils(page, electronApp)
    
    // 关闭所有通知
    await utils.closeAllNotifications()
    
    // 清理测试数据
    await utils.cleanupTestData()
  })
})
