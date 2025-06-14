#!/usr/bin/env node

/**
 * 环境检查脚本
 * 检查开发环境是否满足项目要求
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔍 检查开发环境...\n')

// 检查Node.js版本
function checkNodeVersion() {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  console.log(`Node.js 版本: ${nodeVersion}`)
  
  if (majorVersion < 18) {
    console.error('❌ Node.js 版本过低，需要 18.0.0 或更高版本')
    process.exit(1)
  } else {
    console.log('✅ Node.js 版本符合要求')
  }
}

// 检查npm版本
function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    console.log(`npm 版本: ${npmVersion}`)
    console.log('✅ npm 可用')
  } catch (error) {
    console.error('❌ npm 不可用')
    process.exit(1)
  }
}

// 检查必要文件
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    '.env'
  ]
  
  console.log('\n检查必要文件:')
  
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file} 缺失`)
    }
  }
}

// 检查依赖安装
function checkDependencies() {
  console.log('\n检查依赖安装:')
  
  if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log('✅ node_modules 存在')
  } else {
    console.log('❌ node_modules 不存在，请运行 npm install')
  }
}

// 主函数
function main() {
  try {
    checkNodeVersion()
    checkNpmVersion()
    checkRequiredFiles()
    checkDependencies()
    
    console.log('\n🎉 环境检查完成！')
  } catch (error) {
    console.error('\n💥 环境检查失败:', error.message)
    process.exit(1)
  }
}

main()
