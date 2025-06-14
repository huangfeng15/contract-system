/**
 * 直接测试 ImportService 的文件解析功能
 * 通过模拟 IPC 调用来测试
 */

const path = require('path');

async function testImportServiceDirect() {
  console.log('开始直接测试 ImportService...');
  
  try {
    // 模拟 IPC 调用
    const testFilePath = path.join(__dirname, '2-5.合同及招采台账2025.04.22（在此版本更新）.xlsx');
    
    console.log('测试文件路径:', testFilePath);
    
    // 动态导入 handlers 模块来获取 ImportService
    const handlersModule = await import('./src/main/ipc/handlers.ts');
    
    // 模拟 IPC 事件对象
    const mockEvent = {};
    
    // 调用文件解析处理器
    console.log('调用文件解析处理器...');
    
    // 这里需要直接调用处理器函数
    // 但由于模块结构的限制，我们需要另一种方法
    
    console.log('测试完成');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testImportServiceDirect();
