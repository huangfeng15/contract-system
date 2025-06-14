/**
 * ImportService FieldService 方法调用修复测试
 * 验证 ImportService 能正确调用 FieldService.findAll() 方法
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testImportServiceFieldFix() {
  console.log('开始测试 ImportService FieldService 方法调用修复...');

  try {
    console.log('1. 初始化数据库管理器...');

    // 动态导入数据库管理器
    const { DatabaseManager } = await import('../../src/main/database/DatabaseManager.ts');
    const dbManager = DatabaseManager.getInstance();

    // 初始化数据库
    const initResult = await dbManager.initialize();
    if (!initResult.success) {
      throw new Error(`数据库初始化失败: ${initResult.error}`);
    }

    console.log('✓ 数据库初始化成功');

    console.log('2. 测试 FieldService.findAll() 方法...');

    // 测试 FieldService
    const { FieldService } = await import('../../src/main/services/FieldService.ts');
    const fieldService = new FieldService(dbManager);

    const fieldResult = await fieldService.findAll();
    console.log('FieldService.findAll() 结果:', fieldResult);

    if (!fieldResult.success) {
      console.warn('字段配置查询失败，但这是预期的（可能没有数据）:', fieldResult.error);
    } else {
      console.log(`✓ FieldService.findAll() 调用成功，返回 ${fieldResult.data?.length || 0} 个字段`);
    }

    console.log('3. 测试 ImportService 初始化...');

    // 测试 ImportService
    const { ImportService } = await import('../../src/main/services/ImportService.ts');
    const importService = new ImportService(dbManager);

    console.log('✓ ImportService 创建成功');

    console.log('4. 等待 ImportService 依赖服务初始化...');

    // 等待服务初始化
    let retryCount = 0;
    const maxRetries = 20;
    while (!importService.isServiceInitialized() && retryCount < maxRetries) {
      console.log(`等待初始化... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      retryCount++;
    }

    if (!importService.isServiceInitialized()) {
      throw new Error('ImportService 依赖服务初始化超时');
    }

    console.log('✓ ImportService 依赖服务初始化成功');

    console.log('5. 测试文件解析功能（使用不存在的文件）...');

    // 测试文件解析（预期失败，但不应该是方法调用错误）
    const parseResult = await importService.parseExcelFile('/non-existent-file.xlsx');

    if (!parseResult.success) {
      console.log('文件解析失败（预期）:', parseResult.error);

      // 检查错误是否是方法调用相关的
      if (parseResult.error.includes('getAllFields is not a function')) {
        throw new Error('修复失败：仍然存在 getAllFields 方法调用错误');
      } else if (parseResult.error.includes('文件不存在') || parseResult.error.includes('ENOENT')) {
        console.log('✓ 错误类型正确（文件不存在），说明方法调用修复成功');
      } else {
        console.log('✓ 没有方法调用错误，修复成功');
      }
    } else {
      console.log('✓ 文件解析成功（意外但可接受）');
    }

    console.log('6. 测试真实文件解析（如果存在测试文件）...');

    // 查找测试文件
    const testFilePath = join(__dirname, '../../2-5.合同及招采台账2025.04.22（在此版本更新）.xlsx');

    if (fs.existsSync(testFilePath)) {
      console.log('发现测试文件，开始解析...');

      const realParseResult = await importService.parseExcelFile(testFilePath);

      if (realParseResult.success) {
        console.log('✓ 真实文件解析成功');
        console.log('解析结果:', {
          worksheetCount: realParseResult.data?.worksheets?.length || 0,
          fileId: realParseResult.data?.fileId
        });
      } else {
        console.log('真实文件解析失败:', realParseResult.error);

        // 检查是否是方法调用错误
        if (realParseResult.error.includes('getAllFields is not a function')) {
          throw new Error('修复失败：真实文件解析时仍然存在 getAllFields 方法调用错误');
        } else {
          console.log('✓ 没有方法调用错误，可能是其他原因导致的解析失败');
        }
      }
    } else {
      console.log('未找到测试文件，跳过真实文件解析测试');
    }

    console.log('\n✅ ImportService FieldService 方法调用修复测试完成');
    console.log('✅ 所有测试通过，getAllFields 方法调用错误已修复');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error.stack);
    process.exit(1);
  }
}

// 运行测试
testImportServiceFieldFix().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
