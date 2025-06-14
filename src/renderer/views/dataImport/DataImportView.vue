<template>
  <div class="data-import-view">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="page-title">
        <span class="page-icon">📥</span>
        数据导入
      </div>
      <div class="page-stats">
        📊 统计: 总文件 {{ importStats.total }} | 工作表总数 {{ importStats.totalSheets }}
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div class="upload-section-compact">
      <div
        class="upload-area-compact"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="selectFiles"
      >
        <div class="upload-content-compact">
          <div class="upload-icon">📁</div>
          <div class="upload-text">拖拽文件到此处或点击选择 (支持 .xlsx, .xls 格式，最大50MB)</div>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="action-toolbar">
      <div class="toolbar-left">
        <button class="btn btn-primary" @click="selectFiles">
          📁 选择文件
        </button>
        <button class="btn btn-secondary" @click="clearFiles" :disabled="importFileList.length === 0">
          🗑️ 清空列表
        </button>
        <button class="btn btn-secondary" @click="showImportSettings">
          ⚙️ 导入设置
        </button>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" @click="updateAllFiles" :disabled="importFileList.length === 0">
          🔄 手动更新所有文件数据
        </button>
        <button class="btn btn-test" @click="testDataImportFunction">
          🧪 测试数据导入功能
        </button>
      </div>
    </div>

    <!-- 文件列表区 -->
    <div class="import-table-section">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>文件名</th>
              <th>大小</th>
              <th>工作表数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(file, index) in importFileList" :key="file.id">
              <td>{{ index + 1 }}</td>
              <td>{{ file.name }}</td>
              <td>{{ file.size }}</td>
              <td>{{ file.sheetCount }}</td>
              <td>
                <span :class="getStatusClass(file.status)">
                  {{ getStatusText(file.status) }}
                </span>
              </td>
              <td>
                <button class="btn-action" @click="viewFileDetail(file)">📋 查看详情</button>
                <button class="btn-action" @click="deleteFile(file)">🗑️ 删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="import-note">
        💡 说明: 点击"查看详情"可查看文件中所有工作表的识别情况和数据统计
      </div>
    </div>

    <!-- 导入设置弹窗 -->
    <div v-if="showImportSettingsModal" class="modal-overlay show" @click.self="closeImportSettingsModal">
      <div class="modal-content import-settings-modal">
        <div class="modal-header">
          <h3 class="modal-title">导入设置</h3>
          <button class="modal-close" @click="closeImportSettingsModal">
            <span>×</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="import-settings-form">
            <div class="form-group">
              <label class="form-label">匹配模式:</label>
              <select v-model="importSettings.matchMode" class="form-select" name="matchMode">
                <option value="strict">精确匹配</option>
                <option value="fuzzy">模糊匹配</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">最少匹配字段数:</label>
              <input
                v-model.number="importSettings.minMatchFields"
                type="number"
                min="1"
                max="20"
                class="form-input"
                name="minMatchFields"
              />
            </div>

            <div class="form-group">
              <label class="form-label">跳过空行:</label>
              <div class="form-switch" @click="toggleSkipEmptyRows">
                <input
                  v-model="importSettings.skipEmptyRows"
                  type="checkbox"
                  class="switch-input"
                  name="skipEmptyRows"
                  @click.stop
                />
                <span class="switch-slider" @click.stop="toggleSkipEmptyRows"></span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">清理空格:</label>
              <div class="form-switch" @click="toggleTrimWhitespace">
                <input
                  v-model="importSettings.trimWhitespace"
                  type="checkbox"
                  class="switch-input"
                  name="trimWhitespace"
                  @click.stop
                />
                <span class="switch-slider" @click.stop="toggleTrimWhitespace"></span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">数据验证:</label>
              <div class="form-switch" @click="toggleValidateData">
                <input
                  v-model="importSettings.validateData"
                  type="checkbox"
                  class="switch-input"
                  name="validateData"
                  @click.stop
                />
                <span class="switch-slider" @click.stop="toggleValidateData"></span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">启用自动更新:</label>
              <div class="form-switch" @click="toggleAutoUpdate">
                <input
                  v-model="importSettings.autoUpdateEnabled"
                  type="checkbox"
                  class="switch-input"
                  @click.stop
                />
                <span class="switch-slider" @click.stop="toggleAutoUpdate"></span>
              </div>
            </div>

            <div class="form-group" v-if="importSettings.autoUpdateEnabled">
              <label class="form-label">更新频率:</label>
              <select v-model="importSettings.updateFrequency" class="form-select">
                <option value="hourly">每小时</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeImportSettingsModal">取消</button>
          <button class="btn btn-primary" @click="saveImportSettings">保存设置</button>
        </div>
      </div>
    </div>

    <!-- 文件详情弹窗 -->
    <div v-if="showFileDetailModal" class="modal-overlay show" @click.self="closeFileDetailModal">
      <div class="modal-content file-detail-modal">
        <div class="modal-header">
          <h3 class="modal-title">文件详情</h3>
          <button class="modal-close" @click="closeFileDetailModal">
            <span>×</span>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="selectedFileDetail" class="file-detail-content">
            <div class="file-info">
              <h3>{{ selectedFileDetail.name }}</h3>
              <p>工作表数量: {{ selectedFileDetail.sheetCount }}</p>
            </div>

            <div class="worksheets-list">
              <h4>识别结果</h4>
              <div v-for="worksheet in selectedFileDetail.worksheets" :key="worksheet.sheetName" class="worksheet-item">
                <div class="worksheet-header">
                  <span class="worksheet-name">{{ worksheet.sheetName }}</span>
                  <span :class="getRecognitionStatusClass(worksheet.recognitionStatus)" class="status-badge">
                    {{ getRecognitionStatusText(worksheet.recognitionStatus) }}
                  </span>
                </div>
                <div class="worksheet-details">
                  <div class="detail-row">
                    <span class="label">识别类型:</span>
                    <span class="value">{{ getSheetTypeText(worksheet.sheetType) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">匹配规则:</span>
                    <span class="value">{{ importSettings.matchMode === 'strict' ? '精确匹配' : '模糊匹配' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">标题行:</span>
                    <span class="value">第{{ worksheet.headerRow + 1 }}行</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">匹配字段:</span>
                    <span class="value">{{ worksheet.matchedFields?.length || 0 }}个</span>
                  </div>
                  <div v-if="worksheet.matchedFields && worksheet.matchedFields.length > 0" class="matched-fields">
                    <span class="field-list">{{ worksheet.matchedFields.join(', ') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeFileDetailModal">关闭</button>
          <button class="btn btn-primary" @click="importSelectedFile" :disabled="!canImportFile">导入此文件</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  ImportFileListItem,
  ImportSettings,
  WorksheetInfo,
  ImportStatistics
} from '@shared/types/import'

// 辅助函数 - 必须在使用前定义
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

const getFileName = (filePath: string): string => {
  return filePath.split(/[/\\]/).pop() || filePath
}

const getFileSize = (filePath: string): string => {
  // 简化实现，实际应该从文件系统获取
  return '未知大小'
}

// 响应式数据
const importFileList = ref<ImportFileListItem[]>([])
const showImportSettingsModal = ref(false)
const showFileDetailModal = ref(false)
const selectedFileDetail = ref<any>(null)

// 文件列表持久化键
const FILE_LIST_STORAGE_KEY = 'dataImport_fileList'

// 导入设置
const importSettings = reactive<ImportSettings>({
  matchMode: 'strict',
  minMatchFields: 3,
  skipEmptyRows: true,
  trimWhitespace: true,
  validateData: true,
  autoUpdateEnabled: false,
  updateFrequency: 'daily'
})

// 统计数据
const importStats = reactive<ImportStatistics>({
  total: 0,
  totalSheets: 0,
  recognized: 0,
  unrecognized: 0,
  imported: 0,
  failed: 0
})

// 计算属性
const canImportFile = computed(() => {
  return selectedFileDetail.value &&
         selectedFileDetail.value.worksheets &&
         selectedFileDetail.value.worksheets.some((ws: WorksheetInfo) => ws.recognitionStatus === 'recognized')
})

// 方法
const selectFiles = async (): Promise<void> => {
  try {
    if (window.electronAPI) {
      const response = await window.electronAPI.import.selectFiles()
      if (response.success && response.data) {
        await processSelectedFiles(response.data)
        ElMessage.success(`成功选择 ${response.data.length} 个文件`)
      } else {
        console.error('文件选择失败:', response.error)
        ElMessage.error(response.error || '文件选择失败')
      }
    } else {
      ElMessage.warning('请在Electron环境中运行')
    }
  } catch (error) {
    console.error('选择文件失败:', error)
    ElMessage.error(`选择文件失败: ${error}`)
  }
}

const processSelectedFiles = async (filePaths: string[]): Promise<void> => {
  for (const filePath of filePaths) {
    // 在循环开始就声明变量，避免作用域问题
    let fileItem: ImportFileListItem | null = null

    try {
      console.log(`开始处理文件: ${filePath}`)

      // 验证文件路径
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('无效的文件路径')
      }

      // 验证electronAPI是否可用
      if (!window.electronAPI || typeof window.electronAPI.invoke !== 'function') {
        throw new Error('electronAPI不可用')
      }

      // 解析文件获取工作表信息 - 使用更安全的调用方式
      let parseResponse: any
      try {
        parseResponse = await window.electronAPI.invoke('import:parseFile', filePath)
      } catch (invokeError) {
        console.error('IPC调用失败:', invokeError)
        throw new Error(`IPC调用失败: ${invokeError}`)
      }

      console.log(`文件解析响应:`, parseResponse)

      if (parseResponse && parseResponse.success && parseResponse.data) {
        const worksheets = parseResponse.data as WorksheetInfo[]
        console.log(`解析成功，工作表数量: ${worksheets.length}`)

        // 创建文件项 - 使用更安全的方式
        try {
          const fileId = generateId()
          const fileName = getFileName(filePath)
          const fileSize = getFileSize(filePath)

          fileItem = {
            id: fileId,
            name: fileName,
            size: fileSize,
            sheetCount: worksheets.length,
            status: 'completed'
          }

          // 保存工作表信息用于详情查看
          ;(fileItem as any).worksheets = worksheets
          ;(fileItem as any).filePath = filePath

          // 添加到文件列表
          importFileList.value.unshift(fileItem)
          console.log(`文件添加到列表: ${fileItem.name}`)

          // 保存到本地存储
          saveFileListToStorage()

          // 自动导入识别成功的文件
          const recognizedSheets = worksheets.filter(ws => ws.recognitionStatus === 'recognized')
          if (recognizedSheets.length > 0) {
            console.log(`文件 ${fileName} 识别成功，开始自动导入...`)
            await autoImportFile(filePath, worksheets)
          } else {
            console.log(`文件 ${fileName} 没有识别的工作表，跳过自动导入`)
            ElMessage.info(`文件 ${fileName} 已解析，但没有识别的工作表`)
          }
        } catch (createError) {
          console.error('创建文件项失败:', createError)
          throw new Error(`创建文件项失败: ${createError}`)
        }
      } else {
        const errorMsg = parseResponse?.error || '解析响应无效'
        console.error(`解析文件失败: ${filePath}`, errorMsg)
        ElMessage.error(`解析文件失败: ${getFileName(filePath)} - ${errorMsg}`)
      }
    } catch (error) {
      console.error(`处理文件失败: ${filePath}`, error)
      ElMessage.error(`处理文件失败: ${getFileName(filePath)} - ${error}`)

      // 如果文件项已创建但处理失败，标记为失败状态
      if (fileItem) {
        fileItem.status = 'failed'
        importFileList.value.unshift(fileItem)
      }
    }
  }

  updateImportStats()
}

// 自动导入文件
const autoImportFile = async (filePath: string, worksheets: WorksheetInfo[]): Promise<void> => {
  try {
    const recognizedSheets = worksheets.filter(ws => ws.recognitionStatus === 'recognized')
    if (recognizedSheets.length === 0) {
      console.log('没有识别的工作表，跳过自动导入')
      return
    }

    console.log(`开始自动导入文件: ${filePath}`)
    console.log(`识别的工作表数量: ${recognizedSheets.length}`)

    // 创建简单的设置对象
    const simpleSettings = {
      matchMode: importSettings.matchMode,
      minMatchFields: importSettings.minMatchFields,
      skipEmptyRows: importSettings.skipEmptyRows,
      trimWhitespace: importSettings.trimWhitespace,
      validateData: importSettings.validateData,
      autoUpdateEnabled: importSettings.autoUpdateEnabled,
      updateFrequency: importSettings.updateFrequency
    }

    console.log('自动导入设置:', simpleSettings)

    const response = await window.electronAPI.invoke('import:start', [filePath], simpleSettings)

    if (response.success) {
      console.log('自动导入启动成功，导入ID:', response.data)
      ElMessage.success(`自动导入开始：${getFileName(filePath)}，识别了 ${recognizedSheets.length} 个工作表`)

      // 监控导入进度
      const importId = response.data
      await monitorImportProgress(importId)
    } else {
      console.error('自动导入失败:', response.error)
      ElMessage.warning(`自动导入失败：${getFileName(filePath)} - ${response.error}`)
    }
  } catch (error) {
    console.error('自动导入过程失败:', error)
    ElMessage.error(`自动导入失败：${getFileName(filePath)} - ${error}`)
  }
}

const handleDrop = async (event: DragEvent): Promise<void> => {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const filePaths: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      filePaths.push((file as any).path || file.name)
    }
  }

  if (filePaths.length > 0) {
    await processSelectedFiles(filePaths)
    ElMessage.success(`成功添加 ${filePaths.length} 个文件`)
  } else {
    ElMessage.warning('请拖拽Excel文件(.xlsx, .xls)')
  }
}

const clearFiles = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定清空所有文件吗？\n\n⚠️ 这将清空：\n• 文件列表中的所有记录\n• 本地存储的文件信息\n\n注意：数据库中的数据不会被删除\n如需删除数据库数据，请单独删除每个文件`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )

    importFileList.value = []
    clearFileListStorage()
    updateImportStats()
    ElMessage.success('文件列表已清空')
  } catch {
    // 用户取消
  }
}

const showImportSettings = (): void => {
  showImportSettingsModal.value = true
}

const closeImportSettingsModal = (): void => {
  showImportSettingsModal.value = false
}

const saveImportSettings = (): void => {
  ElMessage.success('导入设置已保存')
  closeImportSettingsModal()
}

// 开关切换方法
const toggleSkipEmptyRows = (): void => {
  importSettings.skipEmptyRows = !importSettings.skipEmptyRows
}

const toggleTrimWhitespace = (): void => {
  importSettings.trimWhitespace = !importSettings.trimWhitespace
}

const toggleValidateData = (): void => {
  importSettings.validateData = !importSettings.validateData
}

const toggleAutoUpdate = (): void => {
  importSettings.autoUpdateEnabled = !importSettings.autoUpdateEnabled
}

const updateAllFiles = async (): Promise<void> => {
  if (importFileList.value.length === 0) {
    ElMessage.warning('没有可更新的文件')
    return
  }

  try {
    await ElMessageBox.confirm(
      `将更新 ${importFileList.value.length} 个文件的数据：\n• 重新解析工作表结构\n• 更新字段匹配结果\n• 刷新数据统计信息\n• 验证数据完整性\n\n预计耗时：约30秒\n\n确定要继续吗？`,
      '🔄 更新所有文件数据',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    ElMessage.info('开始更新所有文件数据...')

    // 重新处理所有文件
    const filePaths = importFileList.value.map((file: any) => file.filePath).filter(Boolean)
    importFileList.value = []

    await processSelectedFiles(filePaths)

    ElMessage.success('所有文件数据更新完成！')
  } catch {
    // 用户取消
  }
}

const viewFileDetail = async (file: ImportFileListItem): Promise<void> => {
  selectedFileDetail.value = file
  showFileDetailModal.value = true
}

const closeFileDetailModal = (): void => {
  showFileDetailModal.value = false
  selectedFileDetail.value = null
}

const importSelectedFile = async (): Promise<void> => {
  if (!selectedFileDetail.value) return

  try {
    const filePath = (selectedFileDetail.value as any).filePath

    // 创建一个简单的设置对象，避免对象克隆问题
    const simpleSettings = {
      matchMode: importSettings.matchMode,
      minMatchFields: importSettings.minMatchFields,
      skipEmptyRows: importSettings.skipEmptyRows,
      trimWhitespace: importSettings.trimWhitespace,
      validateData: importSettings.validateData,
      autoUpdateEnabled: importSettings.autoUpdateEnabled,
      updateFrequency: importSettings.updateFrequency
    }

    console.log('开始导入文件:', filePath, '设置:', simpleSettings)

    const response = await window.electronAPI.invoke('import:start', [filePath], simpleSettings)

    if (response.success) {
      ElMessage.success('开始导入数据，请稍候...')
      closeFileDetailModal()

      // 可以在这里添加进度监控逻辑
      const importId = response.data
      monitorImportProgress(importId)
    } else {
      ElMessage.error(response.error || '启动导入失败')
    }
  } catch (error) {
    console.error('导入文件失败:', error)
    ElMessage.error(`导入文件失败: ${error}`)
  }
}

const monitorImportProgress = async (importId: string): Promise<void> => {
  console.log(`开始监控导入进度: ${importId}`)

  const checkProgress = async () => {
    try {
      const response = await window.electronAPI.invoke('import:getProgress', importId)
      console.log(`导入进度响应:`, response)

      if (response.success && response.data) {
        const progress = response.data
        console.log(`导入状态: ${progress.status}, 处理行数: ${progress.processedRows}`)

        if (progress.status === 'completed') {
          console.log('导入完成！')
          ElMessage.success(`导入完成！成功处理 ${progress.processedRows} 行数据`)
          updateImportStats()

          // 验证数据是否已存储到数据库
          await verifyImportedData()
        } else if (progress.status === 'failed') {
          console.error('导入失败:', progress.errors)
          ElMessage.error('导入失败：' + (progress.errors[0]?.message || '未知错误'))
        } else if (progress.status === 'processing') {
          console.log('导入进行中，继续监控...')
          // 继续监控
          setTimeout(checkProgress, 2000)
        }
      } else {
        console.error('获取导入进度失败:', response.error)
      }
    } catch (error) {
      console.error('获取导入进度失败:', error)
    }
  }

  setTimeout(checkProgress, 1000)
}

// 验证导入的数据是否已存储到数据库
const verifyImportedData = async (): Promise<void> => {
  try {
    console.log('验证导入的数据...')

    // 检查合同数据
    const contractResponse = await window.electronAPI.invoke('contract:findAll')
    if (contractResponse.success) {
      console.log(`数据库中的合同数据数量: ${contractResponse.data?.length || 0}`)
      if (contractResponse.data && contractResponse.data.length > 0) {
        console.log('最新的合同数据示例:', contractResponse.data.slice(0, 2))
      }
    }

    // 检查采购数据
    const procurementResponse = await window.electronAPI.invoke('procurement:findAll')
    if (procurementResponse.success) {
      console.log(`数据库中的采购数据数量: ${procurementResponse.data?.length || 0}`)
      if (procurementResponse.data && procurementResponse.data.length > 0) {
        console.log('最新的采购数据示例:', procurementResponse.data.slice(0, 2))
      }
    }

    ElMessage.info('数据验证完成，请查看控制台输出')
  } catch (error) {
    console.error('验证导入数据失败:', error)
  }
}

// 保存文件列表到本地存储
const saveFileListToStorage = (): void => {
  try {
    const fileListData = importFileList.value.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      sheetCount: file.sheetCount,
      status: file.status,
      filePath: (file as any).filePath,
      worksheets: (file as any).worksheets,
      timestamp: Date.now()
    }))

    localStorage.setItem(FILE_LIST_STORAGE_KEY, JSON.stringify(fileListData))
    console.log(`文件列表已保存到本地存储，共 ${fileListData.length} 个文件`)
  } catch (error) {
    console.error('保存文件列表到本地存储失败:', error)
  }
}

// 从本地存储加载文件列表
const loadFileListFromStorage = (): void => {
  try {
    const storedData = localStorage.getItem(FILE_LIST_STORAGE_KEY)
    if (storedData) {
      const fileListData = JSON.parse(storedData)

      // 验证数据有效性（24小时内的数据）
      const validFiles = fileListData.filter((file: any) => {
        const isValid = file.timestamp && (Date.now() - file.timestamp) < 24 * 60 * 60 * 1000
        return isValid
      })

      if (validFiles.length > 0) {
        importFileList.value = validFiles
        updateImportStats()
        console.log(`从本地存储恢复文件列表，共 ${validFiles.length} 个文件`)
        ElMessage.info(`恢复了 ${validFiles.length} 个之前导入的文件`)
      } else {
        // 清理过期数据
        localStorage.removeItem(FILE_LIST_STORAGE_KEY)
        console.log('本地存储的文件列表已过期，已清理')
      }
    }
  } catch (error) {
    console.error('从本地存储加载文件列表失败:', error)
    // 清理损坏的数据
    localStorage.removeItem(FILE_LIST_STORAGE_KEY)
  }
}

// 清理本地存储的文件列表
const clearFileListStorage = (): void => {
  try {
    localStorage.removeItem(FILE_LIST_STORAGE_KEY)
    console.log('本地存储的文件列表已清理')
  } catch (error) {
    console.error('清理本地存储失败:', error)
  }
}

const deleteFile = async (file: ImportFileListItem): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定删除文件 "${file.name}" 吗？\n\n⚠️ 这将同时删除：\n• 文件列表中的记录\n• 数据库中相关的数据记录\n• 所有相关的导入进度信息\n\n此操作不可撤销！`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )

    console.log(`开始删除文件: ${file.name}`)

    // 1. 从前端列表中移除
    const index = importFileList.value.findIndex(f => f.id === file.id)
    if (index === -1) {
      ElMessage.warning('文件不存在于列表中')
      return
    }

    // 2. 删除数据库中相关的数据记录
    const fileItem = importFileList.value[index] as any
    if (fileItem.filePath) {
      try {
        console.log(`删除文件路径 ${fileItem.filePath} 相关的数据库记录`)

        // 删除合同数据
        const contractDeleteResult = await window.electronAPI.invoke('contract:deleteByFilePath', fileItem.filePath)
        if (contractDeleteResult.success) {
          console.log(`删除合同数据成功: ${contractDeleteResult.data || 0} 条记录`)
        } else {
          console.warn(`删除合同数据失败: ${contractDeleteResult.error}`)
        }

        // 删除采购数据
        const procurementDeleteResult = await window.electronAPI.invoke('procurement:deleteByFilePath', fileItem.filePath)
        if (procurementDeleteResult.success) {
          console.log(`删除采购数据成功: ${procurementDeleteResult.data || 0} 条记录`)
        } else {
          console.warn(`删除采购数据失败: ${procurementDeleteResult.error}`)
        }

        // 清理导入进度信息
        try {
          await window.electronAPI.invoke('import:clearProgressByFile', fileItem.filePath)
          console.log('导入进度信息已清理')
        } catch (error) {
          console.warn('清理导入进度信息失败:', error)
        }

      } catch (error) {
        console.error('删除数据库记录失败:', error)
        ElMessage.error(`删除数据库记录失败: ${error}`)
        return
      }
    }

    // 3. 从前端列表中移除
    importFileList.value.splice(index, 1)

    // 4. 保存到本地存储
    saveFileListToStorage()

    // 5. 更新统计信息
    updateImportStats()

    ElMessage.success(`文件 "${file.name}" 及相关数据已完全删除`)
    console.log(`文件删除完成: ${file.name}`)

  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文件失败:', error)
      ElMessage.error(`删除文件失败: ${error}`)
    }
  }
}

