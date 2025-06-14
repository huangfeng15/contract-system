<template>
  <div class="contract-management-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>合同管理</h2>
    </div>

    <!-- 统计卡片区 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-number">{{ contractStats.total }}</div>
        <div class="stat-label">合同总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ contractStats.linked }}</div>
        <div class="stat-label">已关联项目</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ contractStats.unlinked }}</div>
        <div class="stat-label">未关联项目</div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>合同编号:</label>
          <input type="text" v-model="contractFilters.number" placeholder="支持逗号分隔多个编号">
        </div>
        <div class="filter-group">
          <label>关联项目:</label>
          <input type="text" v-model="contractFilters.project" placeholder="项目名称或编号">
        </div>
        <div class="filter-group">
          <label>甲方单位:</label>
          <input type="text" v-model="contractFilters.partyA" placeholder="甲方名称">
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label>乙方单位:</label>
          <input type="text" v-model="contractFilters.partyB" placeholder="乙方名称">
        </div>
        <div class="filter-group">
          <label>签约日期:</label>
          <input type="date" v-model="contractFilters.startDate">
          <span class="date-separator">至</span>
          <input type="date" v-model="contractFilters.endDate">
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
        <button class="btn btn-secondary" @click="exportContracts">📤 导出</button>
        <button class="btn btn-secondary" @click="batchOperations">📦 批量操作</button>
        <button class="btn btn-secondary" @click="refreshContracts">🔄 刷新</button>
      </div>
      <div class="toolbar-right">
        <span class="selection-info">已选择 {{ selectedContracts.length }} 项</span>
      </div>
    </div>

    <!-- 数据表格区 -->
    <div class="table-section">
      <table class="data-table">
        <thead>
          <tr>
            <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll"></th>
            <th>序号</th>
            <th>合同编号</th>
            <th>关联项目</th>
            <th>甲方</th>
            <th>乙方</th>
            <th>签约日期</th>
            <th>合同金额</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(contract, index) in filteredContracts" :key="contract.id">
            <td><input type="checkbox" v-model="selectedContracts" :value="contract.id"></td>
            <td>{{ index + 1 }}</td>
            <td>{{ contract.number }}</td>
            <td>
              <span v-if="contract.projectName" class="project-link">{{ contract.projectName }}</span>
              <span v-else class="unlinked-text">未关联</span>
            </td>
            <td>{{ contract.partyA }}</td>
            <td>{{ contract.partyB }}</td>
            <td>{{ contract.signDate }}</td>
            <td>{{ formatAmount(contract.amount) }}</td>
            <td>
              <button class="btn-action" @click="viewContract(contract)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 状态栏区域 -->
    <div class="status-bar">
      <div class="status-info">已选择 {{ selectedContracts.length }} 项 | 筛选结果 {{ filteredContracts.length }} 条 | 共 {{ contractStats.total }} 条记录</div>
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
const contractSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectAll = ref(false)
const selectedContracts = ref<number[]>([])

// 筛选条件
const contractFilters = reactive({
  number: '',
  project: '',
  partyA: '',
  partyB: '',
  startDate: '',
  endDate: ''
})

// 统计数据
const contractStats = reactive({
  total: 0,
  linked: 0,
  unlinked: 0
})

// 合同列表数据
const contractList = ref([
  {
    id: 1,
    number: 'HT2024001',
    projectName: '智慧城市建设项目',
    partyA: '市政府',
    partyB: '科技有限公司',
    signDate: '2024-01-15',
    amount: 5000000,
    status: '执行中'
  },
  {
    id: 2,
    number: 'HT2024002',
    projectName: '道路改造工程',
    partyA: '交通局',
    partyB: '建设集团',
    signDate: '2024-02-20',
    amount: 3200000,
    status: '执行中'
  },
  {
    id: 3,
    number: 'HT2024003',
    projectName: '',
    partyA: '教育局',
    partyB: '装修公司',
    signDate: '2024-03-10',
    amount: 800000,
    status: '待执行'
  },
  {
    id: 4,
    number: 'HT2024004',
    projectName: '环保设备采购',
    partyA: '环保局',
    partyB: '环保科技',
    signDate: '2024-03-25',
    amount: 1500000,
    status: '执行中'
  },
  {
    id: 5,
    number: 'HT2024005',
    projectName: '',
    partyA: '卫生局',
    partyB: '医疗器械公司',
    signDate: '2024-04-05',
    amount: 2100000,
    status: '已完成'
  }
])

