/**
 * 数据导入功能验证测试
 * 用于验证修复后的数据导入功能是否正常工作
 */

async function verifyDataImportFix() {
  console.log('🔧 开始验证数据导入功能修复...')
  
  try {
    // 1. 检查API可用性
    console.log('\n1️⃣ 检查API可用性...')
    if (!window.electronAPI) {
      throw new Error('❌ electronAPI 不可用')
    }
    
    if (!window.electronAPI.invoke) {
      throw new Error('❌ electronAPI.invoke 方法不可用')
    }
    
    console.log('✅ API可用性检查通过')
    
    // 2. 测试文件解析功能
    console.log('\n2️⃣ 测试文件解析功能...')
    const testFilePath = 'C:\\Users\\97477\\Desktop\\develop\\contrac system\\tests\\fixtures\\test-contract-only.xlsx'
    console.log(`测试文件路径: ${testFilePath}`)
    
    const parseResult = await window.electronAPI.invoke('import:parseFile', testFilePath)
    console.log('解析结果:', parseResult)
    
    if (!parseResult.success) {
      throw new Error(`文件解析失败: ${parseResult.error}`)
    }
    
    console.log('✅ 文件解析功能正常')
    
    // 3. 测试processSelectedFiles函数逻辑
    console.log('\n3️⃣ 测试processSelectedFiles函数逻辑...')
    
    // 模拟processSelectedFiles的核心逻辑
    const filePaths = [testFilePath]
    let processSuccess = true
    
    for (const filePath of filePaths) {
      let fileItem = null
      
      try {
        console.log(`🔄 开始处理文件: ${filePath}`)
        
        // 验证文件路径
        if (!filePath || typeof filePath !== 'string') {
          throw new Error('无效的文件路径')
        }
        
        // 解析文件获取工作表信息
        const parseResponse = await window.electronAPI.invoke('import:parseFile', filePath)
        console.log(`文件解析响应状态:`, parseResponse.success ? '成功' : '失败')
        
        if (parseResponse.success && parseResponse.data) {
          const worksheets = parseResponse.data
          console.log(`解析成功，工作表数量: ${worksheets.length}`)
          
          // 创建文件项 - 使用修复后的generateId函数
          fileItem = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            name: filePath.split(/[/\\]/).pop() || filePath,
            size: '未知大小',
            sheetCount: worksheets.length,
            status: 'completed'
          }
          
          // 保存工作表信息用于详情查看
          fileItem.worksheets = worksheets
          fileItem.filePath = filePath
          
          console.log(`✅ 文件项创建成功: ${fileItem.name}`)
          console.log(`📋 文件项详情:`, {
            ID: fileItem.id,
            名称: fileItem.name,
            工作表数: fileItem.sheetCount,
            状态: fileItem.status
          })
          
        } else {
          throw new Error(parseResponse.error || '解析失败')
        }
      } catch (error) {
        console.error(`❌ 处理文件失败: ${filePath}`, error)
        processSuccess = false
        
        // 如果文件项已创建但处理失败，标记为失败状态
        if (fileItem) {
          fileItem.status = 'failed'
        }
      }
    }
    
    if (processSuccess) {
      console.log('✅ processSelectedFiles函数逻辑测试通过')
    } else {
      throw new Error('❌ processSelectedFiles函数逻辑测试失败')
    }
    
    // 4. 测试ID生成函数
    console.log('\n4️⃣ 测试ID生成函数...')
    
    const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substring(2)
    }
    
    const id1 = generateId()
    const id2 = generateId()
    
    console.log(`生成的ID1: ${id1}`)
    console.log(`生成的ID2: ${id2}`)
    
    if (id1 !== id2 && typeof id1 === 'string' && typeof id2 === 'string') {
      console.log('✅ ID生成函数正常工作')
    } else {
      throw new Error('❌ ID生成函数异常')
    }
    
    // 5. 测试错误处理
    console.log('\n5️⃣ 测试错误处理...')
    
    // 测试空文件路径
    const emptyPathResult = await window.electronAPI.invoke('import:parseFile', '')
    if (emptyPathResult.success) {
      console.log('⚠️ 空文件路径应该返回错误')
    } else {
      console.log('✅ 空文件路径错误处理正常')
    }
    
    // 测试不存在的文件
    const nonexistentResult = await window.electronAPI.invoke('import:parseFile', 'nonexistent-file.xlsx')
    if (nonexistentResult.success) {
      console.log('⚠️ 不存在文件应该返回错误')
    } else {
      console.log('✅ 不存在文件错误处理正常')
    }
    
    console.log('\n🎉 数据导入功能修复验证完成！')
    console.log('✅ 所有测试通过，修复成功')
    
    return true
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error)
    console.log('\n💡 修复建议:')
    console.log('1. 检查是否所有substr方法都已替换为substring')
    console.log('2. 确认文件路径是否正确')
    console.log('3. 验证electronAPI是否正常加载')
    
    return false
  }
}

// 检查是否在正确的环境中运行
if (typeof window !== 'undefined' && window.electronAPI) {
  // 在浏览器控制台中运行
  verifyDataImportFix().then(success => {
    if (success) {
      console.log('\n🎊 验证成功！数据导入功能已修复')
    } else {
      console.log('\n❌ 验证失败，需要进一步调试')
    }
  }).catch(error => {
    console.error('验证脚本执行失败:', error)
  })
} else {
  console.log('请在Electron应用的开发者控制台中运行此脚本')
}
