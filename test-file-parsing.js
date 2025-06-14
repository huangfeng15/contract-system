/**
 * 测试文件解析功能
 * 直接在浏览器控制台中运行此脚本来测试文件解析
 */

async function testFileParsingFix() {
  console.log('开始测试文件解析功能修复...');
  
  try {
    // 测试文件路径
    const testFilePath = 'C:\\Users\\97477\\Desktop\\develop\\contrac system\\2-5.合同及招采台账2025.04.22（在此版本更新）.xlsx';
    
    console.log('测试文件路径:', testFilePath);
    
    // 调用文件解析API
    console.log('调用 import:parseFile API...');
    
    const result = await window.electronAPI.invoke('import:parseFile', testFilePath);
    
    console.log('文件解析结果:', result);
    
    if (result.success) {
      console.log('✅ 文件解析成功！');
      console.log('解析详情:');
      console.log('- 文件ID:', result.data?.fileId);
      console.log('- 工作表数量:', result.data?.worksheets?.length || 0);
      
      if (result.data?.worksheets) {
        result.data.worksheets.forEach((worksheet, index) => {
          console.log(`- 工作表 ${index + 1}:`, {
            名称: worksheet.sheetName,
            类型: worksheet.sheetType,
            识别状态: worksheet.recognitionStatus,
            数据行数: worksheet.dataRows,
            匹配字段数: worksheet.matchedFields
          });
        });
      }
      
      console.log('✅ getAllFields 方法调用错误已修复！');
      
    } else {
      console.log('❌ 文件解析失败:', result.error);
      
      // 检查错误类型
      if (result.error && result.error.includes('getAllFields is not a function')) {
        console.log('❌ 修复失败：仍然存在 getAllFields 方法调用错误');
      } else {
        console.log('✅ 没有 getAllFields 方法调用错误，可能是其他原因导致的失败');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    
    if (error.message && error.message.includes('getAllFields is not a function')) {
      console.log('❌ 修复失败：仍然存在 getAllFields 方法调用错误');
    } else {
      console.log('✅ 没有 getAllFields 方法调用错误');
    }
  }
}

// 运行测试
testFileParsingFix();