// 测试数据导入功能
const testDataImportFunction = async (): Promise<void> => {
  console.log('🧪 开始测试数据导入功能...')
  ElMessage.info('开始测试数据导入功能，请查看控制台输出')

  try {
    // 1. 测试字段配置获取
    console.log('📋 测试字段配置获取...')
    const fieldResult = await window.electronAPI.field.getConfig()
    console.log('字段配置结果:', fieldResult)

    if (fieldResult.success) {
      const fields = fieldResult.data
      console.log(`✅ 字段配置获取成功，总数: ${fields.length}`)

      if (fields.length === 0) {
        console.warn('⚠️ 数据库中没有字段配置，这可能是字段匹配失败的原因')
        ElMessage.warning('数据库中没有字段配置，请先在字段管理页面添加字段配置')
        return
      }

      const contractFields = fields.filter(f => f.fieldType === 'contract' || f.fieldCategory === 'contract')
      const procurementFields = fields.filter(f => f.fieldType === 'procurement' || f.fieldCategory === 'procurement')

      console.log(`📄 合同字段数量: ${contractFields.length}`)
      console.log(`📄 采购字段数量: ${procurementFields.length}`)

      if (contractFields.length > 0) {
        console.log('合同字段示例:', contractFields.slice(0, 5).map(f => ({
          名称: f.fieldName,
          别名: f.fieldAlias,
          类型: f.fieldType || f.fieldCategory,
          数据类型: f.dataType
        })))
      }

      if (procurementFields.length > 0) {
        console.log('采购字段示例:', procurementFields.slice(0, 5).map(f => ({
          名称: f.fieldName,
          别名: f.fieldAlias,
          类型: f.fieldType || f.fieldCategory,
          数据类型: f.dataType
        })))
      }
    } else {
      console.error('❌ 字段配置获取失败:', fieldResult.error)
      ElMessage.error('字段配置获取失败: ' + fieldResult.error)
      return
    }

    // 2. 测试Excel文件解析
    console.log('📊 测试Excel文件解析...')
    const testFilePath = 'C:\\Users\\97477\\Desktop\\develop\\contrac system\\tests\\fixtures\\test-contract-only.xlsx'
    console.log(`测试文件路径: ${testFilePath}`)

    const parseResult = await window.electronAPI.invoke('import:parseFile', testFilePath)
    console.log('解析结果:', parseResult)

    if (parseResult.success) {
      const worksheets = parseResult.data
      console.log(`✅ 文件解析成功，工作表数量: ${worksheets.length}`)

      worksheets.forEach((ws, index) => {
        console.log(`📋 工作表 ${index + 1}:`)
        console.log(`  - 名称: ${ws.sheetName}`)
        console.log(`  - 类型: ${ws.sheetType}`)
        console.log(`  - 识别状态: ${ws.recognitionStatus}`)
        console.log(`  - 匹配字段数: ${ws.matchedFieldsCount}`)
        console.log(`  - 匹配字段: ${ws.matchedFields?.join(', ') || '无'}`)
        console.log(`  - 数据行数: ${ws.dataRows}`)
        if (ws.failureReason) {
          console.log(`  - 失败原因: ${ws.failureReason}`)
        }
      })

      // 检查是否有识别的工作表
      const recognizedSheets = worksheets.filter(ws => ws.recognitionStatus === 'recognized')
      if (recognizedSheets.length > 0) {
        console.log(`✅ 有 ${recognizedSheets.length} 个工作表被成功识别`)
        ElMessage.success(`测试成功！识别了 ${recognizedSheets.length} 个工作表`)
      } else {
        console.warn('⚠️ 没有工作表被识别')
        ElMessage.warning('测试完成，但没有工作表被识别，请检查字段匹配逻辑')
      }
    } else {
      console.error('❌ 文件解析失败:', parseResult.error)
      ElMessage.error('文件解析失败: ' + parseResult.error)
    }

    console.log('🎉 数据导入功能测试完成！')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
    ElMessage.error('测试失败: ' + error)
  }
}

