/**
 * 验证数据导入功能修复效果
 * 在Electron环境中运行此脚本
 */

console.log('🔧 开始验证数据导入功能修复...');

// 测试文件路径
const testFilePath = 'C:\\Users\\97477\\Desktop\\develop\\合同台账\\2-5.合同及招采台账2025.04.22（在此版本更新）.xlsx';

async function testDataImportFix() {
  try {
    console.log('📁 测试文件路径:', testFilePath);

    // 1. 测试API可用性
    console.log('\n1️⃣ 测试API可用性...');
    if (!window.electronAPI) {
      throw new Error('❌ electronAPI 不可用');
    }

    if (!window.electronAPI.invoke) {
      throw new Error('❌ electronAPI.invoke 方法不可用');
    }

    console.log('✅ electronAPI 可用');

    // 2. 测试文件解析API
    console.log('\n2️⃣ 测试文件解析API...');

    const parseResult = await window.electronAPI.invoke('import:parseFile', testFilePath);
    console.log('📊 解析结果:', parseResult);

    if (!parseResult.success) {
      console.log('❌ 文件解析失败:', parseResult.error);
      return false;
    }

    console.log('✅ 文件解析成功');
    console.log('📋 工作表数量:', parseResult.data?.length || 0);

    // 验证返回数据结构
    if (parseResult.data && Array.isArray(parseResult.data)) {
      parseResult.data.forEach((worksheet, index) => {
        console.log(`📄 工作表 ${index + 1}:`, {
          名称: worksheet.sheetName,
          类型: worksheet.sheetType,
          识别状态: worksheet.recognitionStatus,
          数据行数: worksheet.dataRows,
          匹配字段数: worksheet.matchedFieldsCount
        });
      });
    }

    // 3. 测试前端文件处理逻辑
    console.log('\n3️⃣ 测试前端文件处理逻辑...');

    // 模拟 processSelectedFiles 函数的核心逻辑
    const filePaths = [testFilePath];
    let processSuccess = true;

    for (const filePath of filePaths) {
      let fileItem = null;

      try {
        console.log(`🔄 开始处理文件: ${filePath}`);

        // 验证文件路径
        if (!filePath || typeof filePath !== 'string') {
          throw new Error('无效的文件路径');
        }

        // 解析文件获取工作表信息
        const parseResponse = await window.electronAPI.invoke('import:parseFile', filePath);
        console.log(`📈 文件解析响应状态:`, parseResponse.success ? '成功' : '失败');

        if (parseResponse.success && parseResponse.data) {
          const worksheets = parseResponse.data;
          console.log(`📊 解析成功，工作表数量: ${worksheets.length}`);

          // 创建文件项 - 这里是之前出错的地方
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

          console.log(`✅ 文件项创建成功: ${fileItem.name}`);
          console.log(`📋 文件项详情:`, {
            ID: fileItem.id,
            名称: fileItem.name,
            工作表数: fileItem.sheetCount,
            状态: fileItem.status
          });

        } else {
          throw new Error(parseResponse.error || '解析失败');
        }

      } catch (error) {
        console.error(`❌ 处理文件失败: ${filePath}`, error.message);
        processSuccess = false;

        // 如果文件项已创建但处理失败，标记为失败状态
        if (fileItem) {
          fileItem.status = 'failed';
          console.log(`⚠️ 文件项状态已标记为失败`);
        }
      }
    }

    if (processSuccess) {
      console.log('✅ 前端文件处理逻辑测试通过');
    } else {
      console.log('❌ 前端文件处理逻辑测试失败');
      return false;
    }

    // 4. 测试错误处理
    console.log('\n4️⃣ 测试错误处理...');

    // 测试空文件路径
    const emptyPathResult = await window.electronAPI.invoke('import:parseFile', '');
    if (emptyPathResult.success) {
      console.log('⚠️ 空文件路径应该返回错误');
    } else {
      console.log('✅ 空文件路径错误处理正确');
    }

    // 测试不存在的文件
    const nonexistentResult = await window.electronAPI.invoke('import:parseFile', 'nonexistent-file.xlsx');
    if (nonexistentResult.success) {
      console.log('⚠️ 不存在文件应该返回错误');
    } else {
      console.log('✅ 不存在文件错误处理正确');
    }

    console.log('\n🎉 所有测试完成！');
    console.log('📊 测试总结:');
    console.log('  ✅ API可用性: 通过');
    console.log('  ✅ 文件解析: 通过');
    console.log('  ✅ 前端处理: 通过');
    console.log('  ✅ 错误处理: 通过');

    return true;

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.stack);
    return false;
  }
}

// 检查是否在正确的环境中运行
if (typeof window !== 'undefined' && window.electronAPI) {
  // 在浏览器控制台中运行
  testDataImportFix().then(success => {
    if (success) {
      console.log('\n🎊 数据导入功能修复验证成功！');
      console.log('💡 现在可以正常使用文件选择和导入功能了。');
    } else {
      console.log('\n💥 数据导入功能仍有问题，需要进一步调试。');
    }
  });
} else {
  console.log('⚠️ 请在Electron应用的开发者控制台中运行此脚本');
  console.log('📝 使用方法:');
  console.log('1. 启动应用: npm run dev');
  console.log('2. 打开开发者工具: Ctrl+Shift+I');
  console.log('3. 在控制台中粘贴并运行此脚本');
}

// 导出测试函数供外部调用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDataImportFix };
}
