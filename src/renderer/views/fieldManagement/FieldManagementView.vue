<template>
  <div class="module-content">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="page-title">
        <span class="page-icon">⚙️</span>
        字段管理
      </div>

      <div class="page-stats">
        📊 统计: 合同字段 {{ fieldStats.contract }} 个 | 采购字段 {{ fieldStats.procurement }} 个 | 总计 {{ fieldStats.total }} 个
      </div>
    </div>

    <!-- 标签页切换 -->
    <div class="tab-section">
      <div class="tab-buttons">
        <button class="tab-btn" :class="{active: fieldType === 'contract'}" @click="switchFieldType('contract')">📋 合同字段</button>
        <button class="tab-btn" :class="{active: fieldType === 'procurement'}" @click="switchFieldType('procurement')">📦 采购字段</button>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="action-toolbar">
      <div class="toolbar-left">
        <button class="btn btn-primary" @click="showFieldDialog()">+ 新增字段</button>
        <button class="btn btn-secondary" @click="importFields">📥 导入字段</button>
        <button class="btn btn-secondary" @click="exportFields">📤 导出字段</button>
      </div>
      <div class="toolbar-right">
        <div class="search-group">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" v-model="fieldSearch" placeholder="搜索字段名称/别名">
        </div>
      </div>
    </div>

    <!-- 数据表格区 -->
    <div class="table-section">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>字段名称</th>
            <th>字段类型</th>
            <th>别名列表</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(field, index) in filteredFields" :key="field.id">
            <td>{{ index + 1 }}</td>
            <td>{{ field.name }}</td>
            <td>{{ field.type }}</td>
            <td>{{ field.aliases.join(', ') }}</td>
            <td>
              <button class="btn-action" @click="editField(field)">编辑</button>
              <button class="btn-action" @click="deleteField(field)" style="color: #ef4444;">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 字段编辑模态框 -->
    <div class="modal-overlay" :class="{show: showFieldModal}" @click.self="closeFieldModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingField.id ? '编辑字段' : '新增字段' }}</h3>
          <button class="modal-close" @click="closeFieldModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">字段名称</label>
            <input
              type="text"
              class="form-input"
              v-model="editingField.name"
              placeholder="请输入字段名称"
              ref="fieldNameInput"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
          <div class="form-group">
            <label class="form-label">字段类型</label>
            <select class="form-input" v-model="editingField.type">
              <option value="">请选择字段类型</option>
              <option v-for="type in fieldTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">字段别名</label>
            <input
              type="text"
              class="form-input"
              v-model="editingField.aliasText"
              placeholder="多个别名用逗号分隔，如：编号,合同号,序号"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeFieldModal">取消</button>
          <button class="btn btn-primary" @click="saveField">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const fieldSearch = ref('')
const fieldType = ref('contract')
const showFieldModal = ref(false)
const editingField = ref<any>({})
const fieldNameInput = ref<HTMLInputElement>()

// 字段类型配置
const fieldTypes = ['文本', '数字', '日期', '金额', '选择', '长文本']

// 字段统计数据
const fieldStats = reactive({
  total: 0,
  contract: 0,
  procurement: 0
})

// 字段列表数据 - 从数据库加载
const contractFieldList = ref([])
const procurementFieldList = ref([])

// 计算属性
const filteredFields = computed(() => {
  const fields = fieldType.value === 'contract' ? contractFieldList.value : procurementFieldList.value
  if (!fieldSearch.value) return fields
  const search = fieldSearch.value.toLowerCase()
  return fields.filter(field =>
    field.name.toLowerCase().includes(search) ||
    field.aliases.some(alias => alias.toLowerCase().includes(search))
  )
})

// 加载字段数据
const loadFieldData = async () => {
  try {
    console.log('开始加载字段数据...')

    // 加载合同字段
    const contractResponse = await window.electronAPI.invoke('field:findByCategory', 'contract')
    if (contractResponse.success) {
      contractFieldList.value = contractResponse.data.map((field: any) => ({
        id: field.id,
        name: field.fieldName,
        type: field.fieldType,
        aliases: field.fieldAlias ? field.fieldAlias.split(',').map((alias: string) => alias.trim()).filter((alias: string) => alias) : []
      }))
      console.log('合同字段加载成功:', contractFieldList.value.length)
    } else {
      console.error('加载合同字段失败:', contractResponse.error)
    }

    // 加载采购字段
    const procurementResponse = await window.electronAPI.invoke('field:findByCategory', 'procurement')
    if (procurementResponse.success) {
      procurementFieldList.value = procurementResponse.data.map((field: any) => ({
        id: field.id,
        name: field.fieldName,
        type: field.fieldType,
        aliases: field.fieldAlias ? field.fieldAlias.split(',').map((alias: string) => alias.trim()).filter((alias: string) => alias) : []
      }))
      console.log('采购字段加载成功:', procurementFieldList.value.length)
    } else {
      console.error('加载采购字段失败:', procurementResponse.error)
    }

    updateFieldStats()
  } catch (error) {
    console.error('加载字段数据失败:', error)
    ElMessage.error('加载字段数据失败，请重试')
  }
}

