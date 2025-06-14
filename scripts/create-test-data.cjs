const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 确保测试数据目录存在
const testDataDir = path.join(__dirname, '..', 'tests', 'fixtures');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// 创建合同测试数据
const contractData = [
  ['合同序号', '合同编号', '合同名称', '经办人', '甲方', '乙方', '联系方式', '含税价', '签订日期', '工期', '履约担保退回时间'],
  ['001', 'HT2024001', '办公设备采购合同', '张三', '某公司', '供应商A', '13800138000', 50000, '2024-01-15', '30天', '2024-03-15'],
  ['002', 'HT2024002', '软件开发合同', '李四', '某公司', '开发商B', '13900139000', 120000, '2024-02-01', '90天', '2024-06-01'],
  ['003', 'HT2024003', '装修工程合同', '王五', '某公司', '装修公司C', '13700137000', 80000, '2024-03-01', '60天', '2024-07-01']
];

// 创建采购测试数据
const procurementData = [
  ['招采编号', '招采名称', '采购人', '计划完成日期', '需求审批日期', '采购经办人', '需求部门', '需求联系人', '预算金额', '控制价', '中标价', '采购平台', '采购方式', '评标方法', '定标方法', '开标日期', '评标委员会', '定标委员会', '结果公示日期', '公告发布日期', '中标人', '中标人联系方式'],
  ['ZC2024001', '办公用品采购', '采购部', '2024-03-01', '2024-01-15', '赵六', '行政部', '钱七', 30000, 28000, 25000, '政府采购网', '公开招标', '综合评分法', '最低价法', '2024-02-15', '专家组A', '专家组B', '2024-02-20', '2024-01-20', '供应商甲', '13600136000'],
  ['ZC2024002', '设备维护服务', '技术部', '2024-04-01', '2024-02-01', '孙八', '技术部', '周九', 60000, 58000, 55000, '企业采购平台', '竞争性谈判', '技术评分法', '综合评分法', '2024-03-15', '专家组C', '专家组D', '2024-03-20', '2024-02-20', '服务商乙', '13500135000']
];

// 创建工作簿
const wb = XLSX.utils.book_new();

// 添加合同工作表
const contractWs = XLSX.utils.aoa_to_sheet(contractData);
XLSX.utils.book_append_sheet(wb, contractWs, '合同数据');

// 添加采购工作表
const procurementWs = XLSX.utils.aoa_to_sheet(procurementData);
XLSX.utils.book_append_sheet(wb, procurementWs, '采购数据');

// 保存文件
const filePath = path.join(testDataDir, 'test-contract-procurement.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`测试Excel文件已创建: ${filePath}`);

// 创建只有合同数据的文件
const contractOnlyWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(contractOnlyWb, contractWs, '合同数据');
const contractOnlyPath = path.join(testDataDir, 'test-contract-only.xlsx');
XLSX.writeFile(contractOnlyWb, contractOnlyPath);

console.log(`合同专用测试文件已创建: ${contractOnlyPath}`);

// 创建只有采购数据的文件
const procurementOnlyWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(procurementOnlyWb, procurementWs, '采购数据');
const procurementOnlyPath = path.join(testDataDir, 'test-procurement-only.xlsx');
XLSX.writeFile(procurementOnlyWb, procurementOnlyPath);

console.log(`采购专用测试文件已创建: ${procurementOnlyPath}`);
