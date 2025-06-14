<template>
  <div class="procurement-management-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>采购管理</h2>
    </div>

    <!-- 统计卡片区 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-number">{{ procurementStats.total }}</div>
        <div class="stat-label">采购总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ procurementStats.linked }}</div>
        <div class="stat-label">已关联项目</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ procurementStats.unlinked }}</div>
        <div class="stat-label">未关联项目</div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>采购编号:</label>
          <input type="text" v-model="procurementFilters.number" placeholder="支持逗号分隔多个编号">
        </div>
        <div class="filter-group">
          <label>关联项目:</label>
          <input type="text" v-model="procurementFilters.project" placeholder="项目名称或编号">
        </div>
        <div class="filter-group">
          <label>供应商:</label>
          <input type="text" v-model="procurementFilters.supplier" placeholder="供应商名称">
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label>采购内容:</label>
          <input type="text" v-model="procurementFilters.content" placeholder="采购内容关键词">
        </div>
        <div class="filter-group">
          <label>采购日期:</label>
          <input type="date" v-model="procurementFilters.startDate">
          <span class="date-separator">至</span>
          <input type="date" v-model="procurementFilters.endDate">
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="applyFilters">🔍 筛选</button>
          <button class="btn btn-secondary" @click="resetFilters">🔄 重置</button>
          <span class="filter-hint">💡 逗号分隔OR</span>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="action-toolbar">
      <div class="toolbar-left">
        <button class="btn btn-secondary" @click="exportProcurements">📤 导出</button>
        <button class="btn btn-secondary" @click="batchOperations">📦 批量操作</button>
        <button class="btn btn-secondary" @click="refreshProcurements">🔄 刷新</button>
      </div>
      <div class="toolbar-right">
        <span class="selection-info">已选择 {{ selectedProcurements.length }} 项</span>
      </div>
    </div>

    <!-- 数据表格区 -->
    <div class="table-section">
      <table class="data-table">
        <thead>
          <tr>
            <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll"></th>
            <th>序号</th>
            <th>采购编号</th>
            <th>关联项目</th>
            <th>供应商</th>
            <th>采购内容</th>
            <th>采购金额</th>
            <th>采购日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(procurement, index) in filteredProcurements" :key="procurement.id">
            <td><input type="checkbox" v-model="selectedProcurements" :value="procurement.id"></td>
            <td>{{ index + 1 }}</td>
            <td>{{ procurement.number }}</td>
            <td>
              <span v-if="procurement.projectName" class="project-link">{{ procurement.projectName }}</span>
              <span v-else class="unlinked-text">未关联</span>
            </td>
            <td>{{ procurement.supplier }}</td>
            <td>{{ procurement.content }}</td>
            <td>{{ formatAmount(procurement.amount) }}</td>
            <td>{{ procurement.date }}</td>
            <td>
              <button class="btn-action" @click="viewProcurement(procurement)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 状态栏区域 -->
    <div class="status-bar">
      <div class="status-info">已选择 {{ selectedProcurements.length }} 项 | 筛选结果 {{ filteredProcurements.length }} 条 | 共 {{ procurementStats.total }} 条记录</div>
      <div class="pagination-controls">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">< 上一页</button>
        <span class="page-info">第 {{ currentPage }}/{{ totalPages }} 页</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">下一页 ></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const procurementSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectAll = ref(false)
const selectedProcurements = ref<number[]>([])

// 筛选条件
const procurementFilters = reactive({
  number: '',
  project: '',
  supplier: '',
  content: '',
  startDate: '',
  endDate: ''
})

// 统计数据
const procurementStats = reactive({
  total: 0,
  linked: 0,
  unlinked: 0
})

// 采购列表数据
const procurementList = ref([
  {
    id: 1,
    number: 'CG2024001',
    projectName: '智慧城市建设项目',
    supplier: '科技设备公司',
    content: '服务器设备采购',
    amount: 800000,
    date: '2024-01-20',
    status: '已完成'
  },
  {
    id: 2,
    number: 'CG2024002',
    projectName: '道路改造工程',
    supplier: '建材供应商',
    content: '沥青材料采购',
    amount: 450000,
    date: '2024-02-15',
    status: '进行中'
  },
  {
    id: 3,
    number: 'CG2024003',
    projectName: '',
    supplier: '办公用品公司',
    content: '办公设备采购',
    amount: 120000,
    date: '2024-03-05',
    status: '待审核'
  },
  {
    id: 4,
    number: 'CG2024004',
    projectName: '环保设备采购',
    supplier: '环保设备厂',
    content: '污水处理设备',
    amount: 1200000,
    date: '2024-03-20',
    status: '进行中'
  },
  {
    id: 5,
    number: 'CG2024005',
    projectName: '',
    supplier: '医疗器械公司',
    content: '医疗设备采购',
    amount: 680000,
    date: '2024-04-10',
    status: '已完成'
  }
])

