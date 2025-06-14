<template>
  <div class="module-content">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="page-title">
        <span class="page-icon">📊</span>
        项目管理
      </div>

      <div class="page-stats">
        📈 统计: 总项目 {{ projectStats.total }} | 已关联 {{ projectStats.linked }} | 未关联 {{ projectStats.unlinked }}
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="action-toolbar">
      <div class="toolbar-left">
        <button class="btn btn-primary" @click="showProjectDialog()">+ 新建项目</button>
        <button class="btn btn-secondary" @click="refreshProjects">🔄 刷新</button>
        <button class="btn btn-secondary" @click="exportProjects">📤 导出</button>
      </div>
      <div class="toolbar-right">
        <div class="search-group">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" v-model="projectSearch" placeholder="搜索项目编号/名称/别名">
        </div>
      </div>
    </div>

    <!-- 数据表格区 -->
    <div class="table-section">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>项目编号</th>
            <th>项目名称</th>
            <th>项目别名</th>
            <th>合同数</th>
            <th>采购数</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(project, index) in filteredProjects" :key="project.id">
            <td>{{ index + 1 }}</td>
            <td>{{ project.projectCode }}</td>
            <td>{{ project.projectName }}</td>
            <td>{{ project.projectAlias }}</td>
            <td>{{ project.contractCount || 0 }}</td>
            <td>{{ project.procurementCount || 0 }}</td>
            <td>{{ formatDate(project.createdAt) }}</td>
            <td>
              <button class="btn-action" @click="editProject(project)">编辑</button>
              <button class="btn-action" @click="viewProject(project)">详情</button>
              <button class="btn-action" @click="deleteProject(project)" style="color: #ef4444;">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 状态栏区域 -->
    <div class="status-bar">
      <div class="status-info">共 {{ projectStats.total }} 条记录</div>
      <div class="pagination-controls">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">< 上一页</button>
        <span class="page-info">第 {{ currentPage }}/{{ totalPages }} 页</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">下一页 ></button>
        <select class="page-size-select" v-model="pageSize">
          <option value="10">10▼</option>
          <option value="20">20▼</option>
          <option value="50">50▼</option>
        </select>
      </div>
    </div>

    <!-- 项目编辑模态对话框 -->
    <div class="modal-overlay" :class="{ show: showProjectModal }" @click="closeProjectModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">{{ editingProject.id ? '✏️ 编辑项目' : '✏️ 新建项目' }}</div>
          <button class="modal-close" @click="closeProjectModal">✖️</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">项目编号 *</label>
            <input
              type="text"
              class="form-input"
              v-model="editingProject.projectCode"
              placeholder="请输入项目编号"
              ref="projectCodeInput"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
          <div class="form-group">
            <label class="form-label">项目名称 *</label>
            <input
              type="text"
              class="form-input"
              v-model="editingProject.projectName"
              placeholder="请输入项目名称"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
          <div class="form-group">
            <label class="form-label">项目别名</label>
            <input
              type="text"
              class="form-input"
              v-model="editingProject.projectAlias"
              placeholder="多个别名用逗号分隔"
              autocomplete="off"
              spellcheck="false"
            >
            <div style="color: #64748b; font-size: 12px; margin-top: 4px;">💡 多个别名用逗号分隔</div>
          </div>
          <div class="form-group">
            <label class="form-label">项目描述</label>
            <textarea
              class="form-input form-textarea"
              v-model="editingProject.description"
              placeholder="请输入项目描述"
              spellcheck="false"
            ></textarea>
          </div>
          <div v-if="editingProject.createdAt" style="color: #64748b; font-size: 13px; margin-top: 16px;">
            创建时间: {{ formatDate(editingProject.createdAt) }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeProjectModal">取消</button>
          <button class="btn btn-secondary" @click="resetProjectForm">重置</button>
          <button class="btn btn-primary" @click="saveProject">保存</button>
        </div>
      </div>
    </div>

    <!-- 项目查看模态对话框 -->
    <div class="modal-overlay" :class="{ show: showViewModal }" @click="closeViewModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">📋 查看项目详情</div>
          <button class="modal-close" @click="closeViewModal">✖️</button>
        </div>
        <div class="modal-body">
          <div class="view-info-grid">
            <div class="view-info-item">
              <label class="view-label">项目编号</label>
              <div class="view-value">{{ viewingProject.projectCode || '-' }}</div>
            </div>
            <div class="view-info-item">
              <label class="view-label">项目名称</label>
              <div class="view-value">{{ viewingProject.projectName || '-' }}</div>
            </div>
            <div class="view-info-item">
              <label class="view-label">项目别名</label>
              <div class="view-value">{{ viewingProject.projectAlias || '-' }}</div>
            </div>
            <div class="view-info-item">
              <label class="view-label">合同数量</label>
              <div class="view-value">{{ viewingProject.contractCount || 0 }}</div>
            </div>
            <div class="view-info-item">
              <label class="view-label">采购数量</label>
              <div class="view-value">{{ viewingProject.procurementCount || 0 }}</div>
            </div>
            <div class="view-info-item">
              <label class="view-label">创建时间</label>
              <div class="view-value">{{ formatDate(viewingProject.createdAt) }}</div>
            </div>
            <div class="view-info-item full-width">
              <label class="view-label">项目描述</label>
              <div class="view-value">{{ viewingProject.description || '暂无描述' }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeViewModal">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useProjectStore } from '@renderer/stores/projectStore'
import { ProjectApi } from '@renderer/api/projectApi'
import type { Project } from '@shared/types/database'
import type { IProjectFormData } from '@renderer/types/Project.types'

// 状态管理
const projectStore = useProjectStore()

// 响应式数据
const projectSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showProjectModal = ref(false)
const showViewModal = ref(false)
const editingProject = ref<Partial<Project & IProjectFormData>>({})
const projectCodeInput = ref<HTMLInputElement>()
const viewingProject = ref<Project>({
  id: undefined,
  projectCode: '',
  projectName: '',
  projectAlias: '',
  description: '',
  contractCount: 0,
  procurementCount: 0,
  createdAt: new Date().toISOString()
})

// 项目统计数据
const projectStats = reactive({
  total: 0,
  linked: 0,
  unlinked: 0
})

// 项目列表数据
const projectList = ref<Project[]>([])

// 计算属性
const filteredProjects = computed(() => {
  if (!projectSearch.value) return projectList.value
  const search = projectSearch.value.toLowerCase()
  return projectList.value.filter(project =>
    project.projectCode?.toLowerCase().includes(search) ||
    project.projectName?.toLowerCase().includes(search) ||
    project.projectAlias?.toLowerCase().includes(search)
  )
})

const totalPages = computed(() => {
  return Math.ceil(filteredProjects.value.length / pageSize.value)
})

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 项目管理方法
const showProjectDialog = async (project: Project | null = null) => {
  editingProject.value = project ? {
    ...project,
    projectCode: project.projectCode,
    projectName: project.projectName,
    projectAlias: project.projectAlias,
    description: project.description
  } : {
    id: undefined,
    projectCode: '',
    projectName: '',
    projectAlias: '',
    description: '',
    contractCount: 0,
    procurementCount: 0,
    createdAt: new Date().toISOString()
  }
  showProjectModal.value = true

  // 自动聚焦到第一个输入框
  await nextTick()
  if (projectCodeInput.value) {
    projectCodeInput.value.focus()
  }
}

const editProject = (project: Project) => {
  showProjectDialog(project)
}

const closeProjectModal = () => {
  showProjectModal.value = false
  editingProject.value = {}
}

const resetProjectForm = () => {
  if (editingProject.value.id) {
    // 编辑模式，重置为原始数据
    const originalProject = projectList.value.find(p => p.id === editingProject.value.id)
    if (originalProject) {
      editingProject.value = {
        ...originalProject,
        projectCode: originalProject.projectCode,
        projectName: originalProject.projectName,
        projectAlias: originalProject.projectAlias,
        description: originalProject.description
      }
    }
  } else {
    // 新建模式，清空表单
    editingProject.value = {
      id: undefined,
      projectCode: '',
      projectName: '',
      projectAlias: '',
      description: '',
      contractCount: 0,
      procurementCount: 0,
      createdAt: new Date().toISOString()
    }
  }
}

const saveProject = async () => {
  if (!editingProject.value.projectCode || !editingProject.value.projectName) {
    ElMessage.error('请填写项目编号和项目名称')
    return
  }

  try {
    const projectData: IProjectFormData = {
      projectCode: editingProject.value.projectCode,
      projectName: editingProject.value.projectName,
      projectAlias: editingProject.value.projectAlias || '',
      description: editingProject.value.description || ''
    }

    if (editingProject.value.id) {
      // 编辑模式
      const response = await ProjectApi.updateProject(editingProject.value.id, projectData)
      if (response.success) {
        ElMessage.success('项目更新成功！')
        // 强制刷新项目列表
        await loadProjects()
        // 确保数据更新后重新计算统计
        updateProjectStats()
      } else {
        ElMessage.error(response.error || '项目更新失败')
        return
      }
    } else {
      // 新建模式
      const response = await ProjectApi.createProject(projectData)
      if (response.success) {
        ElMessage.success('项目创建成功！')
        console.log('项目创建成功，响应数据:', response.data)
        // 强制刷新项目列表
        await loadProjects()
        // 确保数据更新后重新计算统计
        updateProjectStats()
        console.log('项目列表已刷新，当前项目数量:', projectList.value.length)
      } else {
        ElMessage.error(response.error || '项目创建失败')
        return
      }
    }

    closeProjectModal()
  } catch (error) {
    ElMessage.error('操作失败，请重试')
    console.error('Save project error:', error)
  }
}

const deleteProject = async (project: Project) => {
  if (confirm(`确定删除项目 "${project.projectName}" 吗？\n\n注意：删除项目不会影响已关联的合同和采购数据，但会解除关联关系。`)) {
    try {
      console.log('=== 前端删除项目开始 ===')
      console.log('删除项目ID:', project.id, '类型:', typeof project.id)
      console.log('删除项目名称:', project.projectName)
      console.log('删除前项目列表数量:', projectList.value.length)

      // 调用真实的API删除项目
      const response = await ProjectApi.deleteProject(project.id!)
      console.log('删除项目API响应:', response)

      if (response.success) {
        console.log('删除成功，开始重新加载项目列表...')

        // 先从本地列表中移除已删除的项目（立即更新UI）
        const projectIndex = projectList.value.findIndex(p => p.id === project.id)
        if (projectIndex !== -1) {
          projectList.value.splice(projectIndex, 1)
          console.log('已从本地列表移除项目，当前数量:', projectList.value.length)
        }

        // 然后重新从数据库加载最新数据以确保同步
        await loadProjects()
        console.log('项目列表重新加载完成，最终数量:', projectList.value.length)

        ElMessage.success('项目删除成功！')
        console.log('=== 前端删除项目完成 ===')
      } else {
        ElMessage.error(response.error || '项目删除失败')
        console.error('项目删除失败:', response.error)
      }
    } catch (error) {
      ElMessage.error('删除失败，请重试')
      console.error('Delete project error:', error)
    }
  }
}

const viewProject = (project: Project) => {
  viewingProject.value = { ...project }
  showViewModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
  viewingProject.value = {
    id: undefined,
    projectCode: '',
    projectName: '',
    projectAlias: '',
    description: '',
    contractCount: 0,
    procurementCount: 0,
    createdAt: new Date().toISOString()
  }
}

const refreshProjects = async () => {
  try {
    await loadProjects()
    ElMessage.success('项目数据刷新成功！')
  } catch (error) {
    ElMessage.error('刷新失败，请重试')
  }
}

const exportProjects = async () => {
  if (filteredProjects.value.length === 0) {
    ElMessage.warning('没有可导出的项目数据')
    return
  }

  try {
    // 准备导出数据
    const exportData = filteredProjects.value.map(project => ({
      id: project.id,
      projectCode: project.projectCode,
      projectName: project.projectName,
      projectAlias: project.projectAlias,
      description: project.description,
      status: project.status,
      contractCount: project.contractCount || 0,
      procurementCount: project.procurementCount || 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }))

    // 调用导出API
    const response = await window.electronAPI.file.exportJson(exportData, 'project')
    if (!response.success) {
      ElMessage.error(`导出失败: ${response.error}`)
      return
    }

    const filePath = response.data
    ElMessage.success({
      message: `项目数据导出成功！共导出 ${exportData.length} 条记录`,
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
    console.error('项目导出失败:', error)
    ElMessage.error('项目导出失败，请重试')
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

// 加载项目数据
const loadProjects = async () => {
  try {
    console.log('=== 开始加载项目数据 ===')

    // 使用分页参数调用API，确保获取最新数据
    const params = {
      page: 1,
      pageSize: 1000, // 获取所有项目
      keyword: projectSearch.value || undefined
    }

    console.log('调用API参数:', params)
    const response = await ProjectApi.getProjectList(params)
    console.log('项目数据API响应:', response)

    if (response.success && response.data) {
      const newProjects = response.data.items || []
      console.log(`获取到 ${newProjects.length} 个项目:`)
      newProjects.forEach((project, index) => {
        console.log(`  ${index + 1}. ID: ${project.id} | 编号: ${project.projectCode} | 名称: ${project.projectName}`)
      })

      // 强制清空并重新设置项目列表
      projectList.value.length = 0
      projectList.value.push(...newProjects)

      // 更新统计数据
      updateProjectStats()

      console.log('项目列表已更新，当前数量:', projectList.value.length)
      console.log('=== 项目数据加载完成 ===')
    } else {
      console.error('加载项目数据失败:', response.error)
      ElMessage.error(response.error || '加载项目数据失败')
    }
  } catch (error) {
    console.error('Load projects error:', error)
    ElMessage.error('加载数据失败，请重试')
  }
}

// 更新统计数据
const updateProjectStats = () => {
  projectStats.total = projectList.value.length
  projectStats.linked = projectList.value.filter(p => (p.contractCount || 0) > 0 || (p.procurementCount || 0) > 0).length
  projectStats.unlinked = projectStats.total - projectStats.linked
}

// 生命周期
onMounted(async () => {
  await loadProjects()
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
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
}

.module-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

/* 页面标题区 */
.page-header {
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  letter-spacing: -0.025em;
}

.page-icon {
  margin-right: 12px;
  font-size: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-stats {
  color: #475569;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-stats::before {
  content: '📊';
  margin-right: 4px;
}

/* 操作工具栏 */
.action-toolbar {
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 16px;
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
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  border: 2px solid transparent;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
  font-weight: 700;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.45);
}

.btn-secondary {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #1f2937;
  border: 2px solid #e5e7eb;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-weight: 600;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
}

.btn-action {
  padding: 8px 16px;
  margin-right: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: #ffffff;
  color: #374151;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-action:hover {
  background: #f0f9ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

/* 搜索组件 */
.search-group {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 280px;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-group:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  background: #ffffff;
}

.search-icon {
  color: #6b7280;
  margin-right: 8px;
  font-size: 16px;
}

.search-input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  background: transparent;
}

.search-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

/* 数据表格区 */
.table-section {
  flex: 1;
  overflow: auto;
  margin: 16px 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  min-height: 0;
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

/* 状态栏区域 */
.status-bar {
  padding: 16px 32px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(249, 250, 251, 0.9);
  backdrop-filter: blur(10px);
  font-size: 14px;
  color: #64748b;
  flex-shrink: 0;
  font-weight: 500;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-info::before {
  content: '📋';
  font-size: 16px;
}

.pagination-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-btn {
  padding: 10px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #1f2937;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
}

.page-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  background: #f1f5f9;
  color: #9ca3af;
}

.page-info {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  padding: 0 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-size-select {
  padding: 10px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #1f2937;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  min-height: 36px;
  cursor: pointer;
}

.page-size-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
}

.page-size-select:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  transform: scale(1.02);
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
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1.5px solid #e5e7eb;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-weight: 600;
}

.modal-close:hover {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #f87171;
  color: #ef4444;
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.25);
}

.modal-close:active {
  transform: scale(0.95) rotate(90deg);
}

.modal-body {
  padding: 32px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.5);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(203, 213, 225, 0.8);
  border-radius: 3px;
}

.modal-footer {
  padding: 24px 32px 32px;
  border-top: 1px solid rgba(241, 245, 249, 0.8);
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
  letter-spacing: 0.025em;
}

.form-input {
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
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.form-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

/* 查看详情样式 */
.view-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.view-info-item {
  display: flex;
  flex-direction: column;
}

.view-info-item.full-width {
  grid-column: 1 / -1;
}

.view-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.view-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
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
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 0 12px;
  min-width: 280px;
}

.search-icon {
  color: var(--text-muted);
  margin-right: 8px;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-primary);
  width: 100%;
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* 筛选选择器 */
.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

/* 数据表格区 */
.table-section {
  flex: 1;
  overflow: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  margin: 0 16px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-secondary);
}

.data-table tbody tr:hover {
  background: var(--light-blue);
}

/* 状态栏 */
.status-bar {
  padding: 12px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.status-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: var(--transition);
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0 8px;
}

.page-size-select {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
}

/* 模态对话框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000 !important;
  opacity: 0;
  visibility: hidden;
  transition: var(--transition);
}

.modal-overlay.show {
  opacity: 1 !important;
  visibility: visible !important;
}

.modal-content {
  background: #ffffff !important;
  border-radius: var(--border-radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  transform: translateY(20px);
  transition: var(--transition);
  border: 1px solid #e2e8f0;
}

.modal-overlay.show .modal-content {
  transform: translateY(0);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc !important;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b !important;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b !important;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: var(--transition);
}

.modal-close:hover {
  background: #f1f5f9 !important;
  color: #475569 !important;
}

.modal-body {
  padding: 24px;
  background: #ffffff !important;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #f8fafc !important;
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

.form-label.required::after {
  content: ' *';
  color: #dc2626 !important;
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

/* 查看模态框样式 */
.view-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.view-info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.view-info-item.full-width {
  grid-column: 1 / -1;
}

.view-label {
  font-weight: 600;
  color: #1e293b !important;
  font-size: 14px;
}

.view-value {
  padding: 10px 12px;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px;
  color: #475569 !important;
  font-size: 14px;
  min-height: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .action-toolbar {
    flex-wrap: wrap;
  }
  .toolbar-right {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .module-content {
    height: auto;
    min-height: 100vh;
  }

  .action-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .toolbar-left, .toolbar-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .search-group {
    min-width: auto;
    width: 100%;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 8px 12px;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
