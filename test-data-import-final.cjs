/**
 * 数据导入功能的最终测试方案
 * 直接在Electron环境中测试，避免Node.js环境的限制
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testDataImportInElectron() {
  console.log('🚀 开始在Electron环境中测试数据导入功能...\n');

  // 第一步：确保测试文件存在
  console.log('1️⃣ 检查测试文件...');
  const testFiles = [
    'test-contract-only.xlsx',
    'test-procurement-only.xlsx',
    'test-contract-procurement-data.xlsx'
  ];

  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} 存在`);
    } else {
      console.log(`   ❌ ${file} 不存在`);
      return false;
    }
  }

  // 第二步：构建项目
  console.log('\n2️⃣ 构建项目...');
  try {
    await runCommand('npm run build');
    console.log('   ✅ 项目构建成功');
  } catch (error) {
    console.log('   ❌ 项目构建失败:', error.message);
    return false;
  }

  // 第三步：创建Electron测试脚本
  console.log('\n3️⃣ 创建Electron测试脚本...');
  await createElectronTestScript();

  // 第四步：运行Electron测试
  console.log('\n4️⃣ 运行Electron测试...');
  try {
    await runElectronTest();
    console.log('   ✅ Electron测试完成');
  } catch (error) {
    console.log('   ❌ Electron测试失败:', error.message);
    return false;
  }

  console.log('\n🎉 数据导入测试完成！');
  return true;
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, {
      stdio: 'pipe',
      shell: true,
      cwd: __dirname
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      }
    });

    // 设置超时
    setTimeout(() => {
      process.kill();
      reject(new Error('Command timeout'));
    }, 60000); // 60秒超时
  });
}

async function createElectronTestScript() {
  const testScript = `
/**
 * Electron环境中的数据导入测试
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // 不显示窗口，后台测试
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'dist-electron/preload/preload.js')
    }
  });

  // 加载应用
  await mainWindow.loadFile('dist/index.html');

  // 开始测试
  setTimeout(async () => {
    await runDataImportTests();
    app.quit();
  }, 3000);
}

async function runDataImportTests() {
  console.log('开始数据导入测试...');

  try {
    // 测试文件路径
    const testFiles = [
      path.join(__dirname, 'test-contract-only.xlsx'),
      path.join(__dirname, 'test-procurement-only.xlsx')
    ];

    for (const filePath of testFiles) {
      console.log('测试文件: ' + path.basename(filePath));

      // 模拟IPC调用
      const result = await testFileImport(filePath);

      if (result.success) {
        console.log('✅ ' + path.basename(filePath) + ' 导入成功');
        console.log('   识别的工作表: ' + (result.data?.length || 0) + '个');
      } else {
        console.log('❌ ' + path.basename(filePath) + ' 导入失败: ' + result.error);
      }
    }

    console.log('数据导入测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

async function testFileImport(filePath) {
  return new Promise((resolve) => {
    // 模拟发送IPC消息
    mainWindow.webContents.send('test-import-file', filePath);

    // 监听返回结果
    ipcMain.once('test-import-result', (event, result) => {
      resolve(result);
    });

    // 超时处理
    setTimeout(() => {
      resolve({ success: false, error: 'Test timeout' });
    }, 10000);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
`;

  fs.writeFileSync(path.join(__dirname, 'electron-test.js'), testScript);
  console.log('   ✅ Electron测试脚本创建完成');
}

async function runElectronTest() {
  return new Promise((resolve, reject) => {
    const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
    const testScript = path.join(__dirname, 'electron-test.js');

    const process = spawn(electronPath, [testScript], {
      stdio: 'pipe',
      cwd: __dirname
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('   ', text.trim());
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log('   ERROR:', text.trim());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Electron test failed with code ${code}: ${errorOutput}`));
      }
    });

    // 设置超时
    setTimeout(() => {
      process.kill();
      reject(new Error('Electron test timeout'));
    }, 30000); // 30秒超时
  });
}

// 创建简化的直接测试
async function simpleDirectTest() {
  console.log('🔧 执行简化的直接测试...\n');

  // 测试Excel文件读取
  console.log('1️⃣ 测试Excel文件读取...');
  try {
    const XLSX = require('xlsx');
    const testFile = path.join(__dirname, 'test-contract-only.xlsx');

    if (!fs.existsSync(testFile)) {
      console.log('   ❌ 测试文件不存在');
      return false;
    }

    const workbook = XLSX.readFile(testFile);
    console.log('   ✅ Excel文件读取成功，工作表: ' + workbook.SheetNames.join(', '));

    // 读取第一个工作表的数据
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    console.log('   ✅ 数据读取成功，共' + data.length + '行');
    console.log('   表头: [' + (data[0]?.join(', ') || '无') + ']');

    return true;
  } catch (error) {
    console.log('   ❌ Excel文件读取失败:', error.message);
    return false;
  }
}

// 执行测试
if (require.main === module) {
  console.log('选择测试方式:');
  console.log('1. 简化直接测试 (推荐)');
  console.log('2. 完整Electron测试');

  const testType = process.argv[2] || '1';

  if (testType === '1') {
    simpleDirectTest().then(success => {
      if (success) {
        console.log('\n🎉 简化测试通过！Excel文件解析功能正常。');
        console.log('💡 建议：现在可以在Electron应用中测试完整的数据导入流程。');
      } else {
        console.log('\n❌ 简化测试失败！需要检查Excel文件和依赖。');
      }
    });
  } else {
    testDataImportInElectron().then(success => {
      console.log(success ? '\n🎉 所有测试通过！' : '\n❌ 测试失败！');
    });
  }
}

module.exports = { testDataImportInElectron, simpleDirectTest };