// 计算属性
const filteredProcurements = computed(() => {
  let filtered = procurementList.value

  // 应用筛选条件
  if (procurementFilters.number) {
    const numbers = procurementFilters.number.split(',').map(n => n.trim().toLowerCase())
    filtered = filtered.filter(procurement =>
      numbers.some(num => procurement.number.toLowerCase().includes(num))
    )
  }

  if (procurementFilters.project) {
    const search = procurementFilters.project.toLowerCase()
    filtered = filtered.filter(procurement =>
      procurement.projectName && procurement.projectName.toLowerCase().includes(search)
    )
  }

  if (procurementFilters.supplier) {
    const search = procurementFilters.supplier.toLowerCase()
    filtered = filtered.filter(procurement =>
      procurement.supplier.toLowerCase().includes(search)
    )
  }

  if (procurementFilters.content) {
    const search = procurementFilters.content.toLowerCase()
    filtered = filtered.filter(procurement =>
      procurement.content.toLowerCase().includes(search)
    )
  }

  if (procurementFilters.startDate) {
    filtered = filtered.filter(procurement =>
      procurement.date >= procurementFilters.startDate
    )
  }

  if (procurementFilters.endDate) {
    filtered = filtered.filter(procurement =>
      procurement.date <= procurementFilters.endDate
    )
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredProcurements.value.length / pageSize.value)
})

// 方法
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount)
}

const applyFilters = () => {
  currentPage.value = 1
  ElMessage.success('筛选条件已应用')
}

const resetFilters = () => {
  Object.keys(procurementFilters).forEach(key => {
    procurementFilters[key as keyof typeof procurementFilters] = ''
  })
  currentPage.value = 1
  ElMessage.success('筛选条件已重置')
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProcurements.value = filteredProcurements.value.map(p => p.id)
  } else {
    selectedProcurements.value = []
  }
}

const viewProcurement = (procurement: any) => {
  ElMessage.info(`查看采购详情: ${procurement.number}`)
}

const batchOperations = () => {
  if (selectedProcurements.value.length === 0) {
    ElMessage.warning('请先选择要操作的采购记录')
    return
  }
  ElMessage.info(`批量操作 ${selectedProcurements.value.length} 个采购记录`)
}

const refreshProcurements = () => {
  updateProcurementStats()
  ElMessage.success('采购数据刷新成功！')
}

const exportProcurements = async () => {
  const procurements = selectedProcurements.value.length > 0
    ? procurementList.value.filter(p => selectedProcurements.value.includes(p.id))
    : filteredProcurements.value

  if (procurements.length === 0) {
    ElMessage.warning('没有可导出的采购数据')
    return
  }

  try {
    // 准备导出数据
    const exportData = procurements.map(procurement => ({
      id: procurement.id,
      procurementNumber: procurement.number,
      projectName: procurement.projectName || '未关联',
      supplier: procurement.supplier,
      content: procurement.content,
      amount: procurement.amount,
      date: procurement.date,
      status: procurement.status
    }))

    // 调用导出API
    const response = await window.electronAPI.file.exportJson(exportData, 'procurement')
    if (!response.success) {
      ElMessage.error(`导出失败: ${response.error}`)
      return
    }

    const filePath = response.data
    ElMessage.success({
      message: `采购数据导出成功！共导出 ${exportData.length} 条记录`,
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
    console.error('采购导出失败:', error)
    ElMessage.error('采购导出失败，请重试')
  }
}

// 分页方法
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 更新统计数据
const updateProcurementStats = () => {
  procurementStats.total = procurementList.value.length
  procurementStats.linked = procurementList.value.filter(p => p.projectName).length
  procurementStats.unlinked = procurementStats.total - procurementStats.linked
}

// 生命周期
onMounted(() => {
  updateProcurementStats()
})
</script>

<style lang="scss" scoped>
.procurement-management-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: #2c3e50;
    font-size: 28px;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
}

// 统计卡片区
.stats-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .stat-number {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 14px;
    opacity: 0.9;
  }
}

// 筛选区域
.filter-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.filter-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  align-items: end;

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-group {
  flex: 1;
  display: flex;
  flex-direction: column;

  label {
    font-weight: 500;
    margin-bottom: 5px;
    color: #2c3e50;
    font-size: 14px;
  }

  input {
    padding: 8px 12px;
    border: 2px solid #e1e8ed;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #4facfe;
    }
  }
}

.date-separator {
  margin: 0 10px;
  color: #666;
  align-self: center;
}

.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-hint {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
}

// 操作工具栏
.action-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  .selection-info {
    color: #666;
    font-size: 14px;
  }
}

// 按钮样式
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &.btn-primary {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
    }
  }

  &.btn-secondary {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2c3e50;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(168, 237, 234, 0.4);
    }
  }
}

// 数据表格
.table-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }

  th {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    font-weight: 600;
    font-size: 14px;
  }

  td {
    font-size: 14px;
    color: #2c3e50;
  }

  tr:hover {
    background-color: #f8f9fa;
  }
}

.project-link {
  color: #4facfe;
  font-weight: 500;
}

.unlinked-text {
  color: #999;
  font-style: italic;
}

.btn-action {
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  }
}

// 状态栏
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.status-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(79, 172, 254, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-info {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}
</style>