// 辅助方法
const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    processing: 'status-processing',
    completed: 'status-completed',
    failed: 'status-failed'
  }
  return classes[status] || ''
}

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || status
}

const getRecognitionStatusClass = (status: string): string => {
  return status === 'recognized' ? 'recognition-success' : 'recognition-failed'
}

const getRecognitionStatusText = (status: string): string => {
  return status === 'recognized' ? '已识别' : '未识别'
}

const getSheetTypeText = (type: string): string => {
  const types: Record<string, string> = {
    contract: '合同数据',
    procurement: '采购数据',
    unknown: '未知类型'
  }
  return types[type] || type
}

// 辅助函数已移动到文件顶部

const updateImportStats = (): void => {
  importStats.total = importFileList.value.length
  importStats.totalSheets = importFileList.value.reduce((sum, file) => sum + file.sheetCount, 0)

  // 计算识别统计（需要从工作表信息中获取）
  let recognized = 0
  let unrecognized = 0

  for (const file of importFileList.value) {
    const worksheets = (file as any).worksheets as WorksheetInfo[]
    if (worksheets) {
      recognized += worksheets.filter(ws => ws.recognitionStatus === 'recognized').length
      unrecognized += worksheets.filter(ws => ws.recognitionStatus === 'unrecognized').length
    }
  }

  importStats.recognized = recognized
  importStats.unrecognized = unrecognized
}

