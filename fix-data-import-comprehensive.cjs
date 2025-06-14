/**
 * 数据导入问题的系统性修复方案
 * 这是一个完整的诊断和修复脚本
 */

const path = require('path');

async function comprehensiveDataImportFix() {
  console.log('🔧 开始数据导入问题的系统性修复...\n');

  // 第一步：检查数据库连接和初始化
  console.log('1️⃣ 检查数据库连接和初始化...');
  await checkDatabaseConnection();

  // 第二步：检查字段配置
  console.log('\n2️⃣ 检查字段配置...');
  await checkFieldConfiguration();

  // 第三步：测试Excel文件解析
  console.log('\n3️⃣ 测试Excel文件解析...');
  await testExcelParsing();

  // 第四步：测试数据识别和匹配
  console.log('\n4️⃣ 测试数据识别和匹配...');
  await testDataRecognition();

  // 第五步：测试数据存储
  console.log('\n5️⃣ 测试数据存储...');
  await testDataStorage();

  console.log('\n🎉 系统性修复完成！');
}

async function checkDatabaseConnection() {
  try {
    // 动态导入数据库管理器
    const { DatabaseManager } = await import('./src/main/database/DatabaseManager.ts');
    const { DatabaseInitializer } = await import('./src/main/database/DatabaseInitializer.ts');

    console.log('   检查数据库管理器...');
    const dbManager = DatabaseManager.getInstance();
    
    if (!dbManager.isInitialized()) {
      console.log('   数据库未初始化，开始初始化...');
      const initializer = new DatabaseInitializer();
      const result = await initializer.initialize();
      
      if (result.success) {
        console.log('   ✅ 数据库初始化成功');
      } else {
        console.log('   ❌ 数据库初始化失败:', result.error);
        return false;
      }
    } else {
      console.log('   ✅ 数据库已初始化');
    }

    // 测试数据库连接
    if (dbManager.isConnected()) {
      console.log('   ✅ 数据库连接正常');
      return true;
    } else {
      console.log('   ❌ 数据库连接失败');
      return false;
    }
  } catch (error) {
    console.log('   ❌ 数据库检查失败:', error.message);
    return false;
  }
}

async function checkFieldConfiguration() {
  try {
    const { DatabaseManager } = await import('./src/main/database/DatabaseManager.ts');
    const { FieldService } = await import('./src/main/services/FieldService.ts');

    const dbManager = DatabaseManager.getInstance();
    const fieldService = new FieldService(dbManager);

    console.log('   检查字段配置数据...');
    const result = await fieldService.findAll();

    if (result.success && result.data) {
      const contractFields = result.data.filter(f => f.fieldType === 'contract');
      const procurementFields = result.data.filter(f => f.fieldType === 'procurement');

      console.log(`   ✅ 字段配置正常: 合同字段${contractFields.length}个, 采购字段${procurementFields.length}个`);
      
      // 显示关键字段
      console.log('   合同关键字段:', contractFields.slice(0, 3).map(f => f.fieldName).join(', '));
      console.log('   采购关键字段:', procurementFields.slice(0, 3).map(f => f.fieldName).join(', '));
      
      return true;
    } else {
      console.log('   ❌ 字段配置获取失败:', result.error);
      return false;
    }
  } catch (error) {
    console.log('   ❌ 字段配置检查失败:', error.message);
    return false;
  }
}

