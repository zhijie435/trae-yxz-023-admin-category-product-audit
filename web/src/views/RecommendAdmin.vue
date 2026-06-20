<template>
  <div class="recommend-admin">
    <div class="page-card">
      <div class="page-header">
        <div class="page-title">推荐入口管理</div>
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAdd"
          :disabled="recommends.length >= 4"
        >
          新增推荐入口
        </el-button>
      </div>

      <div class="recommend-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>首页推荐入口最多配置 4 个，拖拽卡片可调整排序</span>
        <span class="count-badge">{{ recommends.length }}/4</span>
      </div>

      <div class="recommend-grid" ref="gridRef">
        <div
          v-for="(item, index) in recommends"
          :key="item.id"
          class="recommend-card"
          :style="{
            '--card-color': item.color,
            '--card-bg': item.bgColor
          }"
        >
          <div class="card-header">
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="sort-badge">第{{ index + 1 }}位</span>
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, item)">
              <el-icon class="more-icon"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="toggle" :divided="true">
                    <el-icon><SwitchButton /></el-icon>{{ item.status === 1 ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="card-body">
            <div class="card-icon">{{ item.icon }}</div>
            <div class="card-content">
              <div class="card-title">{{ item.title }}</div>
              <div class="card-subtitle">{{ item.subtitle }}</div>
            </div>
          </div>
          <div class="card-footer">
            <el-tag v-if="item.status === 1" type="success" size="small">启用</el-tag>
            <el-tag v-else type="info" size="small">禁用</el-tag>
            <span class="link-category">
              关联分类：
              <span v-if="getCategoryName(item.categoryId)" class="category-name">
                {{ getCategoryName(item.categoryId) }}
              </span>
              <span v-else class="no-category">未设置</span>
            </span>
          </div>
        </div>

        <div
          v-if="recommends.length < 4"
          class="recommend-card add-card"
          @click="handleAdd"
        >
          <el-icon class="add-icon"><Plus /></el-icon>
          <div class="add-text">添加推荐入口</div>
          <div class="add-hint">还可添加 {{ 4 - recommends.length }} 个</div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入推荐入口标题" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item label="副标题" prop="subtitle">
          <el-input v-model="formData.subtitle" placeholder="请输入副标题" maxlength="15" show-word-limit />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入 emoji 图标" maxlength="4" />
          <div class="form-tip">支持 emoji 图标，如：⚡ 🏷️ 🆕 🎁</div>
        </el-form-item>
        <el-form-item label="主题色" prop="color">
          <el-color-picker v-model="formData.color" />
          <span class="color-text">{{ formData.color }}</span>
        </el-form-item>
        <el-form-item label="背景色" prop="bgColor">
          <el-color-picker v-model="formData.bgColor" show-alpha />
          <span class="color-text">{{ formData.bgColor }}</span>
        </el-form-item>
        <el-form-item label="关联分类" prop="categoryId">
          <el-select
            v-model="formData.categoryId"
            placeholder="请选择关联的一级分类"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="cat in parentCategories"
              :key="cat.id"
              :label="`${cat.icon} ${cat.name}`"
              :value="cat.id"
            />
          </el-select>
          <div class="form-tip">选择后点击推荐入口可跳转到对应分类</div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, MoreFilled, Rank, InfoFilled, SwitchButton
} from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import {
  getRecommends,
  createRecommend,
  updateRecommend,
  deleteRecommend,
  sortRecommends
} from '@/api/recommend'
import { getCategories } from '@/api/category'

const gridRef = ref(null)
const formRef = ref(null)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const recommends = ref([])
const parentCategories = ref([])

const dialogMode = ref('add')

const formData = reactive({
  id: '',
  title: '',
  subtitle: '',
  icon: '⭐',
  color: '#1890ff',
  bgColor: '#e6f7ff',
  categoryId: '',
  status: 1
})

const formRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请输入图标', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '新增推荐入口' : '编辑推荐入口'
})

function getCategoryName(categoryId) {
  const cat = parentCategories.value.find(c => c.id === categoryId)
  return cat ? `${cat.icon} ${cat.name}` : ''
}

async function loadRecommends() {
  const data = await getRecommends()
  recommends.value = data
}

async function loadParentCategories() {
  const data = await getCategories({ parentId: 'null', status: 1 })
  parentCategories.value = data
}