// 生命周期
onMounted(() => {
  // 从本地存储恢复文件列表
  loadFileListFromStorage()
  updateImportStats()
})
</script>

<style lang="scss" scoped>
// 配置常量 - 优化对比度
:root {
  --primary-color: #1e40af;
  --primary-hover: #1d4ed8;
  --secondary-color: #3b82f6;
  --accent-color: #6366f1;
  --success-color: #059669;
  --warning-color: #d97706;
  --danger-color: #dc2626;
  --info-color: #0ea5e9;
  --light-blue: #f0f9ff;
  --border-radius: 12px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06);
  --box-shadow-hover: 0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 高对比度文字颜色
  --text-primary: #0f172a;
  --text-secondary: #1e293b;
  --text-muted: #475569;
  --text-accent: #1e40af;

  // 背景颜色
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-accent: #e0f2fe;

  // 边框颜色
  --border-color: #cbd5e1;
  --border-light: #e2e8f0;
  --border-focus: #3b82f6;
}

.data-import-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* 页面标题区 */
.page-header {
  height: 60px;
  padding: 12px 24px;
  border-bottom: 2px solid var(--border-color);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-icon {
  margin-right: 8px;
  font-size: 20px;
  color: var(--primary-color);
}

.page-stats {
  color: var(--text-accent);
  font-size: 13px;
  font-weight: 600;
}

/* 文件上传区域 */
.upload-section-compact {
  padding: 16px 24px;
  border-bottom: 2px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.upload-area-compact {
  border: 3px dashed var(--border-color);
  border-radius: var(--border-radius);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  background: #ffffff;
  box-shadow: var(--box-shadow);

  &:hover {
    border-color: var(--primary-color);
    background: var(--bg-accent);
    transform: translateY(-2px);
    box-shadow: var(--box-shadow-hover);
  }
}

.upload-content-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 36px;
  color: var(--primary-color);
  opacity: 0.8;
}

.upload-text {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

/* 操作工具栏 */
.action-toolbar {
  height: 56px;
  padding: 12px 24px;
  border-bottom: 2px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, var(--bg-secondary) 100%);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.btn {
  padding: 12px 24px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  background: #ffffff;
  color: var(--text-primary);
  min-width: 120px;
  box-shadow: var(--box-shadow);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--box-shadow-hover);
    border-color: var(--border-focus);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--bg-tertiary);
    color: var(--text-muted);
  }
}

