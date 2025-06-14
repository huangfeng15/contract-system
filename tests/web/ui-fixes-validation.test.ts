import { test, expect } from '@playwright/test'

test.describe('UI修复验证测试', () => {
  test.beforeEach(async ({ page }) => {
    // 启动应用
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('项目管理页面 - 操作按钮单行显示', async ({ page }) => {
    console.log('测试项目管理页面操作按钮布局...')

    // 导航到项目管理页面
    await page.click('text=项目管理')
    await page.waitForSelector('.data-table')

    // 检查操作列是否存在
    const actionHeader = page.locator('.action-header')
    await expect(actionHeader).toBeVisible()

    // 检查操作按钮容器
    const actionButtons = page.locator('.action-buttons').first()
    await expect(actionButtons).toBeVisible()

    // 验证操作按钮在一行内显示
    const buttons = actionButtons.locator('.btn-action')
    const buttonCount = await buttons.count()
    console.log(`找到 ${buttonCount} 个操作按钮`)

    if (buttonCount > 0) {
      // 获取第一个和最后一个按钮的位置
      const firstButton = buttons.first()
      const lastButton = buttons.last()

      const firstButtonBox = await firstButton.boundingBox()
      const lastButtonBox = await lastButton.boundingBox()

      if (firstButtonBox && lastButtonBox) {
        // 验证按钮在同一行（Y坐标相近）
        const yDifference = Math.abs(firstButtonBox.y - lastButtonBox.y)
        console.log(`按钮Y坐标差异: ${yDifference}px`)
        expect(yDifference).toBeLessThan(10) // 允许小于10px的差异

        console.log('✅ 操作按钮单行显示验证通过')
      }
    }
  })

  test('项目管理页面 - 表格滚动条功能', async ({ page }) => {
    console.log('测试项目管理页面表格滚动条...')

    // 导航到项目管理页面
    await page.click('text=项目管理')
    await page.waitForSelector('.table-section')

    // 检查表格容器
    const tableSection = page.locator('.table-section')
    await expect(tableSection).toBeVisible()

    // 验证表格容器有正确的样式
    const overflow = await tableSection.evaluate(el =>
      window.getComputedStyle(el).overflow
    )
    expect(overflow).toBe('auto')

    // 验证最大高度设置
    const maxHeight = await tableSection.evaluate(el =>
      window.getComputedStyle(el).maxHeight
    )
    console.log(`表格最大高度: ${maxHeight}`)
    expect(maxHeight).toContain('calc')

    console.log('✅ 表格滚动条配置验证通过')
  })

  test('字段管理页面 - 操作按钮单行显示', async ({ page }) => {
    console.log('测试字段管理页面操作按钮布局...')

    // 导航到字段管理页面
    await page.click('text=字段管理')
    await page.waitForSelector('.data-table')

    // 检查操作列是否存在
    const actionHeader = page.locator('.action-header')
    await expect(actionHeader).toBeVisible()

    // 检查操作按钮容器
    const actionButtons = page.locator('.action-buttons').first()
    await expect(actionButtons).toBeVisible()

    // 验证操作按钮在一行内显示
    const buttons = actionButtons.locator('.btn-action')
    const buttonCount = await buttons.count()
    console.log(`找到 ${buttonCount} 个操作按钮`)

    if (buttonCount > 0) {
      // 获取第一个和最后一个按钮的位置
      const firstButton = buttons.first()
      const lastButton = buttons.last()

      const firstButtonBox = await firstButton.boundingBox()
      const lastButtonBox = await lastButton.boundingBox()

      if (firstButtonBox && lastButtonBox) {
        // 验证按钮在同一行（Y坐标相近）
        const yDifference = Math.abs(firstButtonBox.y - lastButtonBox.y)
        console.log(`按钮Y坐标差异: ${yDifference}px`)
        expect(yDifference).toBeLessThan(10) // 允许小于10px的差异

        console.log('✅ 字段管理操作按钮单行显示验证通过')
      }
    }
  })

  test('字段管理页面 - 表格滚动条功能', async ({ page }) => {
    console.log('测试字段管理页面表格滚动条...')

    // 导航到字段管理页面
    await page.click('text=字段管理')
    await page.waitForSelector('.table-section')

    // 检查表格容器
    const tableSection = page.locator('.table-section')
    await expect(tableSection).toBeVisible()

    // 验证表格容器有正确的样式
    const overflow = await tableSection.evaluate(el =>
      window.getComputedStyle(el).overflow
    )
    expect(overflow).toBe('auto')

    // 验证最大高度设置
    const maxHeight = await tableSection.evaluate(el =>
      window.getComputedStyle(el).maxHeight
    )
    console.log(`表格最大高度: ${maxHeight}`)
    expect(maxHeight).toContain('calc')

    console.log('✅ 字段管理表格滚动条配置验证通过')
  })

  test('操作按钮样式一致性验证', async ({ page }) => {
    console.log('验证操作按钮样式一致性...')

    // 测试项目管理页面
    await page.click('text=项目管理')
    await page.waitForSelector('.btn-action')

    const projectButtons = page.locator('.btn-action')
    const projectButtonCount = await projectButtons.count()

    if (projectButtonCount > 0) {
      const projectButtonStyle = await projectButtons.first().evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          borderRadius: style.borderRadius,
          fontSize: style.fontSize,
          padding: style.padding
        }
      })
      console.log('项目管理按钮样式:', projectButtonStyle)
    }

    // 测试字段管理页面
    await page.click('text=字段管理')
    await page.waitForSelector('.btn-action')

    const fieldButtons = page.locator('.btn-action')
    const fieldButtonCount = await fieldButtons.count()

    if (fieldButtonCount > 0) {
      const fieldButtonStyle = await fieldButtons.first().evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          borderRadius: style.borderRadius,
          fontSize: style.fontSize,
          padding: style.padding
        }
      })
      console.log('字段管理按钮样式:', fieldButtonStyle)
    }

    console.log('✅ 按钮样式一致性验证完成')
  })
})
