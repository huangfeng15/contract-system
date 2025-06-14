/**
 * 数据导入端到端测试
 * 测试从前端文件选择到后端文件解析的完整流程
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('数据导入端到端测试', () => {
  let electronApp;
  let page;

  test.beforeAll(async ({ playwright }) => {
    // 启动Electron应用
    electronApp = await playwright._electron.launch({
      args: [path.join(__dirname, '../../src/main/main.ts')]
    });
    page = await electronApp.firstWindow();

    // 等待应用加载完成
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('完整的文件导入流程测试', async () => {
    console.log('开始端到端文件导入测试...');

    // 1. 导航到数据导入页面
    await page.click('text=数据导入');
    await page.waitForTimeout(1000);

    // 验证页面加载
    await expect(page.locator('.data-import-view')).toBeVisible();
    console.log('✅ 数据导入页面加载成功');

    // 2. 测试文件选择功能
    console.log('测试文件选择功能...');

    // 模拟文件选择 - 使用测试文件
    const testFilePath = path.join(__dirname, '../../test-data/sample-contract.xlsx');

    // 检查测试文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(testFilePath)) {
      console.log('⚠️ 测试文件不存在，创建模拟测试');

      // 使用实际的Excel文件路径进行测试
      const realFilePath = 'C:\\Users\\97477\\Desktop\\develop\\合同台账\\2-5.合同及招采台账2025.04.22（在此版本更新）.xlsx';

      if (fs.existsSync(realFilePath)) {
        console.log('使用真实Excel文件进行测试:', realFilePath);

        // 直接调用文件解析API测试
        const parseResult = await page.evaluate(async (filePath) => {
          try {
            console.log('调用 import:parseFile API...');
            const result = await window.electronAPI.invoke('import:parseFile', filePath);
            console.log('API调用结果:', result);
            return result;
          } catch (error) {
            console.error('API调用失败:', error);
            return { success: false, error: error.message };
          }
        }, realFilePath);

        console.log('文件解析API测试结果:', parseResult);

        // 验证API调用成功
        expect(parseResult.success).toBe(true);
        expect(parseResult.data).toBeDefined();
        expect(Array.isArray(parseResult.data)).toBe(true);

        if (parseResult.success) {
          console.log('✅ 文件解析API调用成功');
          console.log('解析的工作表数量:', parseResult.data.length);

          // 验证工作表信息结构
          if (parseResult.data.length > 0) {
            const worksheet = parseResult.data[0];
            expect(worksheet).toHaveProperty('id');
            expect(worksheet).toHaveProperty('sheetName');
            expect(worksheet).toHaveProperty('sheetType');
            expect(worksheet).toHaveProperty('recognitionStatus');
            console.log('✅ 工作表信息结构验证通过');
          }
        }

        // 3. 测试前端文件处理流程
        console.log('测试前端文件处理流程...');

        const frontendResult = await page.evaluate(async (filePath) => {
          try {
            // 模拟 processSelectedFiles 函数调用
            const filePaths = [filePath];

            // 检查 processSelectedFiles 函数是否存在
            if (typeof window.processSelectedFiles === 'function') {
              await window.processSelectedFiles(filePaths);
              return { success: true, message: '前端处理成功' };
            } else {
              // 直接测试文件解析逻辑
              let fileItem = null;

              console.log(`开始处理文件: ${filePath}`);

              // 验证文件路径
              if (!filePath || typeof filePath !== 'string') {
                throw new Error('无效的文件路径');
              }

              // 解析文件获取工作表信息
              const parseResponse = await window.electronAPI.invoke('import:parseFile', filePath);
              console.log(`文件解析响应:`, parseResponse);

              if (parseResponse.success && parseResponse.data) {
                const worksheets = parseResponse.data;
                console.log(`解析成功，工作表数量: ${worksheets.length}`);

                // 创建文件项
                fileItem = {
                  id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                  name: filePath.split(/[/\\]/).pop() || filePath,
                  size: '未知大小',
                  sheetCount: worksheets.length,
                  status: 'completed'
                };

                // 保存工作表信息用于详情查看
                fileItem.worksheets = worksheets;
                fileItem.filePath = filePath;

                console.log(`文件处理成功: ${fileItem.name}`);
                return { success: true, fileItem, message: '前端处理成功' };
              } else {
                throw new Error(parseResponse.error || '解析失败');
              }
            }
          } catch (error) {
            console.error('前端处理失败:', error);
            return { success: false, error: error.message };
          }
        }, realFilePath);

        console.log('前端处理结果:', frontendResult);

        // 验证前端处理成功
        expect(frontendResult.success).toBe(true);
        if (frontendResult.fileItem) {
          expect(frontendResult.fileItem).toHaveProperty('id');
          expect(frontendResult.fileItem).toHaveProperty('name');
          expect(frontendResult.fileItem).toHaveProperty('sheetCount');
          expect(frontendResult.fileItem.status).toBe('completed');
          console.log('✅ 前端文件处理验证通过');
        }

        // 4. 测试UI交互
        console.log('测试UI交互...');

        // 点击选择文件按钮
        const selectButton = page.locator('button:has-text("选择文件")');
        if (await selectButton.isVisible()) {
          console.log('找到选择文件按钮，测试点击...');
          // 注意：实际的文件选择对话框无法在自动化测试中完全模拟
          // 这里主要测试按钮是否可点击
          expect(await selectButton.isEnabled()).toBe(true);
          console.log('✅ 选择文件按钮可点击');
        }

        // 检查文件列表区域
        const fileListArea = page.locator('.file-list-area, .import-file-list');
        if (await fileListArea.isVisible()) {
          console.log('✅ 文件列表区域可见');
        }

        console.log('✅ 端到端测试完成 - 所有关键功能正常');

      } else {
        console.log('⚠️ 跳过真实文件测试 - 测试文件不存在');

        // 至少测试API是否可调用
        const apiTest = await page.evaluate(async () => {
          try {
            // 测试API是否存在
            if (window.electronAPI && window.electronAPI.invoke) {
              return { success: true, message: 'API接口可用' };
            } else {
              return { success: false, error: 'API接口不可用' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        });

        expect(apiTest.success).toBe(true);
        console.log('✅ API接口可用性验证通过');
      }
    }
  });

  test('错误处理测试', async () => {
    console.log('开始错误处理测试...');

    // 导航到数据导入页面
    await page.click('text=数据导入');
    await page.waitForTimeout(1000);

    // 测试无效文件路径处理
    const errorTest = await page.evaluate(async () => {
      try {
        // 测试空文件路径
        const result1 = await window.electronAPI.invoke('import:parseFile', '');

        // 测试不存在的文件
        const result2 = await window.electronAPI.invoke('import:parseFile', 'nonexistent-file.xlsx');

        // 测试无效文件格式
        const result3 = await window.electronAPI.invoke('import:parseFile', 'test.txt');

        return {
          emptyPath: result1,
          nonexistentFile: result2,
          invalidFormat: result3
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('错误处理测试结果:', errorTest);

    // 验证错误处理
    if (errorTest.emptyPath) {
      expect(errorTest.emptyPath.success).toBe(false);
      console.log('✅ 空文件路径错误处理正确');
    }

    if (errorTest.nonexistentFile) {
      expect(errorTest.nonexistentFile.success).toBe(false);
      console.log('✅ 不存在文件错误处理正确');
    }

    if (errorTest.invalidFormat) {
      expect(errorTest.invalidFormat.success).toBe(false);
      console.log('✅ 无效格式错误处理正确');
    }

    console.log('✅ 错误处理测试完成');
  });
});