/* 确保主要按钮样式优先级最高 - 覆盖Element Plus全局样式 */
.data-import-view button.btn.btn-primary,
.data-import-view .btn.btn-primary {
  background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
  font-weight: 700 !important;
  border-radius: 18px !important;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
    color: #ffffff !important;
    transform: translateY(-2px) scale(1.05) !important;
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98) !important;
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%) !important;
  color: #ffffff !important; /* 改回白色字体以确保对比度 */
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  font-weight: 700;
  border-radius: 18px; /* 圆润设计 */

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #3b82f6 0%, var(--primary-color) 100%) !important;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
    color: #ffffff !important; /* 悬停时也保持白色 */
    transform: translateY(-2px) scale(1.05);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
}

.btn-secondary {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #000000; /* 修改为黑色字体 */
  border: 1.5px solid var(--border-color);
  border-radius: 18px; /* 圆润设计 */

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
    border-color: var(--primary-color);
    color: #000000; /* 悬停时也保持黑色 */
    transform: translateY(-2px) scale(1.05);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
}

/* 文件列表区 */
.import-table-section {
  flex: 1;
  overflow: auto;
  padding: 0;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  th {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    padding: 16px 20px;
    text-align: left;
    font-weight: 700;
    color: var(--text-primary);
    border-bottom: 3px solid var(--border-color);
    font-size: 14px;
    position: sticky;
    top: 0;
    z-index: 10;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light);
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  tr:hover {
    background: #f8fafc;
  }
}