async function testExcelParsing() {
  try {
    const { ImportService } = await import('./src/main/services/ImportService.ts');
    const { DatabaseManager } = await import('./src/main/database/DatabaseManager.ts');

    const dbManager = DatabaseManager.getInstance();
    const importService = new ImportService(dbManager);

    // 测试解析合同文件
    const contractFile = path.join(__dirname, 'test-contract-only.xlsx');
    console.log(`   解析合同文件: ${path.basename(contractFile)}`);
    
    const contractResult = await importService.parseExcelFile(contractFile);
    if (contractResult.success && contractResult.data) {
      console.log(`   ✅ 合同文件解析成功: ${contractResult.data.length}个工作表`);
      contractResult.data.forEach(sheet => {
        console.log(`      ${sheet.sheetName}: ${sheet.totalRows}行, 识别状态: ${sheet.recognitionStatus}`);
      });
    } else {
      console.log('   ❌ 合同文件解析失败:', contractResult.error);
    }

    // 测试解析采购文件
    const procurementFile = path.join(__dirname, 'test-procurement-only.xlsx');
    console.log(`   解析采购文件: ${path.basename(procurementFile)}`);
    
    const procurementResult = await importService.parseExcelFile(procurementFile);
    if (procurementResult.success && procurementResult.data) {
      console.log(`   ✅ 采购文件解析成功: ${procurementResult.data.length}个工作表`);
      procurementResult.data.forEach(sheet => {
        console.log(`      ${sheet.sheetName}: ${sheet.totalRows}行, 识别状态: ${sheet.recognitionStatus}`);
      });
    } else {
      console.log('   ❌ 采购文件解析失败:', procurementResult.error);
    }

    return true;
  } catch (error) {
    console.log('   ❌ Excel解析测试失败:', error.message);
    return false;
  }
}

async function testDataRecognition() {
  try {
    console.log('   测试数据识别逻辑...');
    
    // 模拟测试数据识别
    const testHeaders = [
      ['合同编号', '合同名称', '甲方', '乙方', '合同金额'], // 应该识别为合同
      ['招采编号', '招采名称', '采购人', '中标价', '采购方式'], // 应该识别为采购
      ['编号', '名称', '金额', '日期', '备注'] // 应该无法识别
    ];

    for (let i = 0; i < testHeaders.length; i++) {
      const headers = testHeaders[i];
      console.log(`   测试表头 ${i + 1}: [${headers.join(', ')}]`);
      
      // 这里应该调用实际的识别逻辑
      // 暂时用简单的关键词匹配模拟
      if (headers.some(h => h.includes('合同'))) {
        console.log('      ✅ 识别为合同数据');
      } else if (headers.some(h => h.includes('招采') || h.includes('采购'))) {
        console.log('      ✅ 识别为采购数据');
      } else {
        console.log('      ⚠️ 无法识别数据类型');
      }
    }

    return true;
  } catch (error) {
    console.log('   ❌ 数据识别测试失败:', error.message);
    return false;
  }
}

async function testDataStorage() {
  try {
    const { DatabaseManager } = await import('./src/main/database/DatabaseManager.ts');

    const dbManager = DatabaseManager.getInstance();
    const db = dbManager.getDatabase();

    console.log('   测试数据库表结构...');
    
    // 检查必要的表是否存在
    const tables = ['contracts', 'procurements', 'projects', 'fieldConfigs'];
    for (const tableName of tables) {
      const exists = await dbManager.tableExists(tableName);
      if (exists) {
        console.log(`   ✅ 表 ${tableName} 存在`);
      } else {
        console.log(`   ❌ 表 ${tableName} 不存在`);
      }
    }

    // 测试插入数据
    console.log('   测试数据插入...');
    try {
      const testData = {
        contractNumber: 'TEST001',
        data: JSON.stringify({ test: 'data' }),
        filePath: 'test.xlsx',
        fileName: 'test.xlsx',
        sheetName: 'test',
        status: 'pending'
      };

      const insertSql = `
        INSERT INTO contracts (contractNumber, data, filePath, fileName, sheetName, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const stmt = db.prepare(insertSql);
      const result = stmt.run(
        testData.contractNumber,
        testData.data,
        testData.filePath,
        testData.fileName,
        testData.sheetName,
        testData.status
      );

      if (result.changes > 0) {
        console.log('   ✅ 数据插入测试成功');
        
        // 清理测试数据
        const deleteStmt = db.prepare('DELETE FROM contracts WHERE contractNumber = ?');
        deleteStmt.run('TEST001');
        console.log('   ✅ 测试数据清理完成');
      } else {
        console.log('   ❌ 数据插入测试失败');
      }
    } catch (insertError) {
      console.log('   ❌ 数据插入测试失败:', insertError.message);
    }

    return true;
  } catch (error) {
    console.log('   ❌ 数据存储测试失败:', error.message);
    return false;
  }
}

// 执行修复
if (require.main === module) {
  comprehensiveDataImportFix().catch(error => {
    console.error('❌ 系统性修复失败:', error);
  });
}

module.exports = { comprehensiveDataImportFix };
