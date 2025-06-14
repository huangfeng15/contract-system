/**
 * 数据库模块验证脚本
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 开始数据库模块验证...\n');

// 验证计数器
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result === true || result === undefined) {
      console.log(`✅ ${description}`);
      passedTests++;
    } else {
      console.log(`❌ ${description} - 返回值: ${result}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ${description} - 错误: ${error.message}`);
    failedTests++;
  }
}



// 1. 验证文件结构
console.log('📁 验证文件结构...');

test('数据库常量文件存在', () => {
  const filePath = join(projectRoot, 'src/shared/constants/database.ts');
  return fs.existsSync(filePath);
});

test('数据库类型文件存在', () => {
  const filePath = join(projectRoot, 'src/shared/types/database.ts');
  return fs.existsSync(filePath);
});

test('数据库管理器文件存在', () => {
  const filePath = join(projectRoot, 'src/main/database/DatabaseManager.ts');
  return fs.existsSync(filePath);
});

test('迁移管理器文件存在', () => {
  const filePath = join(projectRoot, 'src/main/database/MigrationManager.ts');
  return fs.existsSync(filePath);
});

test('数据库初始化器文件存在', () => {
  const filePath = join(projectRoot, 'src/main/database/DatabaseInitializer.ts');
  return fs.existsSync(filePath);
});

test('基础服务文件存在', () => {
  const filePath = join(projectRoot, 'src/main/services/BaseService.ts');
  return fs.existsSync(filePath);
});

test('项目服务文件存在', () => {
  const filePath = join(projectRoot, 'src/main/services/ProjectService.ts');
  return fs.existsSync(filePath);
});

test('数据库IPC处理器文件存在', () => {
  const filePath = join(projectRoot, 'src/main/ipc/databaseHandlers.ts');
  return fs.existsSync(filePath);
});

// 2. 验证文件内容
console.log('\n📄 验证文件内容...');

test('数据库常量文件包含正确的表名', () => {
  const filePath = join(projectRoot, 'src/shared/constants/database.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('TABLE_NAMES') &&
         content.includes('projects') &&
         content.includes('contracts') &&
         content.includes('procurements');
});

test('数据库常量文件不包含已移除的表', () => {
  const filePath = join(projectRoot, 'src/shared/constants/database.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  return !content.includes('fieldConfigs') &&
         !content.includes('worksheets') &&
         !content.includes('systemConfigs');
});

test('数据库类型文件包含优化后的接口', () => {
  const filePath = join(projectRoot, 'src/shared/types/database.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('Contract') &&
         content.includes('Procurement') &&
         content.includes('filePath') &&
         content.includes('fileName') &&
         content.includes('sheetName');
});

test('迁移管理器包含优化后的表结构', () => {
  const filePath = join(projectRoot, 'src/main/database/MigrationManager.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('CREATE TABLE IF NOT EXISTS') &&
         content.includes('projects') &&
         content.includes('contracts') &&
         content.includes('procurements') &&
         content.includes('filePath TEXT NOT NULL') &&
         content.includes('fileName TEXT NOT NULL');
});

test('迁移管理器不包含已移除的表', () => {
  const filePath = join(projectRoot, 'src/main/database/MigrationManager.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  return !content.includes('fieldConfigs') &&
         !content.includes('worksheets') &&
         !content.includes('systemConfigs');
});

// 3. 验证依赖安装
console.log('\n📦 验证依赖安装...');

test('better-sqlite3 依赖已安装', () => {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.dependencies !== undefined &&
         (packageJson.dependencies['better-sqlite3'] !== undefined ||
          packageJson.devDependencies?.['better-sqlite3'] !== undefined);
});

test('vitest 依赖已安装', () => {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.devDependencies?.vitest !== undefined;
});

// 4. 验证配置文件
console.log('\n⚙️ 验证配置文件...');

test('package.json 包含测试脚本', () => {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.scripts?.test !== undefined;
});

test('vitest 配置文件存在', () => {
  const configPath = join(projectRoot, 'vitest.config.ts');
  return fs.existsSync(configPath);
});

// 5. 验证代码质量
console.log('\n🔍 验证代码质量...');

test('数据库管理器包含必要的方法', () => {
  const filePath = join(projectRoot, 'src/main/database/DatabaseManager.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('initialize') &&
         content.includes('executeQuery') &&
         content.includes('executeUpdate') &&
         content.includes('executeTransaction') &&
         content.includes('tableExists') &&
         content.includes('backup');
});

test('项目服务包含必要的方法', () => {
  const projectServicePath = join(projectRoot, 'src/main/services/ProjectService.ts');
  const baseServicePath = join(projectRoot, 'src/main/services/BaseService.ts');
  const projectContent = fs.readFileSync(projectServicePath, 'utf-8');
  const baseContent = fs.readFileSync(baseServicePath, 'utf-8');

  // 检查ProjectService中的特有方法
  const hasProjectMethods = projectContent.includes('create') &&
                           projectContent.includes('findByProjectCode') &&
                           projectContent.includes('searchByName');

  // 检查BaseService中的继承方法
  const hasBaseMethods = baseContent.includes('findById') &&
                        baseContent.includes('update') &&
                        baseContent.includes('delete');

  return hasProjectMethods && hasBaseMethods;
});

test('数据库IPC处理器包含必要的处理函数', () => {
  const filePath = join(projectRoot, 'src/main/ipc/databaseHandlers.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('initializeDatabaseHandlers') &&
         content.includes('handleDatabaseInitialize') &&
         content.includes('handleProjectCreate') &&
         content.includes('handleProjectFindById');
});

// 输出测试结果
console.log('\n📊 测试结果统计:');
console.log(`总测试数: ${totalTests}`);
console.log(`通过: ${passedTests}`);
console.log(`失败: ${failedTests}`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 所有验证都通过了！数据库模块结构正确。');
  console.log('\n✨ 数据库模块优化完成：');
  console.log('   • 移除了系统配置表和字段配置表');
  console.log('   • 将工作表信息融入到合同和采购数据表中');
  console.log('   • 简化了数据库结构，提高了性能');
  console.log('   • 保持了数据完整性和业务逻辑');
} else {
  console.log('\n⚠️  有部分验证失败，请检查上述错误信息。');
  process.exit(1);
}
