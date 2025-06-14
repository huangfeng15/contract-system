import { test, expect } from '@playwright/test'

test.describe('UI修复最终验证测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('系统标题栏优化验证', async ({ page }) => {
    console.log('验证系统标题栏优化...')
    
    // 验证系统名称已更改为"合同采购信息管理系统"
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
    const versionText = await versionInfo.textContent()
    console.log(`版本信息: ${versionText}`)
    
    // 验证窗口控制按钮已移除
    const windowControls = page.locator('.window-controls')
    await expect(windowControls).not.toBeVisible()
    
    console.log('✅ 系统标题栏优化验证通过')
  })

  test('字段管理页面滚动功能验证', async ({ page }) => {
    console.log('验证字段管理页面滚动功能...')
    
    // 导航到字段管理页面
    const fieldManagementLink = page.locator('text=字段管理').first()
    await expect(fieldManagementLink).toBeVisible({ timeout: 10000 })
    await fieldManagementLink.click()
    
    // 等待页面加载
    await page.waitForSelector('.table-section', { timeout: 15000 })
    await page.waitForTimeout(1000)
    
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
    
    // 验证表格有底部边距
    const marginBottom = await tableSection.evaluate(el => 
      window.getComputedStyle(el).marginBottom
    )
    console.log(`表格底部边距: ${marginBottom}`)
    expect(parseInt(marginBottom)).toBeGreaterThan(16) // 应该大于16px
    
    // 验证数据表格有底部边距
    const dataTable = page.locator('.data-table')
    if (await dataTable.isVisible()) {
      const tableMarginBottom = await dataTable.evaluate(el => 
        window.getComputedStyle(el).marginBottom
      )
      console.log(`数据表格底部边距: ${tableMarginBottom}`)
      expect(parseInt(tableMarginBottom)).toBeGreaterThanOrEqual(20)
    }
    
    console.log('✅ 字段管理页面滚动功能验证通过')
  })

  test('操作按钮单行显示验证', async ({ page }) => {
    console.log('验证操作按钮单行显示...')
    
    // 测试项目管理页面
    const projectManagementLink = page.locator('text=项目管理').first()
    await expect(projectManagementLink).toBeVisible({ timeout: 10000 })
    await projectManagementLink.click()
    
    await page.waitForSelector('.data-table', { timeout: 15000 })
    await page.waitForTimeout(1000)
    
    // 检查项目管理页面的操作按钮
    const projectRows = page.locator('.data-table tbody tr')
    const projectRowCount = await projectRows.count()
    console.log(`项目管理页面找到 ${projectRowCount} 行数据`)
    
    if (projectRowCount > 0) {
      const firstRowActionButtons = projectRows.first().locator('.action-buttons')
      if (await firstRowActionButtons.isVisible()) {
        const buttons = firstRowActionButtons.locator('.btn-action')
        const buttonCount = await buttons.count()
        console.log(`项目管理页面找到 ${buttonCount} 个操作按钮`)
        
        if (buttonCount > 1) {
          const firstButton = buttons.first()
          const lastButton = buttons.last()
          
          const firstButtonBox = await firstButton.boundingBox()
          const lastButtonBox = await lastButton.boundingBox()
          
          if (firstButtonBox && lastButtonBox) {
            const yDifference = Math.abs(firstButtonBox.y - lastButtonBox.y)
            console.log(`项目管理按钮Y坐标差异: ${yDifference}px`)
            expect(yDifference).toBeLessThan(15)
          }
        }
      }
    }
    
    // 测试字段管理页面
    const fieldManagementLink = page.locator('text=字段管理').first()
    await fieldManagementLink.click()
    
    await page.waitForSelector('.data-table', { timeout: 15000 })
    await page.waitForTimeout(1000)
    
    const fieldRows = page.locator('.data-table tbody tr')
    const fieldRowCount = await fieldRows.count()
    console.log(`字段管理页面找到 ${fieldRowCount} 行数据`)
    
    if (fieldRowCount > 0) {
      const firstRowActionButtons = fieldRows.first().locator('.action-buttons')
      if (await firstRowActionButtons.isVisible()) {
        const buttons = firstRowActionButtons.locator('.btn-action')
        const buttonCount = await buttons.count()
        console.log(`字段管理页面找到 ${buttonCount} 个操作按钮`)
        
        if (buttonCount > 1) {
          const firstButton = buttons.first()
          const lastButton = buttons.last()
          
          const firstButtonBox = await firstButton.boundingBox()
          const lastButtonBox = await lastButton.boundingBox()
          
          if (firstButtonBox && lastButtonBox) {
            const yDifference = Math.abs(firstButtonBox.y - lastButtonBox.y)
            console.log(`字段管理按钮Y坐标差异: ${yDifference}px`)
            expect(yDifference).toBeLessThan(15)
          }
        }
      }
    }
    
    console.log('✅ 操作按钮单行显示验证通过')
  })

  test('整体UI一致性验证', async ({ page }) => {
    console.log('验证整体UI一致性...')
    
    // 验证标题栏布局
    const headerRight = page.locator('.header-right')
    await expect(headerRight).toBeVisible()
    
    // 验证标题栏右侧只包含主题切换和版本信息
    const headerRightChildren = await headerRight.locator('> *').count()
    console.log(`标题栏右侧元素数量: ${headerRightChildren}`)
    expect(headerRightChildren).toBeLessThanOrEqual(3) // 主题切换按钮 + 版本信息 + 可能的tooltip
    
    // 验证页面布局没有被破坏
    const mainContent = page.locator('.app-main')
    await expect(mainContent).toBeVisible()
    
    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar).toBeVisible()
    
    console.log('✅ 整体UI一致性验证通过')
  })
})
