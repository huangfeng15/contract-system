/**
 * 导入设置模态框交互测试
 * 验证导入设置模态框中开关组件的交互功能
 */

import { test, expect } from '@playwright/test';

test.describe('导入设置模态框交互测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到数据导入页面
    await page.goto('/');
    await page.click('[data-module="dataImport"]');
    await page.waitForSelector('.data-import-view');
  });

  test('应该能够打开导入设置模态框', async ({ page }) => {
    // 点击导入设置按钮
    await page.click('button:has-text("导入设置")');
    
    // 验证模态框是否显示
    await expect(page.locator('.modal-overlay.show')).toBeVisible();
    await expect(page.locator('.modal-title:has-text("导入设置")')).toBeVisible();
  });

  test('应该能够切换跳过空行开关', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 获取跳过空行开关的初始状态
    const skipEmptyRowsSwitch = page.locator('input[name="skipEmptyRows"]');
    const initialState = await skipEmptyRowsSwitch.isChecked();

    // 点击开关容器
    await page.click('.form-switch:has(input[name="skipEmptyRows"])');
    
    // 验证状态已改变
    const newState = await skipEmptyRowsSwitch.isChecked();
    expect(newState).toBe(!initialState);

    // 再次点击，验证能够切换回来
    await page.click('.form-switch:has(input[name="skipEmptyRows"])');
    const finalState = await skipEmptyRowsSwitch.isChecked();
    expect(finalState).toBe(initialState);
  });

  test('应该能够切换清理空格开关', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 获取清理空格开关的初始状态
    const trimWhitespaceSwitch = page.locator('input[name="trimWhitespace"]');
    const initialState = await trimWhitespaceSwitch.isChecked();

    // 点击开关容器
    await page.click('.form-switch:has(input[name="trimWhitespace"])');
    
    // 验证状态已改变
    const newState = await trimWhitespaceSwitch.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('应该能够切换数据验证开关', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 获取数据验证开关的初始状态
    const validateDataSwitch = page.locator('input[name="validateData"]');
    const initialState = await validateDataSwitch.isChecked();

    // 点击开关容器
    await page.click('.form-switch:has(input[name="validateData"])');
    
    // 验证状态已改变
    const newState = await validateDataSwitch.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('应该能够切换启用自动更新开关', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 获取启用自动更新开关的初始状态
    const autoUpdateSwitch = page.locator('input[type="checkbox"]:not([name])');
    const initialState = await autoUpdateSwitch.isChecked();

    // 点击开关容器
    await page.click('.form-switch:has(input[type="checkbox"]:not([name]))');
    
    // 验证状态已改变
    const newState = await autoUpdateSwitch.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('应该能够修改匹配模式', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 获取匹配模式选择器
    const matchModeSelect = page.locator('select[name="matchMode"]');
    
    // 选择模糊匹配
    await matchModeSelect.selectOption('fuzzy');
    const selectedValue = await matchModeSelect.inputValue();
    expect(selectedValue).toBe('fuzzy');

    // 选择精确匹配
    await matchModeSelect.selectOption('strict');
    const newSelectedValue = await matchModeSelect.inputValue();
    expect(newSelectedValue).toBe('strict');
  });

  test('应该能够修改最少匹配字段数', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 获取最少匹配字段数输入框
    const minMatchFieldsInput = page.locator('input[name="minMatchFields"]');
    
    // 清空并输入新值
    await minMatchFieldsInput.fill('5');
    const inputValue = await minMatchFieldsInput.inputValue();
    expect(inputValue).toBe('5');
  });

  test('应该能够保存导入设置', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 修改一些设置
    await page.click('.form-switch:has(input[name="skipEmptyRows"])');
    await page.locator('input[name="minMatchFields"]').fill('4');

    // 点击保存按钮
    await page.click('button:has-text("保存设置")');

    // 验证模态框已关闭
    await expect(page.locator('.modal-overlay.show')).not.toBeVisible();

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  test('应该能够取消导入设置', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 点击取消按钮
    await page.click('button:has-text("取消")');

    // 验证模态框已关闭
    await expect(page.locator('.modal-overlay.show')).not.toBeVisible();
  });

  test('应该能够通过点击遮罩层关闭模态框', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 点击遮罩层（模态框外部）
    await page.click('.modal-overlay', { position: { x: 10, y: 10 } });

    // 验证模态框已关闭
    await expect(page.locator('.modal-overlay.show')).not.toBeVisible();
  });

  test('应该能够通过关闭按钮关闭模态框', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    // 点击关闭按钮
    await page.click('.modal-close');

    // 验证模态框已关闭
    await expect(page.locator('.modal-overlay.show')).not.toBeVisible();
  });

  test('开关组件应该有正确的视觉反馈', async ({ page }) => {
    // 打开导入设置模态框
    await page.click('button:has-text("导入设置")');
    await page.waitForSelector('.modal-overlay.show');

    const switchContainer = page.locator('.form-switch:has(input[name="skipEmptyRows"])');
    const switchSlider = switchContainer.locator('.switch-slider');

    // 验证悬停效果
    await switchContainer.hover();
    
    // 验证点击效果
    await switchContainer.click();
    
    // 验证开关状态的视觉变化
    const isChecked = await page.locator('input[name="skipEmptyRows"]').isChecked();
    if (isChecked) {
      // 验证激活状态的样式
      await expect(switchSlider).toHaveCSS('background-color', /rgb\(30, 64, 175\)/);
    }
  });
});