// 字段管理方法
const switchFieldType = (type: string) => {
  fieldType.value = type
  fieldSearch.value = ''
}

const showFieldDialog = async (field: any = null) => {
  editingField.value = field ? {
    ...field,
    aliasText: field.aliases.join(', ')
  } : {
    id: null,
    name: '',
    type: '',
    aliases: [],
    aliasText: ''
  }
  showFieldModal.value = true

  // 自动聚焦到第一个输入框
  await nextTick()
  if (fieldNameInput.value) {
    fieldNameInput.value.focus()
  }
}

const editField = (field: any) => {
  showFieldDialog(field)
}

const closeFieldModal = () => {
  showFieldModal.value = false
  editingField.value = {}
}

const saveField = async () => {
  if (!editingField.value.name || !editingField.value.type) {
    ElMessage.error('请填写字段名称和类型')
    return
  }

  try {
    // 处理别名
    const aliases = editingField.value.aliasText
      .split(',')
      .map((alias: string) => alias.trim())
      .filter((alias: string) => alias)

    const fieldData = {
      fieldName: editingField.value.name,
      fieldAlias: aliases.join(','),
      fieldType: editingField.value.type,
      dataType: 'TEXT',
      fieldCategory: fieldType.value,
      isVisible: true,
      displayOrder: 0,
      isRequired: false,
      defaultValue: '',
      validationRule: '',
      cleaningRule: ''
    }

    let response
    if (editingField.value.id) {
      // 编辑模式
      console.log('更新字段:', editingField.value.id, fieldData)
      response = await window.electronAPI.invoke('field:update', editingField.value.id, fieldData)
    } else {
      // 新建模式
      console.log('创建字段:', fieldData)
      response = await window.electronAPI.invoke('field:create', fieldData)
    }

    if (response.success) {
      ElMessage.success(editingField.value.id ? '字段更新成功！' : '字段创建成功！')
      closeFieldModal()
      // 重新加载字段数据以确保数据同步
      await loadFieldData()
    } else {
      ElMessage.error(response.error || '保存字段失败')
      console.error('保存字段失败:', response.error)
    }
  } catch (error) {
    ElMessage.error('保存失败，请重试')
    console.error('Save field error:', error)
  }
}

const deleteField = async (field: any) => {
  if (confirm(`确定删除字段 "${field.name}" 吗？`)) {
    try {
      console.log('开始删除字段:', field.id, field.name)

      // 调用真实的API删除字段
      const response = await window.electronAPI.invoke('field:delete', field.id)
      console.log('删除字段API响应:', response)

      if (response.success) {
        // 删除成功后重新加载字段列表以确保数据同步
        await loadFieldData()
        ElMessage.success('字段删除成功！')
        console.log('字段删除成功，列表已刷新')
      } else {
        ElMessage.error(response.error || '字段删除失败')
        console.error('字段删除失败:', response.error)
      }
    } catch (error) {
      ElMessage.error('删除失败，请重试')
      console.error('Delete field error:', error)
    }
  }
}

