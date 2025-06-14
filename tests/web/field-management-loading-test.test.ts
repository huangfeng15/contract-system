import { test, expect } from '@playwright/test'

test.describe('字段管理页面加载测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('字段管理页面能够正常加载', async ({ page }) => {
    console.log('测试字段管理页面加载...')
    
    // 点击字段管理菜单
    const fieldManagementLink = page.locator('text=字段管理').first()
    await expect(fieldManagementLink).toBeVisible({ timeout: 10000 })
    
    console.log('找到字段管理菜单，准备点击...')
    await fieldManagementLink.click()
    
    // 等待页面加载
    await page.waitForTimeout(3000)
    
    // 验证页面标题
    const pageTitle = page.locator('.page-title')
    await expect(pageTitle).toBeVisible({ timeout: 15000 })
    const titleText = await pageTitle.textContent()
    console.log(`页面标题: ${titleText}`)
    expect(titleText).toContain('字段管理')
    
    // 验证标签页按钮
    const contractTab = page.locator('text=合同字段').first()
    await expect(contractTab).toBeVisible()
    
    const procurementTab = page.locator('text=采购字段').first()
    await expect(procurementTab).toBeVisible()
    
    // 验证操作工具栏
    const addButton = page.locator('text=新增字段').first()
    await expect(addButton).toBeVisible()
    
    const importButton = page.locator('text=导入字段').first()
    await expect(importButton).toBeVisible()
    
    const exportButton = page.locator('text=导出字段').first()
    await expect(exportButton).toBeVisible()
    
    // 验证搜索框
    const searchInput = page.locator('.search-input')
    await expect(searchInput).toBeVisible()
    
    // 验证表格区域
    const tableSection = page.locator('.table-section')
    await expect(tableSection).toBeVisible()
    
    const dataTable = page.locator('.data-table')
    await expect(dataTable).toBeVisible()
    
    console.log('✅ 字段管理页面加载成功')
  })

  test('字段管理页面滚动功能验证', async ({ page }) => {
    console.log('测试字段管理页面滚动功能...')
    
    // 导航到字段管理页面
    const fieldManagementLink = page.locator('text=字段管理').first()
    await fieldManagementLink.click()
    await page.waitForTimeout(2000)
    
    // 验证表格容器的滚动配置
    const tableSection = page.locator('.table-section')
    await expect(tableSection).toBeVisible()
    
    // 检查CSS属性
    const overflow = await tableSection.evaluate(el => 
      window.getComputedStyle(el).overflow
    )
    expect(overflow).toBe('auto')
    
    const maxHeight = await tableSection.evaluate(el => 
      window.getComputedStyle(el).maxHeight
    )
    console.log(`表格最大高度: ${maxHeight}`)
    expect(maxHeight).toContain('calc')
    
    // 验证表格有底部边距
    const marginBottom = await tableSection.evaluate(el => 
      window.getComputedStyle(el).marginBottom
    )
    console.log(`表格底部边距: ${marginBottom}`)
    expect(parseInt(marginBottom)).toBeGreaterThan(16)
    
    console.log('✅ 字段管理页面滚动功能验证通过')
  })

  test('标签页切换功能验证', async ({ page }) => {
    console.log('测试标签页切换功能...')
    
    // 导航到字段管理页面
    const fieldManagementLink = page.locator('text=字段管理').first()
    await fieldManagementLink.click()
    await page.waitForTimeout(2000)
    
    // 验证默认选中合同字段
    const contractTab = page.locator('.tab-btn').filter({ hasText: '合同字段' })
    await expect(contractTab).toHaveClass(/active/)
    
    // 点击采购字段标签
    const procurementTab = page.locator('.tab-btn').filter({ hasText: '采购字段' })
    await procurementTab.click()
    await page.waitForTimeout(1000)
    
    // 验证采购字段标签被选中
    await expect(procurementTab).toHaveClass(/active/)
    
    // 验证合同字段标签不再被选中
    await expect(contractTab).not.toHaveClass(/active/)
    
    console.log('✅ 标签页切换功能验证通过')
  })

  test('系统标题栏验证', async ({ page }) => {
    console.log('验证系统标题栏...')
    
    // 验证系统名称
    const appTitle = page.locator('.app-title')
    await expect(appTitle).toBeVisible()
    const titleText = await appTitle.textContent()
    console.log(`系统标题: ${titleText}`)
    expect(titleText).toBe('合同采购信息管理系统')
    
    // 验证主题切换按钮存在
    const themeToggle = page.locator('.theme-toggle')
    await expect(themeToggle).toBeVisible()
    
    // 验证版本信息存在
    const versionInfo = page.locator('.version-info')
    await expect(versionInfo).toBeVisible()
    
    // 验证窗口控制按钮已移除
    const windowControls = page.locator('.window-controls')
    await expect(windowControls).not.toBeVisible()
    
    console.log('✅ 系统标题栏验证通过')
  })
})
