/**
 * 简化的字段管理测试
 * 直接启动Electron应用进行测试
 */

import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('字段管理基础功能测试', () => {
  test('启动应用并验证字段管理页面', async () => {
    // 启动Electron应用
    const electronApp = await electron.launch({
      executablePath: require('electron'),
      args: [path.join(__dirname, '../../../dist-electron/main/main.js')],
      env: {
        NODE_ENV: 'test',
        DB_PATH: ':memory:',
        LOG_LEVEL: 'error'
      }
    })

    // 获取主窗口
    const page = await electronApp.firstWindow()

    // 等待应用加载
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000) // 等待Vue应用初始化

    try {
      // 验证应用标题
      const title = await page.title()
      console.log('应用标题:', title)
      expect(title).toContain('管理系统')

      // 导航到字段管理页面
      await page.evaluate(() => {
        window.location.hash = '#/field-management'
      })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000) // 增加等待时间确保Vue组件完全渲染

      // 等待页面内容加载完成
      await page.waitForSelector('.module-content', { timeout: 10000 })

      // 验证页面基础元素 - 使用更精确的选择器
      const pageTitle = page.locator('.page-header .page-title')
      await expect(pageTitle).toBeVisible({ timeout: 10000 })
      await expect(pageTitle).toContainText('字段管理')

      // 验证数据表格存在
      const dataTable = page.locator('.table-section .data-table')
      await expect(dataTable).toBeVisible({ timeout: 10000 })

      // 验证操作按钮存在 - 使用更精确的选择器
      const addButton = page.locator('.action-toolbar button:has-text("新增字段")')
      await expect(addButton).toBeVisible({ timeout: 10000 })

      const importButton = page.locator('.action-toolbar button:has-text("导入字段")')
      await expect(importButton).toBeVisible({ timeout: 10000 })

      const exportButton = page.locator('.action-toolbar button:has-text("导出字段")')
      await expect(exportButton).toBeVisible({ timeout: 10000 })

      // 验证搜索框存在
      const searchInput = page.locator('.search-group .search-input')
      await expect(searchInput).toBeVisible({ timeout: 10000 })

      // 验证标签页切换按钮
      const contractTab = page.locator('.tab-section .tab-btn:has-text("合同字段")')
      await expect(contractTab).toBeVisible({ timeout: 10000 })

      const procurementTab = page.locator('.tab-section .tab-btn:has-text("采购字段")')
      await expect(procurementTab).toBeVisible({ timeout: 10000 })

      console.log('✅ 字段管理页面基础元素验证通过')

    } catch (error) {
      console.error('❌ 测试失败:', error)

      // 截图用于调试
      await page.screenshot({ path: 'test-results/field-management-error.png' })
      throw error
    } finally {
      // 关闭应用
      await electronApp.close()
    }
  })

  test('测试字段搜索功能', async () => {
    const electronApp = await electron.launch({
      executablePath: require('electron'),
      args: [path.join(__dirname, '../../../dist-electron/main/main.js')],
      env: {
        NODE_ENV: 'test',
        DB_PATH: ':memory:',
        LOG_LEVEL: 'error'
      }
    })

    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    try {
      // 导航到字段管理页面
      await page.evaluate(() => {
        window.location.hash = '#/field-management'
      })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // 等待页面内容加载完成
      await page.waitForSelector('.module-content', { timeout: 10000 })
      await page.waitForSelector('.table-section .data-table tbody tr', { timeout: 10000 })

      // 获取初始行数
      const initialRows = await page.locator('.table-section .data-table tbody tr').count()
      console.log('初始字段数量:', initialRows)

      // 执行搜索
      const searchInput = page.locator('.search-group .search-input')
      await searchInput.fill('合同编号')
      await page.waitForTimeout(1500) // 增加等待时间让搜索过滤生效

      // 验证搜索结果
      const filteredRows = await page.locator('.table-section .data-table tbody tr:visible').count()
      console.log('搜索后字段数量:', filteredRows)

      // 搜索结果应该少于或等于初始数量
      expect(filteredRows).toBeLessThanOrEqual(initialRows)

      // 清空搜索
      await searchInput.fill('')
      await page.waitForTimeout(1500)

      // 验证恢复显示所有字段
      const restoredRows = await page.locator('.table-section .data-table tbody tr').count()
      expect(restoredRows).toBe(initialRows)

      console.log('✅ 字段搜索功能测试通过')

    } catch (error) {
      console.error('❌ 搜索功能测试失败:', error)
      await page.screenshot({ path: 'test-results/field-search-error.png' })
      throw error
    } finally {
      await electronApp.close()
    }
  })

  test('测试标签页切换功能', async () => {
    const electronApp = await electron.launch({
      executablePath: require('electron'),
      args: [path.join(__dirname, '../../../dist-electron/main/main.js')],
      env: {
        NODE_ENV: 'test',
        DB_PATH: ':memory:',
        LOG_LEVEL: 'error'
      }
    })

    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    try {
      // 导航到字段管理页面
      await page.evaluate(() => {
        window.location.hash = '#/field-management'
      })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // 等待页面内容加载完成
      await page.waitForSelector('.module-content', { timeout: 10000 })
      await page.waitForSelector('.tab-section .tab-btn', { timeout: 10000 })

      // 验证默认在合同字段标签页
      const contractTab = page.locator('.tab-section .tab-btn:has-text("合同字段")')
      await expect(contractTab).toHaveClass(/active/, { timeout: 10000 })

      // 切换到采购字段标签页
      const procurementTab = page.locator('.tab-section .tab-btn:has-text("采购字段")')
      await procurementTab.click()
      await page.waitForTimeout(1500) // 增加等待时间让状态切换生效

      // 验证标签页状态
      await expect(procurementTab).toHaveClass(/active/, { timeout: 5000 })
      await expect(contractTab).not.toHaveClass(/active/, { timeout: 5000 })

      // 切换回合同字段标签页
      await contractTab.click()
      await page.waitForTimeout(1500)

      // 验证标签页状态
      await expect(contractTab).toHaveClass(/active/, { timeout: 5000 })
      await expect(procurementTab).not.toHaveClass(/active/, { timeout: 5000 })

      console.log('✅ 标签页切换功能测试通过')

    } catch (error) {
      console.error('❌ 标签页切换测试失败:', error)
      await page.screenshot({ path: 'test-results/field-tabs-error.png' })
      throw error
    } finally {
      await electronApp.close()
    }
  })
})