const importFields = async () => {
  try {
    // 选择导入文件
    const fileResponse = await window.electronAPI.file.selectImport()
    if (!fileResponse.success || !fileResponse.data || fileResponse.data.length === 0) {
      if (fileResponse.error && !fileResponse.error.includes('用户取消')) {
        ElMessage.error(`文件选择失败: ${fileResponse.error}`)
      }
      return
    }

    const filePath = fileResponse.data[0]

    // 导入JSON数据
    const importResponse = await window.electronAPI.file.importJson(filePath)
    if (!importResponse.success) {
      ElMessage.error(`导入失败: ${importResponse.error}`)
      return
    }

    const importedData = importResponse.data
    if (!Array.isArray(importedData) || importedData.length === 0) {
      ElMessage.warning('导入的文件中没有有效数据')
      return
    }

    // 转换导入的数据格式
    const convertedFields = importedData.map((item: any) => ({
      fieldName: item['字段名称'] || item.name || '',
      fieldType: item['字段类型'] || item.type || '文本',
      fieldAlias: typeof item['别名列表'] === 'string'
        ? item['别名列表']
        : (Array.isArray(item.aliases) ? item.aliases.join(',') : ''),
      fieldCategory: item['字段分类'] || item.fieldType || fieldType.value,
      isVisible: item['是否显示'] !== false,
      displayOrder: item['显示顺序'] || item.displayOrder || 0,
      isRequired: item['是否必需'] || item.isRequired || false,
      defaultValue: item['默认值'] || item.defaultValue || '',
      validationRule: item['验证规则'] || item.validationRule || '',
      dataType: 'TEXT',
      cleaningRule: ''
    }))

    // 验证必需字段
    const invalidFields = convertedFields.filter(field => !field.fieldName || !field.fieldType)
    if (invalidFields.length > 0) {
      ElMessage.error(`导入数据中有 ${invalidFields.length} 条记录缺少必需字段（字段名称、字段类型）`)
      return
    }

    // 批量创建字段到数据库 - 支持重复字段处理
    let successCount = 0
    let updateCount = 0
    let skipCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const fieldData of convertedFields) {
      try {
        console.log('创建字段:', fieldData)

        // 首先检查字段是否已存在
        const existingResponse = await window.electronAPI.invoke('field:findByName', fieldData.fieldName, fieldData.fieldCategory)

        if (existingResponse.success && existingResponse.data) {
          // 字段已存在，更新字段
          console.log('字段已存在，执行更新:', fieldData.fieldName)
          const updateResponse = await window.electronAPI.invoke('field:update', existingResponse.data.id, fieldData)

          if (updateResponse.success) {
            updateCount++
            console.log('字段更新成功:', fieldData.fieldName)
          } else {
            errorCount++
            errors.push(`${fieldData.fieldName}: 更新失败 - ${updateResponse.error}`)
            console.error('字段更新失败:', updateResponse.error)
          }
        } else {
          // 字段不存在，创建新字段
          const createResponse = await window.electronAPI.invoke('field:create', fieldData)

          if (createResponse.success) {
            successCount++
            console.log('字段创建成功:', fieldData.fieldName)
          } else {
            errorCount++
            errors.push(`${fieldData.fieldName}: 创建失败 - ${createResponse.error}`)
            console.error('字段创建失败:', createResponse.error)
          }
        }
      } catch (error) {
        errorCount++
        errors.push(`${fieldData.fieldName}: 异常 - ${error}`)
        console.error('字段处理异常:', error)
      }
    }

    // 重新加载字段数据以确保数据同步
    await loadFieldData()

    // 显示导入结果
    const totalProcessed = successCount + updateCount + skipCount + errorCount
    let resultMessage = `字段导入完成！`

    if (successCount > 0) {
      resultMessage += ` 新增 ${successCount} 条`
    }

    if (updateCount > 0) {
      resultMessage += ` 更新 ${updateCount} 条`
    }

    if (skipCount > 0) {
      resultMessage += ` 跳过 ${skipCount} 条`
    }

    if (errorCount > 0) {
      resultMessage += ` 失败 ${errorCount} 条`
    }

    if (errorCount === 0) {
      ElMessage.success(resultMessage)
    } else if (successCount + updateCount > 0) {
      ElMessage.warning(resultMessage)
      console.warn('导入失败的记录:', errors)
    } else {
      ElMessage.error(resultMessage)
      console.error('导入失败的记录:', errors)
    }

  } catch (error) {
    console.error('字段导入失败:', error)
    ElMessage.error('字段导入失败，请检查文件格式')
  }
}

const exportFields = async () => {
  const fields = filteredFields.value
  if (fields.length === 0) {
    ElMessage.warning('没有可导出的字段数据')
    return
  }

  try {
    // 准备导出数据 - 确保数据是可序列化的
    const exportData = fields.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type,
      aliases: Array.isArray(field.aliases) ? [...field.aliases] : [],
      fieldType: fieldType.value,
      isVisible: field.isVisible !== false,
      displayOrder: field.displayOrder || 0,
      isRequired: field.isRequired || false,
      defaultValue: field.defaultValue || '',
      validationRule: field.validationRule || ''
    }))

    console.log('准备导出的字段数据:', exportData)

    // 调用导出API
    const response = await window.electronAPI.file.exportJson(exportData, 'field')
    if (!response.success) {
      ElMessage.error(`导出失败: ${response.error}`)
      return
    }

    const filePath = response.data
    ElMessage.success({
      message: `字段数据导出成功！共导出 ${exportData.length} 条记录`,
      duration: 5000,
      showClose: true
    })

    // 显示导出路径
    ElMessage.info({
      message: `文件已保存到: ${filePath}`,
      duration: 8000,
      showClose: true
    })

  } catch (error) {
    console.error('字段导出失败:', error)
    ElMessage.error('字段导出失败，请重试')
  }
}