.btn-action {
  padding: 8px 16px;
  margin-right: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
    border-color: var(--primary-color);
    color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.import-note {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 13px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

/* 状态样式 - 高对比度设计 */
.status-pending {
  color: #92400e;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #f59e0b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.status-processing {
  color: #1e40af;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.status-completed {
  color: #065f46;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #059669;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.status-failed {
  color: #991b1b;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #dc2626;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.recognition-success {
  color: #065f46;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #059669;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.recognition-failed {
  color: #991b1b;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #dc2626;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

/* 统一模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 20px;
  box-sizing: border-box;

  &.show {
    opacity: 1;
    visibility: visible;
  }
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  max-width: calc(100vw - 40px);
  width: 90%;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  transform: translateY(32px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;

  .modal-overlay.show & {
    transform: translateY(0) scale(1);
  }

  &.file-detail-modal {
    max-width: min(900px, calc(100vw - 40px));
    max-height: calc(100vh - 80px);
    width: 95%;
  }
}

.modal-header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: 0.025em;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    transform: scale(1.1);
  }

  span {
    font-size: 18px;
    font-weight: 600;
    line-height: 1;
  }
}

.modal-body {
  padding: 32px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(241, 245, 249, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.5);
    border-radius: 4px;

    &:hover {
      background: rgba(100, 116, 139, 0.7);
    }
  }
}

.modal-footer {
  padding: 24px 32px 32px;
  border-top: 1px solid rgba(241, 245, 249, 0.8);
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

/* 表单样式 */
.import-settings-form {
  .form-group {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    font-weight: 600;
    color: #1e293b;
    font-size: 15px;
    letter-spacing: 0.025em;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 16px 20px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    color: #1f2937;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      background: rgba(255, 255, 255, 1);
    }

    &:hover {
      border-color: #cbd5e1;
    }
  }

  .form-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
    cursor: pointer;
    user-select: none;

    .switch-input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
      z-index: 2;

      &:checked + .switch-slider {
        background-color: var(--primary-color);

        &:before {
          transform: translateX(26px);
        }
      }

      &:focus + .switch-slider {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }

    .switch-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: all 0.3s ease;
      border-radius: 34px;
      z-index: 1;

      &:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: all 0.3s ease;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      &:hover {
        background-color: #94a3b8;
      }

      &:active {
        transform: scale(0.98);
      }
    }

    &:hover .switch-slider {
      background-color: #94a3b8;
    }
  }
}

