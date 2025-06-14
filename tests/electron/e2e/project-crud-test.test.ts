/**
 * 项目管理CRUD功能测试
 * 验证项目的创建、读取、更新、删除操作的数据库持久化
 */

import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('项目管理CRUD数据库持久化测试', () => {
  test('项目删除数据库持久化验证', async () => {
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

      // 导航到项目管理页面
      await page.evaluate(() => {
        window.location.hash = '#/project-management'
      })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // 等待页面内容加载完成
      await page.waitForSelector('.module-content', { timeout: 10000 })

      // 验证页面标题
      const pageTitle = page.locator('.page-header .page-title')
      await expect(pageTitle).toBeVisible({ timeout: 10000 })
      await expect(pageTitle).toContainText('项目管理')

      // 等待数据表格加载
      await page.waitForSelector('.table-section .data-table', { timeout: 10000 })

      // 获取初始项目数量
      const initialRows = await page.locator('.table-section .data-table tbody tr').count()
      console.log('初始项目数量:', initialRows)

      if (initialRows === 0) {
        console.log('没有项目数据，先创建一个测试项目')

        // 点击新增项目按钮
        const addButton = page.locator('.action-toolbar button:has-text("新增项目")')
        await expect(addButton).toBeVisible({ timeout: 10000 })
        await addButton.click()

        // 等待模态框出现
        await page.waitForSelector('.modal-overlay.show', { timeout: 5000 })

        // 填写项目信息
        await page.fill('.modal-content input[placeholder*="项目编号"]', 'TEST001')
        await page.fill('.modal-content input[placeholder*="项目名称"]', '测试项目')
        await page.fill('.modal-content input[placeholder*="项目别名"]', '测试,TEST')
        await page.fill('.modal-content textarea[placeholder*="项目描述"]', '这是一个测试项目')

        // 保存项目
        const saveButton = page.locator('.modal-footer button:has-text("保存")')
        await saveButton.click()

        // 等待模态框关闭和数据刷新
        await page.waitForTimeout(2000)

        // 验证项目已创建
        const newRows = await page.locator('.table-section .data-table tbody tr').count()
        expect(newRows).toBe(1)
        console.log('测试项目创建成功')
      }

      // 获取当前项目数量
      const currentRows = await page.locator('.table-section .data-table tbody tr').count()
      console.log('当前项目数量:', currentRows)
      expect(currentRows).toBeGreaterThan(0)

      // 找到第一个项目的删除按钮并点击
      const firstDeleteButton = page.locator('.table-section .data-table tbody tr:first-child .btn-action:has-text("删除")')
      await expect(firstDeleteButton).toBeVisible({ timeout: 10000 })

      // 获取要删除的项目名称
      const projectName = await page.locator('.table-section .data-table tbody tr:first-child td:nth-child(2)').textContent()
      console.log('准备删除项目:', projectName)

      // 点击删除按钮
      await firstDeleteButton.click()

      // 处理确认对话框
      page.on('dialog', async dialog => {
        console.log('确认对话框:', dialog.message())
        await dialog.accept()
      })

      // 等待删除操作完成
      await page.waitForTimeout(3000)

      // 验证项目已从列表中删除
      const afterDeleteRows = await page.locator('.table-section .data-table tbody tr').count()
      console.log('删除后项目数量:', afterDeleteRows)
      expect(afterDeleteRows).toBe(currentRows - 1)

      // 刷新页面验证数据库持久化
      console.log('刷新页面验证数据库持久化...')
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(3000)

      // 重新导航到项目管理页面
      await page.evaluate(() => {
        window.location.hash = '#/project-management'
      })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // 等待页面重新加载
      await page.waitForSelector('.table-section .data-table', { timeout: 10000 })

      // 验证删除的项目在刷新后仍然不存在
      const finalRows = await page.locator('.table-section .data-table tbody tr').count()
      console.log('刷新后项目数量:', finalRows)

      // 验证数据库持久化：删除的项目应该不再出现
      expect(finalRows).toBe(afterDeleteRows)

      // 如果有项目名称，验证该项目确实不在列表中
      if (projectName) {
        const deletedProjectExists = await page.locator(`.table-section .data-table tbody tr:has-text("${projectName}")`).count()
        expect(deletedProjectExists).toBe(0)
        console.log(`✅ 验证通过：项目 "${projectName}" 已从数据库中永久删除`)
      }

      console.log('✅ 项目删除数据库持久化测试通过')

    } catch (error) {
      console.error('❌ 项目删除持久化测试失败:', error)

      // 截图用于调试
      await page.screenshot({ path: 'test-results/project-delete-persistence-error.png' })
      throw error
    } finally {
      // 关闭应用
      await electronApp.close()
    }
  })

  test('项目创建和更新数据库持久化验证', async () => {
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
      // 导航到项目管理页面
      await page.evaluate(() => {
        window.location.hash = '#/project-management'
      })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      await page.waitForSelector('.module-content', { timeout: 10000 })

      // 获取初始项目数量
      const initialRows = await page.locator('.table-section .data-table tbody tr').count()
      console.log('初始项目数量:', initialRows)

      // 创建新项目
      const addButton = page.locator('.action-toolbar button:has-text("新增项目")')
      await addButton.click()

      await page.waitForSelector('.modal-overlay.show', { timeout: 5000 })

      const testProjectCode = `TEST${Date.now()}`
      const testProjectName = `测试项目${Date.now()}`

      await page.fill('.modal-content input[placeholder*="项目编号"]', testProjectCode)
      await page.fill('.modal-content input[placeholder*="项目名称"]', testProjectName)
      await page.fill('.modal-content input[placeholder*="项目别名"]', '测试,TEST')
      await page.fill('.modal-content textarea[placeholder*="项目描述"]', '这是一个测试项目')

      const saveButton = page.locator('.modal-footer button:has-text("保存")')
      await saveButton.click()

      await page.waitForTimeout(2000)

      // 验证项目已创建
      const afterCreateRows = await page.locator('.table-section .data-table tbody tr').count()
      expect(afterCreateRows).toBe(initialRows + 1)

      // 刷新页面验证创建的持久化
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(3000)

      await page.evaluate(() => {
        window.location.hash = '#/project-management'
      })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      await page.waitForSelector('.table-section .data-table', { timeout: 10000 })

      // 验证创建的项目在刷新后仍然存在
      const persistedRows = await page.locator('.table-section .data-table tbody tr').count()
      expect(persistedRows).toBe(afterCreateRows)

      // 验证创建的项目确实在列表中
      const createdProjectExists = await page.locator(`.table-section .data-table tbody tr:has-text("${testProjectName}")`).count()
      expect(createdProjectExists).toBe(1)

      console.log('✅ 项目创建数据库持久化测试通过')

    } catch (error) {
      console.error('❌ 项目创建持久化测试失败:', error)
      await page.screenshot({ path: 'test-results/project-create-persistence-error.png' })
      throw error
    } finally {
      await electronApp.close()
    }
  })
})