// 更新统计数据
const updateFieldStats = () => {
  fieldStats.contract = contractFieldList.value.length
  fieldStats.procurement = procurementFieldList.value.length
  fieldStats.total = fieldStats.contract + fieldStats.procurement
}

// 生命周期
onMounted(async () => {
  console.log('字段管理页面挂载，开始加载数据...')
  await loadFieldData()
})
</script>

<style lang="scss" scoped>
/* 优化配色变量 */
:root {
  --primary-color: #3b82f6;
  --primary-light: #60a5fa;
  --primary-dark: #1d4ed8;
  --secondary-color: #8b5cf6;
  --accent-color: #06b6d4;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --info-color: #0ea5e9;
  --light-blue: rgba(59, 130, 246, 0.08);
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  --box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --box-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
  --box-shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);
  --border-radius: 12px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 模块内容容器 */
.module-content {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
}

/* 页面标题区 */
.page-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.025em;
}

.page-icon {
  font-size: 32px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-stats {
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 标签页切换 */
.tab-section {
  padding: 16px 24px 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.tab-buttons {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-light);
}

.tab-btn {
  padding: 14px 24px;
  border: 2px solid #e5e7eb;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 20px 20px 0 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.6s ease;
}

.tab-btn:hover::before {
  left: 100%;
}

.tab-btn:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  color: #1e40af;
  border-color: #3b82f6;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
}

.tab-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  border-color: #1d4ed8 !important;
  font-weight: 700 !important;
  transform: translateY(-3px) scale(1.05);
}

/* 操作工具栏 */
.action-toolbar {
  padding: 20px 32px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 按钮样式 - 圆润有活力设计 */
.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;
  min-height: 44px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn:active {
  transform: translateY(1px) scale(0.98);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border: 2px solid transparent !important;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35) !important;
  font-weight: 700 !important;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.45) !important;
}

.btn-secondary {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
  color: #1f2937 !important;
  border: 2px solid #e5e7eb !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-weight: 600 !important;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25) !important;
}

.btn-action {
  padding: 8px 16px;
  font-size: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #3b82f6;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;
  border-radius: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: 8px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-action:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
}

.btn-action:active {
  transform: translateY(0) scale(0.98);
}

/* 搜索组件 */
.search-group {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: var(--border-radius);
  padding: 0 12px;
  min-width: 280px;
  transition: var(--transition);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-group:focus-within {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
}

.search-icon {
  color: #6b7280;
  margin-right: 8px;
  font-size: 16px;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  padding: 10px 0;
  font-size: 14px;
  color: #1f2937;
  width: 100%;
  font-weight: 500;
}

.search-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

/* 数据表格区 */
.table-section {
  flex: 1;
  overflow: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
  margin: 16px 32px 32px 32px; /* 增加底部边距确保最后一行完整显示 */
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  min-height: 0;
  max-height: calc(100vh - 320px); /* 限制最大高度，确保滚动功能 */
}

.table-section::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-section::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.5);
  border-radius: 4px;
}

.table-section::-webkit-scrollbar-thumb {
  background: rgba(203, 213, 225, 0.8);
  border-radius: 4px;
}

.table-section::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.9);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  /* 确保表格内容有足够的底部空间 */
  margin-bottom: 20px;
}

.data-table th {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
  padding: 20px 24px;
  text-align: left;
  font-weight: 700;
  color: #0f172a;
  border-bottom: 2px solid rgba(226, 232, 240, 0.8);
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 10;
  letter-spacing: 0.025em;
  backdrop-filter: blur(10px);
}

.data-table td {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.8);
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

.data-table tr:hover {
  background: rgba(59, 130, 246, 0.08);
}

.data-table tr:hover td {
  color: #0f172a;
  font-weight: 600;
}

/* 模态对话框样式 */
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
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-overlay.show {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  max-width: 640px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  transform: translateY(32px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-overlay.show .modal-content {
  transform: translateY(0) scale(1);
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
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title::before {
  content: '✨';
  font-size: 28px;
}

.modal-close {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.8);
  font-size: 20px;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.modal-close:hover {
  background: rgba(248, 113, 113, 0.1);
  border-color: #f87171;
  color: #ef4444;
  transform: scale(1.05);
}

.modal-body {
  padding: 32px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 24px 32px;
  border-top: 1px solid rgba(241, 245, 249, 0.8);
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #1e293b !important;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db !important;
  border-radius: 8px;
  font-size: 14px;
  transition: var(--transition);
  background: #ffffff !important;
  color: #1e293b !important;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db !important;
  border-radius: 8px;
  font-size: 14px;
  transition: var(--transition);
  background: #ffffff !important;
  color: #1e293b !important;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}
</style>
