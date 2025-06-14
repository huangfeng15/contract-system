/**
 * 运行测试并检查覆盖率
 */

import { spawn } from 'child_process';
import { join } from 'path';
import fs from 'fs';

const projectRoot = process.cwd();

console.log('🧪 开始运行数据库模块测试...\n');

// 测试配置
const testConfig = {
  testFiles: [
    'tests/unit/database-simple.test.js',
    'tests/unit/database-comprehensive.test.js'
  ],
  coverageThreshold: 90,
  timeout: 60000
};

// 运行测试的函数
function runTests() {
  return new Promise((resolve, reject) => {
    console.log('📋 运行测试文件:');
    testConfig.testFiles.forEach(file => {
      console.log(`   • ${file}`);
    });
    console.log('');

    // 检查测试文件是否存在
    const missingFiles = testConfig.testFiles.filter(file => {
      const filePath = join(projectRoot, file);
      return !fs.existsSync(filePath);
    });

    if (missingFiles.length > 0) {
      console.log('❌ 以下测试文件不存在:');
      missingFiles.forEach(file => console.log(`   • ${file}`));
      reject(new Error('测试文件缺失'));
      return;
    }

    // 运行vitest
    const vitestArgs = [
      'run',
      '--coverage',
      '--reporter=verbose',
      '--reporter=json',
      '--outputFile=test-results.json',
      ...testConfig.testFiles
    ];

    console.log('🔄 执行命令: npx vitest ' + vitestArgs.join(' '));
    console.log('');

    const vitestProcess = spawn('npx', ['vitest', ...vitestArgs], {
      stdio: 'pipe',
      shell: true,
      cwd: projectRoot
    });

    let stdout = '';
    let stderr = '';

    vitestProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    vitestProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    vitestProcess.on('close', (code) => {
      console.log('\n📊 测试执行完成\n');
      
      if (code === 0) {
        console.log('✅ 所有测试通过');
        resolve({ stdout, stderr, code });
      } else {
        console.log(`❌ 测试失败，退出码: ${code}`);
        reject(new Error(`测试失败，退出码: ${code}`));
      }
    });

    vitestProcess.on('error', (error) => {
      console.error('❌ 测试进程错误:', error);
      reject(error);
    });

    // 设置超时
    setTimeout(() => {
      vitestProcess.kill();
      reject(new Error('测试超时'));
    }, testConfig.timeout);
  });
}

// 分析测试结果
function analyzeResults() {
  console.log('📈 分析测试结果...\n');

  // 检查测试结果文件
  const resultsPath = join(projectRoot, 'test-results.json');
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      
      console.log('📋 测试统计:');
      console.log(`   总测试数: ${results.numTotalTests || 0}`);
      console.log(`   通过: ${results.numPassedTests || 0}`);
      console.log(`   失败: ${results.numFailedTests || 0}`);
      console.log(`   跳过: ${results.numPendingTests || 0}`);
      console.log(`   成功率: ${((results.numPassedTests || 0) / (results.numTotalTests || 1) * 100).toFixed(1)}%`);
      console.log('');

      // 清理结果文件
      fs.unlinkSync(resultsPath);
    } catch (error) {
      console.log('⚠️  无法解析测试结果文件');
    }
  }

  // 检查覆盖率报告
  const coveragePath = join(projectRoot, 'coverage');
  if (fs.existsSync(coveragePath)) {
    const coverageJsonPath = join(coveragePath, 'coverage-summary.json');
    if (fs.existsSync(coverageJsonPath)) {
      try {
        const coverage = JSON.parse(fs.readFileSync(coverageJsonPath, 'utf-8'));
        
        console.log('📊 代码覆盖率:');
        if (coverage.total) {
          const { lines, functions, branches, statements } = coverage.total;
          
          console.log(`   行覆盖率: ${lines.pct}%`);
          console.log(`   函数覆盖率: ${functions.pct}%`);
          console.log(`   分支覆盖率: ${branches.pct}%`);
          console.log(`   语句覆盖率: ${statements.pct}%`);
          console.log('');

          // 检查是否达到阈值
          const minCoverage = Math.min(lines.pct, functions.pct, branches.pct, statements.pct);
          if (minCoverage >= testConfig.coverageThreshold) {
            console.log(`✅ 代码覆盖率达标 (${minCoverage}% >= ${testConfig.coverageThreshold}%)`);
            return true;
          } else {
            console.log(`❌ 代码覆盖率不达标 (${minCoverage}% < ${testConfig.coverageThreshold}%)`);
            return false;
          }
        }
      } catch (error) {
        console.log('⚠️  无法解析覆盖率报告');
      }
    }
  }

  console.log('⚠️  未找到覆盖率报告');
  return false;
}

// 生成测试报告
function generateReport(success, coverageOk) {
  console.log('\n📄 生成测试报告...\n');

  const report = {
    timestamp: new Date().toISOString(),
    success,
    coverageOk,
    testConfig,
    summary: {
      allTestsPassed: success,
      coverageThresholdMet: coverageOk,
      overallStatus: success && coverageOk ? 'PASS' : 'FAIL'
    }
  };

  const reportPath = join(projectRoot, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('📋 测试报告摘要:');
  console.log(`   测试状态: ${success ? '✅ 通过' : '❌ 失败'}`);
  console.log(`   覆盖率状态: ${coverageOk ? '✅ 达标' : '❌ 不达标'}`);
  console.log(`   总体状态: ${report.summary.overallStatus}`);
  console.log(`   报告文件: ${reportPath}`);
  console.log('');

  return report.summary.overallStatus === 'PASS';
}

// 主函数
async function main() {
  try {
    // 运行测试
    await runTests();
    
    // 分析结果
    const coverageOk = analyzeResults();
    
    // 生成报告
    const overallSuccess = generateReport(true, coverageOk);
    
    if (overallSuccess) {
      console.log('🎉 数据库模块测试完全通过！');
      console.log('   • 所有单元测试通过');
      console.log('   • 代码覆盖率达标 (>90%)');
      console.log('   • 数据库模块质量优秀');
      process.exit(0);
    } else {
      console.log('⚠️  测试部分通过，但覆盖率需要改进');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    
    // 生成失败报告
    generateReport(false, false);
    
    console.log('\n💡 建议检查:');
    console.log('   • 确保所有依赖已安装 (npm install)');
    console.log('   • 检查测试文件语法');
    console.log('   • 查看详细错误信息');
    
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);