// 计算属性
const filteredContracts = computed(() => {
  let filtered = contractList.value

  // 应用筛选条件
  if (contractFilters.number) {
    const numbers = contractFilters.number.split(',').map(n => n.trim().toLowerCase())
    filtered = filtered.filter(contract =>
      numbers.some(num => contract.number.toLowerCase().includes(num))
    )
  }

  if (contractFilters.project) {
    const search = contractFilters.project.toLowerCase()
    filtered = filtered.filter(contract =>
      contract.projectName && contract.projectName.toLowerCase().includes(search)
    )
  }

  if (contractFilters.partyA) {
    const search = contractFilters.partyA.toLowerCase()
    filtered = filtered.filter(contract =>
      contract.partyA.toLowerCase().includes(search)
    )
  }

  if (contractFilters.partyB) {
    const search = contractFilters.partyB.toLowerCase()
    filtered = filtered.filter(contract =>
      contract.partyB.toLowerCase().includes(search)
    )
  }

  if (contractFilters.startDate) {
    filtered = filtered.filter(contract =>
      contract.signDate >= contractFilters.startDate
    )
  }

  if (contractFilters.endDate) {
    filtered = filtered.filter(contract =>
      contract.signDate <= contractFilters.endDate
    )
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredContracts.value.length / pageSize.value)
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
  Object.keys(contractFilters).forEach(key => {
    contractFilters[key as keyof typeof contractFilters] = ''
  })
  currentPage.value = 1
  ElMessage.success('筛选条件已重置')
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedContracts.value = filteredContracts.value.map(c => c.id)
  } else {
    selectedContracts.value = []
  }
}

const viewContract = (contract: any) => {
  ElMessage.info(`查看合同详情: ${contract.number}`)
}

const batchOperations = () => {
  if (selectedContracts.value.length === 0) {
    ElMessage.warning('请先选择要操作的合同')
    return
  }
  ElMessage.info(`批量操作 ${selectedContracts.value.length} 个合同`)
}

const refreshContracts = () => {
  updateContractStats()
  ElMessage.success('合同数据刷新成功！')
}

const exportContracts = async () => {
  const contracts = selectedContracts.value.length > 0
    ? contractList.value.filter(c => selectedContracts.value.includes(c.id))
    : filteredContracts.value

  if (contracts.length === 0) {
    ElMessage.warning('没有可导出的合同数据')
    return
  }

  try {
    // 准备导出数据
    const exportData = contracts.map(contract => ({
      id: contract.id,
      contractNumber: contract.number,
      projectName: contract.projectName || '未关联',
      partyA: contract.partyA,
      partyB: contract.partyB,
      signDate: contract.signDate,
      amount: contract.amount,
      status: contract.status
    }))

    // 调用导出API
    const response = await window.electronAPI.file.exportJson(exportData, 'contract')
    if (!response.success) {
      ElMessage.error(`导出失败: ${response.error}`)
      return
    }

    const filePath = response.data
    ElMessage.success({
      message: `合同数据导出成功！共导出 ${exportData.length} 条记录`,
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
    console.error('合同导出失败:', error)
    ElMessage.error('合同导出失败，请重试')
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
const updateContractStats = () => {
  contractStats.total = contractList.value.length
  contractStats.linked = contractList.value.filter(c => c.projectName).length
  contractStats.unlinked = contractStats.total - contractStats.linked
}

// 生命周期
onMounted(() => {
  updateContractStats()
})
</script>

<style lang="scss" scoped>
.contract-management-view {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      border-color: #667eea;
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
  }

  &.btn-secondary {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
  font-weight: 500;
}

.unlinked-text {
  color: #999;
  font-style: italic;
}

.btn-action {
  padding: 4px 12px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(79, 172, 254, 0.4);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.contract-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