function handleAdd() {
  if (recommends.value.length >= 4) {
    ElMessage.warning('最多只能创建 4 个推荐入口')
    return
  }
  dialogMode.value = 'add'
  dialogVisible.value = true
}

function handleAction(cmd, item) {
  if (cmd === 'edit') {
    dialogMode.value = 'edit'
    formData.id = item.id
    formData.title = item.title
    formData.subtitle = item.subtitle
    formData.icon = item.icon
    formData.color = item.color
    formData.bgColor = item.bgColor
    formData.categoryId = item.categoryId || ''
    formData.status = item.status
    dialogVisible.value = true
  } else if (cmd === 'toggle') {
    handleToggleStatus(item)
  } else if (cmd === 'delete') {
    handleDelete(item)
  }
}

async function handleToggleStatus(item) {
  const newStatus = item.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${action}该推荐入口吗？`, '提示', {
      type: 'warning'
    })
    await updateRecommend(item.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadRecommends()
  } catch {
    // 用户取消
  }
}

async function handleDelete(item) {
  try {
    await ElMessageBox.confirm('确定要删除该推荐入口吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteRecommend(item.id)
    ElMessage.success('删除成功')
    loadRecommends()
  } catch {
    // 用户取消
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogMode.value === 'add') {
        await createRecommend({
          title: formData.title,
          subtitle: formData.subtitle,
          icon: formData.icon,
          color: formData.color,
          bgColor: formData.bgColor,
          categoryId: formData.categoryId || null,
          status: formData.status
        })
        ElMessage.success('创建成功')
      } else {
        await updateRecommend(formData.id, {
          title: formData.title,
          subtitle: formData.subtitle,
          icon: formData.icon,
          color: formData.color,
          bgColor: formData.bgColor,
          categoryId: formData.categoryId || null,
          status: formData.status
        })
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      loadRecommends()
    } finally {
      submitLoading.value = false
    }
  })
}

function resetForm() {
  formData.id = ''
  formData.title = ''
  formData.subtitle = ''
  formData.icon = '⭐'
  formData.color = '#1890ff'
  formData.bgColor = '#e6f7ff'
  formData.categoryId = ''
  formData.status = 1
  formRef.value?.resetFields()
}

function initSortable() {
  nextTick(() => {
    if (gridRef.value) {
      Sortable.create(gridRef.value, {
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        animation: 200,
        filter: '.add-card',
        onEnd: async (evt) => {
          if (evt.oldIndex === evt.newIndex) return
          const items = recommends.value
            .filter(r => r.status !== undefined)
            .map((item, index) => ({
              id: item.id,
              sort: index + 1
            }))
          try {
            await sortRecommends({ items })
            loadRecommends()
          } catch (err) {
            loadRecommends()
          }
        }
      })
    }
  })
}

onMounted(() => {
  loadParentCategories().then(() => {
    loadRecommends().then(() => {
      initSortable()
    })
  })
})
</script>

<style scoped>
.recommend-admin {
  height: 100%;
}

.recommend-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e6f7ff;
  border-radius: 6px;
  color: #1890ff;
  font-size: 13px;
  margin-bottom: 20px;
}

.count-badge {
  margin-left: auto;
  background: #1890ff;
  color: #fff;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.recommend-card {
  background: var(--card-bg, #f5f5f5);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.recommend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--card-color, #1890ff);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.sort-badge {
  background: rgba(255, 255, 255, 0.8);
  color: var(--card-color, #1890ff);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.more-icon {
  margin-left: auto;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  font-size: 18px;
}

.more-icon:hover {
  color: var(--card-color, #1890ff);
}

.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 48px;
  line-height: 1;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-subtitle {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.link-category {
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-name {
  color: var(--card-color, #1890ff);
  font-weight: 500;
}

.no-category {
  color: #ccc;
}

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  background: #fafafa;
  border: 2px dashed #d9d9d9;
  color: #999;
}

.add-card:hover {
  border-color: #409eff;
  background: #f0f7ff;
  color: #409eff;
}

.add-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.add-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.add-hint {
  font-size: 12px;
  color: #bbb;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.color-text {
  margin-left: 12px;
  font-size: 13px;
  color: #666;
}
</style>
