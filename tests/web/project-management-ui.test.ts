import { test, expect } from '@playwright/test'

/**
 * 项目管理UI测试 - Web环境
 * 用于快速验证UI组件和交互逻辑，使用模拟数据
 * 注意：此测试运行在Web环境中，不能完全代表Electron生产环境
 */

test.describe('项目管理UI测试 (Web环境)', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到项目管理页面
    await page.goto('/#/project-management')
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded')
    
    // 等待Vue应用初始化
    await page.waitForSelector('[data-testid="app-container"], .main-content', { timeout: 10000 })
  })

  test('页面基本元素渲染', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/采购合同管理系统/)
    
    // 验证主要布局元素
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.main-content')).toBeVisible()
    
    // 验证项目管理页面标题
    await expect(page.locator('h1, .page-title')).toContainText('项目管理')
  })

  test('项目列表表格渲染', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 })
    
    // 验证表格存在
    await expect(page.locator('.el-table')).toBeVisible()
    
    // 验证表格列标题
    const expectedColumns = ['项目编号', '项目名称', '项目别名', '合同数', '采购数', '描述', '创建时间', '更新时间', '操作']
    
    for (const column of expectedColumns) {
      await expect(page.locator(`.el-table th:has-text("${column}")`)).toBeVisible()
    }
  })

  test('新建项目对话框UI', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")')
    
    // 验证对话框打开
    await expect(page.locator('.el-dialog')).toBeVisible()
    await expect(page.locator('.el-dialog__title:has-text("新建项目")')).toBeVisible()
    
    // 验证表单字段
    await expect(page.locator('input[placeholder*="项目编号"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="项目名称"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="项目别名"]')).toBeVisible()
    await expect(page.locator('textarea[placeholder*="项目描述"]')).toBeVisible()
    
    // 验证按钮
    await expect(page.locator('button:has-text("取消")')).toBeVisible()
    await expect(page.locator('button:has-text("创建")')).toBeVisible()
    
    // 关闭对话框
    await page.click('button:has-text("取消")')
    await expect(page.locator('.el-dialog')).not.toBeVisible()
  })

  test('表单验证UI反馈', async ({ page }) => {
    // 打开新建项目对话框
    await page.click('button:has-text("新建项目")')
    
    // 尝试提交空表单
    await page.click('button:has-text("创建")')
    
    // 验证必填字段错误提示
    await expect(page.locator('.el-form-item__error')).toBeVisible()
    
    // 填写无效的项目编号
    await page.fill('input[placeholder*="项目编号"]', '无效编号@#$')
    await page.click('input[placeholder*="项目名称"]') // 触发验证
    
    // 验证格式错误提示
    await expect(page.locator('.el-form-item__error')).toBeVisible()
  })

  test('编辑项目对话框UI', async ({ page }) => {
    // 等待数据加载
    await page.waitForSelector('.el-table tbody tr', { timeout: 10000 })
    
    // 检查是否有数据行
    const rowCount = await page.locator('.el-table tbody tr').count()
    
    if (rowCount > 0) {
      // 点击第一行的编辑按钮
      await page.click('.el-table tbody tr:first-child button:has-text("编辑")')
      
      // 验证编辑对话框打开
      await expect(page.locator('.el-dialog')).toBeVisible()
      await expect(page.locator('.el-dialog__title:has-text("编辑项目")')).toBeVisible()
      
      // 验证项目编号字段可编辑（这是我们修复的功能）
      const projectCodeInput = page.locator('input[placeholder*="项目编号"]')
      await expect(projectCodeInput).toBeVisible()
      await expect(projectCodeInput).toBeEnabled()
      
      // 验证字段有预填值
      await expect(projectCodeInput).not.toHaveValue('')
      
      // 验证更新按钮存在
      await expect(page.locator('button:has-text("更新")')).toBeVisible()
      
      // 关闭对话框
      await page.click('button:has-text("取消")')
      await expect(page.locator('.el-dialog')).not.toBeVisible()
    } else {
      console.log('没有数据行，跳过编辑测试')
    }
  })

  test('表格横向滚动UI', async ({ page }) => {
    // 验证表格容器存在
    await expect(page.locator('.table-scroll-container, .table-container')).toBeVisible()
    
    // 验证表格存在
    await expect(page.locator('.el-table')).toBeVisible()
    
    // 检查表格是否需要横向滚动
    const tableContainer = page.locator('.table-scroll-container, .table-container').first()
    const table = page.locator('.el-table').first()
    
    const containerWidth = await tableContainer.evaluate(el => el.clientWidth)
    const tableWidth = await table.evaluate(el => el.scrollWidth)
    
    console.log(`容器宽度: ${containerWidth}px, 表格宽度: ${tableWidth}px`)
    
    // 如果表格宽度大于容器宽度，验证滚动功能
    if (tableWidth > containerWidth) {
      // 验证可以滚动
      await tableContainer.evaluate(el => {
        el.scrollLeft = 100
      })
      
      const scrollLeft = await tableContainer.evaluate(el => el.scrollLeft)
      expect(scrollLeft).toBeGreaterThan(0)
      
      console.log('✅ 表格横向滚动功能正常')
    } else {
      console.log('ℹ️ 表格宽度未超出容器，无需滚动')
    }
  })

  test('搜索框UI交互', async ({ page }) => {
    // 查找搜索输入框
    const searchInput = page.locator('input[placeholder*="搜索"], .search-input input')
    
    if (await searchInput.count() > 0) {
      // 验证搜索框可见
      await expect(searchInput.first()).toBeVisible()
      
      // 测试输入
      await searchInput.first().fill('测试搜索')
      await expect(searchInput.first()).toHaveValue('测试搜索')
      
      // 清除搜索
      await searchInput.first().clear()
      await expect(searchInput.first()).toHaveValue('')
    } else {
      console.log('ℹ️ 未找到搜索输入框')
    }
  })

  test('操作按钮状态', async ({ page }) => {
    // 验证主要操作按钮
    await expect(page.locator('button:has-text("新建项目")')).toBeVisible()
    await expect(page.locator('button:has-text("新建项目")')).toBeEnabled()
    
    // 验证刷新按钮
    const refreshButton = page.locator('button:has-text("刷新"), .refresh-btn')
    if (await refreshButton.count() > 0) {
      await expect(refreshButton.first()).toBeVisible()
      await expect(refreshButton.first()).toBeEnabled()
    }
    
    // 验证表格行操作按钮
    const tableRows = page.locator('.el-table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      const firstRow = tableRows.first()
      await expect(firstRow.locator('button:has-text("编辑")')).toBeVisible()
      await expect(firstRow.locator('button:has-text("删除")')).toBeVisible()
    }
  })

  test('响应式布局检查', async ({ page }) => {
    // 获取当前视口大小
    const viewportSize = page.viewportSize()
    console.log(`当前视口大小: ${viewportSize?.width}x${viewportSize?.height}`)
    
    // 验证在当前视口下的布局
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.main-content')).toBeVisible()
    
    // 验证表格在当前视口下可见
    await expect(page.locator('.el-table')).toBeVisible()
    
    // 注意：根据用户要求，我们专注于桌面端，不测试移动端响应式
  })

  test('页面加载性能检查', async ({ page }) => {
    const startTime = Date.now()
    
    // 重新加载页面
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.el-table', { timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    console.log(`页面加载时间: ${loadTime}ms`)
    
    // 验证加载时间在合理范围内（开发环境可能较慢）
    expect(loadTime).toBeLessThan(10000) // 10秒内加载完成
  })
})