.file-detail-content {
  .file-info {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius);

    h3 {
      margin: 0 0 8px 0;
      color: var(--text-primary);
    }

    p {
      margin: 4px 0;
      color: var(--text-secondary);
      font-size: 14px;
    }
  }

  .worksheets-list {
    h4 {
      margin: 0 0 16px 0;
      color: var(--text-primary);
    }
  }

  .worksheet-item {
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);

    .worksheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .worksheet-name {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .worksheet-details {
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 8px 0;
        padding: 4px 0;

        .label {
          font-weight: 500;
          color: var(--text-secondary);
          font-size: 13px;
          min-width: 80px;
        }

        .value {
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
        }
      }

      .matched-fields {
        margin-top: 12px;
        padding: 8px 12px;
        background: var(--bg-accent);
        border-radius: 8px;
        border-left: 3px solid var(--primary-color);

        .field-list {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
      }

      .failure-reason {
        color: var(--danger-color);
        font-weight: 500;
      }
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 确保Element Plus卡片有高端效果 */
:deep(.el-card) {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.el-card__header) {
  background: rgba(248, 250, 252, 0.8) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.5) !important;
}

/* 测试按钮样式 */
.btn-test {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 8px;
  font-weight: 500;
}

.btn-test:hover {
  background: linear-gradient(135deg, #ee5a24, #ff6b6b);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.btn-test:active {
  transform: translateY(0);
}
</style>
