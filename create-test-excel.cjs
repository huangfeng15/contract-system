/**
 * 创建真正的Excel测试文件
 * 解决数据导入问题的第一步：创建真实的测试数据
 */

const XLSX = require('xlsx');
const path = require('path');

function createTestExcelFile() {
  console.log('开始创建真实的Excel测试文件...');

  // 创建工作簿
  const workbook = XLSX.utils.book_new();

  // 合同数据
  const contractData = [
    ['合同编号', '合同名称', '甲方', '乙方', '合同金额', '签订日期', '工期', '履约担保退回时间'],
    ['HT001', '办公楼装修合同', '某某公司', '装修公司A', '500000', '2024-01-15', '90天', '2024-06-15'],
    ['HT002', '设备采购合同', '某某公司', '设备供应商B', '800000', '2024-02-01', '60天', '2024-05-01'],
    ['HT003', '软件开发合同', '某某公司', '软件公司C', '1200000', '2024-03-01', '180天', '2024-10-01'],
    ['HT004', '物业服务合同', '某某公司', '物业公司D', '300000', '2024-01-01', '365天', '2025-01-01'],
    ['HT005', '清洁服务合同', '某某公司', '清洁公司E', '120000', '2024-02-15', '365天', '2025-02-15']
  ];

  // 采购数据
  const procurementData = [
    ['招采编号', '招采名称', '采购人', '公告日期', '开标日期', '中标日期', '预算控制价', '中标价', '采购方式', '评标方法'],
    ['ZC001', '办公设备采购', '采购部', '2024-01-10', '2024-01-20', '2024-01-25', '200000', '180000', '公开招标', '综合评分法'],
    ['ZC002', '车辆采购项目', '行政部', '2024-02-05', '2024-02-15', '2024-02-20', '500000', '480000', '公开招标', '最低评标价法'],
    ['ZC003', '食堂服务采购', '后勤部', '2024-03-01', '2024-03-10', '2024-03-15', '300000', '280000', '竞争性谈判', '综合评分法'],
    ['ZC004', '安保服务采购', '安全部', '2024-01-20', '2024-01-30', '2024-02-05', '400000', '380000', '公开招标', '综合评分法'],
    ['ZC005', '培训服务采购', '人事部', '2024-02-10', '2024-02-20', '2024-02-25', '150000', '140000', '竞争性磋商', '综合评分法']
  ];

  // 创建合同工作表
  const contractWorksheet = XLSX.utils.aoa_to_sheet(contractData);
  XLSX.utils.book_append_sheet(workbook, contractWorksheet, '合同数据');

  // 创建采购工作表
  const procurementWorksheet = XLSX.utils.aoa_to_sheet(procurementData);
  XLSX.utils.book_append_sheet(workbook, procurementWorksheet, '采购数据');

  // 创建混合数据工作表（包含合同和采购数据）
  const mixedData = [
    ['数据类型', '编号', '名称', '金额', '日期', '备注'],
    ['合同', 'HT006', '测试合同1', '600000', '2024-04-01', '测试用合同数据'],
    ['采购', 'ZC006', '测试采购1', '250000', '2024-04-05', '测试用采购数据'],
    ['合同', 'HT007', '测试合同2', '750000', '2024-04-10', '测试用合同数据'],
    ['采购', 'ZC007', '测试采购2', '350000', '2024-04-15', '测试用采购数据']
  ];
  const mixedWorksheet = XLSX.utils.aoa_to_sheet(mixedData);
  XLSX.utils.book_append_sheet(workbook, mixedWorksheet, '混合数据');

  // 保存文件
  const filePath = path.join(__dirname, 'test-contract-procurement-data.xlsx');
  XLSX.writeFile(workbook, filePath);

  console.log(`✅ Excel测试文件创建成功: ${filePath}`);
  
  // 创建第二个测试文件 - 只包含合同数据
  const contractOnlyWorkbook = XLSX.utils.book_new();
  const contractOnlyWorksheet = XLSX.utils.aoa_to_sheet(contractData);
  XLSX.utils.book_append_sheet(contractOnlyWorkbook, contractOnlyWorksheet, '合同台账');
  
  const contractOnlyPath = path.join(__dirname, 'test-contract-only.xlsx');
  XLSX.writeFile(contractOnlyWorkbook, contractOnlyPath);
  console.log(`✅ 合同专用测试文件创建成功: ${contractOnlyPath}`);

  // 创建第三个测试文件 - 只包含采购数据
  const procurementOnlyWorkbook = XLSX.utils.book_new();
  const procurementOnlyWorksheet = XLSX.utils.aoa_to_sheet(procurementData);
  XLSX.utils.book_append_sheet(procurementOnlyWorkbook, procurementOnlyWorksheet, '采购台账');
  
  const procurementOnlyPath = path.join(__dirname, 'test-procurement-only.xlsx');
  XLSX.writeFile(procurementOnlyWorkbook, procurementOnlyPath);
  console.log(`✅ 采购专用测试文件创建成功: ${procurementOnlyPath}`);

  return {
    mixedFile: filePath,
    contractFile: contractOnlyPath,
    procurementFile: procurementOnlyPath
  };
}

// 验证文件创建
function verifyExcelFiles(files) {
  console.log('\n开始验证Excel文件...');
  
  Object.entries(files).forEach(([type, filePath]) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      console.log(`✅ ${type}: ${path.basename(filePath)}`);
      console.log(`   工作表: ${sheetNames.join(', ')}`);
      
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`   ${sheetName}: ${data.length}行数据`);
      });
    } catch (error) {
      console.error(`❌ 验证文件失败 ${filePath}:`, error.message);
    }
  });
}

// 执行创建和验证
if (require.main === module) {
  try {
    const files = createTestExcelFile();
    verifyExcelFiles(files);
    console.log('\n🎉 所有测试文件创建完成！现在可以进行真正的数据导入测试了。');
  } catch (error) {
    console.error('❌ 创建测试文件失败:', error);
  }
}

module.exports = { createTestExcelFile, verifyExcelFiles };
