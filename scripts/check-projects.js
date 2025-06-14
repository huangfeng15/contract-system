/**
 * 数据库项目数据检查脚本
 * 用于直接查询数据库中的项目数据，帮助调试删除问题
 */

import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

// 数据库路径
const dbPath = path.join(
  os.homedir(),
  'AppData/Roaming/contract-management-system/contracts.db'
);

console.log('数据库路径:', dbPath);

try {
  // 连接数据库
  const db = new Database(dbPath);

  console.log('\n=== 数据库连接成功 ===');

  // 1. 检查projects表是否存在
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='projects'
  `).get();

  if (!tableExists) {
    console.log('❌ projects表不存在');
    process.exit(1);
  }

  console.log('✅ projects表存在');

  // 2. 查询所有项目数据
  console.log('\n=== 所有项目数据 ===');
  const allProjects = db.prepare('SELECT * FROM projects ORDER BY id').all();

  if (allProjects.length === 0) {
    console.log('📝 数据库中没有项目数据');
  } else {
    console.log(`📊 找到 ${allProjects.length} 个项目:`);
    allProjects.forEach(project => {
      console.log(`  ID: ${project.id} | 编号: ${project.projectCode} | 名称: ${project.projectName} | 状态: ${project.status}`);
    });
  }

  // 3. 检查特定ID的项目
  const targetId = 3;
  console.log(`\n=== 检查ID为${targetId}的项目 ===`);
  const targetProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(targetId);

  if (targetProject) {
    console.log('✅ 找到目标项目:');
    console.log('  ID:', targetProject.id);
    console.log('  项目编号:', targetProject.projectCode);
    console.log('  项目名称:', targetProject.projectName);
    console.log('  项目别名:', targetProject.projectAlias);
    console.log('  描述:', targetProject.description);
    console.log('  状态:', targetProject.status);
    console.log('  创建时间:', targetProject.createdAt);
    console.log('  更新时间:', targetProject.updatedAt);
  } else {
    console.log(`❌ 未找到ID为${targetId}的项目`);
  }

  // 4. 检查数据类型
  console.log('\n=== 数据类型检查 ===');
  if (allProjects.length > 0) {
    const firstProject = allProjects[0];
    console.log('第一个项目的ID类型:', typeof firstProject.id);
    console.log('第一个项目的ID值:', firstProject.id);
  }

  // 5. 测试删除查询（不实际执行）
  console.log('\n=== 删除查询测试 ===');
  const deleteStmt = db.prepare('DELETE FROM projects WHERE id = ?');
  console.log('删除语句准备成功');

  // 6. 检查表结构
  console.log('\n=== 表结构信息 ===');
  const tableInfo = db.prepare('PRAGMA table_info(projects)').all();
  tableInfo.forEach(column => {
    console.log(`  ${column.name}: ${column.type} (nullable: ${column.notnull === 0})`);
  });

  db.close();
  console.log('\n✅ 数据库检查完成');

} catch (error) {
  console.error('❌ 数据库检查失败:', error.message);
  console.error('错误详情:', error);
  process.exit(1);
}
