/**
 * Electron端到端测试运行脚本
 * 确保在Electron环境下运行完整的测试套件
 */

import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 测试配置
const TEST_CONFIG = {
  timeout: 300000, // 5分钟超时
  retries: 2,
  workers: 1, // 单线程执行避免数据库冲突
  reporter: ['html', 'json', 'line'],
  outputDir: 'test-results/electron-e2e'
}

// 测试项目列表
const TEST_PROJECTS = [
  'field-management-e2e',
  'project-management-e2e',
  'integration-e2e'
]

class ElectronE2ETestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      details: []
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始运行Electron端到端测试...')
    console.log('=' .repeat(60))

    const startTime = Date.now()

    try {
      // 检查环境
      await this.checkEnvironment()

      // 构建应用
      await this.buildApplication()

      // 运行测试
      for (const project of TEST_PROJECTS) {
        await this.runTestProject(project)
      }

      // 生成报告
      this.results.duration = Date.now() - startTime
      await this.generateReport()

      // 输出结果
      this.printResults()

      // 检查测试通过率
      const passRate = (this.results.passed / this.results.total) * 100
      if (passRate < 100) {
        console.error(`❌ 测试通过率 ${passRate.toFixed(1)}% 未达到100%要求`)
        process.exit(1)
      }

      console.log('✅ 所有测试通过！')

    } catch (error) {
      console.error('❌ 测试运行失败:', error.message)
      process.exit(1)
    }
  }

  /**
   * 检查测试环境
   */
  async checkEnvironment() {
    console.log('🔍 检查测试环境...')

    // 检查必需文件
    const requiredFiles = [
      'package.json',
      'playwright-electron.config.ts',
      'dist-electron/main/main.cjs'
    ]

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`缺少必需文件: ${file}`)
      }
    }

    // 检查测试文件
    for (const project of TEST_PROJECTS) {
      const testFile = `tests/electron/e2e/${project}.test.ts`
      if (!fs.existsSync(testFile)) {
        throw new Error(`缺少测试文件: ${testFile}`)
      }
    }

    console.log('✅ 环境检查通过')
  }

  /**
   * 构建应用
   */
  async buildApplication() {
    console.log('🔨 构建Electron应用...')

    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'pipe',
        shell: true
      })

      let output = ''
      buildProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      buildProcess.stderr.on('data', (data) => {
        output += data.toString()
      })

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 应用构建成功')
          resolve()
        } else {
          console.error('构建输出:', output)
          reject(new Error(`应用构建失败，退出码: ${code}`))
        }
      })
    })
  }

  /**
   * 运行单个测试项目
   */
  async runTestProject(projectName) {
    console.log(`\n📋 运行测试项目: ${projectName}`)
    console.log('-'.repeat(40))

    const testFile = `tests/electron/e2e/${projectName}.test.ts`

    return new Promise((resolve, reject) => {
      const testProcess = spawn('npx', [
        'playwright', 'test',
        '--config=playwright-electron.config.ts',
        '--project=electron-e2e',
        testFile,
        '--reporter=json'
      ], {
        stdio: 'pipe',
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DB_PATH: ':memory:',
          LOG_LEVEL: 'error'
        }
      })

      let output = ''
      let errorOutput = ''

      testProcess.stdout.on('data', (data) => {
        const text = data.toString()
        output += text
        // 实时输出测试进度
        if (text.includes('✓') || text.includes('✗') || text.includes('Running')) {
          process.stdout.write(text)
        }
      })

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      testProcess.on('close', (code) => {
        try {
          // 解析测试结果
          const result = this.parseTestResult(output, projectName)
          this.results.details.push(result)
          this.results.total += result.total
          this.results.passed += result.passed
          this.results.failed += result.failed
          this.results.skipped += result.skipped

          console.log(`📊 ${projectName} 结果: ${result.passed}/${result.total} 通过`)

          if (result.failed > 0) {
            console.warn(`⚠️  ${projectName} 有 ${result.failed} 个测试失败`)
            console.log('错误输出:', errorOutput)
          }

          resolve()
        } catch (error) {
          console.error(`解析 ${projectName} 测试结果失败:`, error.message)
          console.log('原始输出:', output)
          console.log('错误输出:', errorOutput)
          reject(error)
        }
      })
    })
  }

  /**
   * 解析测试结果
   */
  parseTestResult(output, projectName) {
    const result = {
      project: projectName,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    }

    try {
      // 尝试解析JSON输出
      const lines = output.split('\n')
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('"stats"')) {
          const jsonResult = JSON.parse(line)
          if (jsonResult.stats) {
            result.total = jsonResult.stats.total || 0
            result.passed = jsonResult.stats.passed || 0
            result.failed = jsonResult.stats.failed || 0
            result.skipped = jsonResult.stats.skipped || 0
            result.duration = jsonResult.stats.duration || 0
            return result
          }
        }
      }

      // 如果JSON解析失败，使用文本解析
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      const skippedMatch = output.match(/(\d+) skipped/)

      result.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      result.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      result.skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0
      result.total = result.passed + result.failed + result.skipped

    } catch (error) {
      console.warn(`解析 ${projectName} 结果时出错:`, error.message)
      // 如果解析失败，假设有基本的测试运行
      result.total = 1
      result.failed = 1
    }

    return result
  }

  /**
   * 生成测试报告
   */
  async generateReport() {
    console.log('\n📄 生成测试报告...')

    const report = {
      timestamp: new Date().toISOString(),
      environment: 'Electron',
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        passRate: ((this.results.passed / this.results.total) * 100).toFixed(2),
        duration: this.results.duration
      },
      details: this.results.details
    }

    // 确保输出目录存在
    const outputDir = TEST_CONFIG.outputDir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 写入JSON报告
    const reportPath = path.join(outputDir, 'test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`✅ 测试报告已生成: ${reportPath}`)
  }

  /**
   * 打印测试结果
   */
  printResults() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试结果汇总')
    console.log('='.repeat(60))
    console.log(`总测试数: ${this.results.total}`)
    console.log(`通过: ${this.results.passed}`)
    console.log(`失败: ${this.results.failed}`)
    console.log(`跳过: ${this.results.skipped}`)
    console.log(`通过率: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`)
    console.log(`总耗时: ${(this.results.duration / 1000).toFixed(2)}秒`)

    console.log('\n📋 详细结果:')
    this.results.details.forEach(detail => {
      const status = detail.failed > 0 ? '❌' : '✅'
      console.log(`${status} ${detail.project}: ${detail.passed}/${detail.total} 通过`)
    })
    console.log('='.repeat(60))
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ElectronE2ETestRunner()
  runner.runAllTests().catch(error => {
    console.error('测试运行器失败:', error)
    process.exit(1)
  })
}

export default ElectronE2ETestRunner
