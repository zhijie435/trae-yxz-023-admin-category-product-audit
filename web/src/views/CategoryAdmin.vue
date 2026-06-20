<template>
  <div class="category-admin">
    <div class="page-card">
      <div class="page-header">
        <div class="page-title">分类管理</div>
        <el-button type="primary" :icon="Plus" @click="handleAddParent">
          新增一级分类
        </el-button>
      </div>

      <div class="category-layout">
        <div class="category-panel">
          <div class="panel-title">
            <span>一级分类</span>
            <span class="panel-tip">拖拽可排序</span>
          </div>
          <div class="category-list" ref="parentListRef">
            <div
              v-for="(item, index) in parentCategories"
              :key="item.id"
              class="category-item"
              :class="{ active: activeParentId === item.id }"
              @click="selectParent(item)"
            >
              <div class="item-left">
                <el-icon class="drag-handle"><Rank /></el-icon>
                <span class="item-icon">{{ item.icon }}</span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <div class="item-right">
                <el-tag v-if="item.status === 1" type="success" size="small">启用</el-tag>
                <el-tag v-else type="info" size="small">禁用</el-tag>
                <el-dropdown trigger="click" @command="(cmd) => handleParentAction(cmd, item)">
                  <el-icon class="more-icon"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="add-child">
                        <el-icon><Plus /></el-icon>添加子分类
                      </el-dropdown-item>
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
            </div>
            <div v-if="parentCategories.length === 0" class="empty-tip">
              暂无一级分类，点击右上角按钮添加
            </div>
          </div>
        </div>

        <div class="category-panel">
          <div class="panel-title">
            <span>二级分类</span>
            <span v-if="activeParent" class="panel-current">
              当前：{{ activeParent.icon }} {{ activeParent.name }}
            </span>
            <el-button
              v-if="activeParent"
              type="primary"
              size="small"
              :icon="Plus"
              @click="handleAddChild"
            >
              新增
            </el-button>
          </div>
          <div class="category-list" ref="childListRef">
            <div
              v-for="(item, index) in childCategories"
              :key="item.id"
              class="category-item child-item"
            >
              <div class="item-left">
                <el-icon class="drag-handle"><Rank /></el-icon>
                <span class="item-icon">{{ item.icon }}</span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <div class="item-right">
                <el-tag v-if="item.status === 1" type="success" size="small">启用</el-tag>
                <el-tag v-else type="info" size="small">禁用</el-tag>
                <el-dropdown trigger="click" @command="(cmd) => handleChildAction(cmd, item)">
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
            </div>
            <div v-if="!activeParent" class="empty-tip">
              请先选择左侧一级分类
            </div>
            <div v-else-if="childCategories.length === 0" class="empty-tip">
              暂无二级分类，点击右上角按钮添加
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="480px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入 emoji 图标" maxlength="4" />
          <div class="icon-tip">支持 emoji 图标，如：📱 👕 💄</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
            maxlength="100"
            show-word-limit
          />
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
  Plus, Edit, Delete, MoreFilled, Rank, SwitchButton
} from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  sortCategories
} from '@/api/category'

const parentListRef = ref(null)
const childListRef = ref(null)
const formRef = ref(null)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const activeParentId = ref(null)
const parentCategories = ref([])
const childCategories = ref([])

const dialogMode = ref('add')
const dialogLevel = ref(1)

const formData = reactive({
  id: '',
  name: '',
  icon: '📁',
  description: '',
  status: 1,
  parentId: null
})

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请输入图标', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => {
  const levelText = dialogLevel.value === 1 ? '一级' : '二级'
  return dialogMode.value === 'add' ? `新增${levelText}分类` : `编辑${levelText}分类`
})

const activeParent = computed(() => {
  return parentCategories.value.find(c => c.id === activeParentId.value) || null
})

async function loadParentCategories() {
  const data = await getCategories({ parentId: 'null' })
  parentCategories.value = data
  if (data.length > 0 && !activeParentId.value) {
    activeParentId.value = data[0].id
  }
}

async function loadChildCategories() {
  if (!activeParentId.value) {
    childCategories.value = []
    return
  }
  const data = await getCategories({ parentId: activeParentId.value })
  childCategories.value = data
}

function selectParent(item) {
  activeParentId.value = item.id
  loadChildCategories()
}

function handleAddParent() {
  dialogMode.value = 'add'
  dialogLevel.value = 1
  formData.parentId = null
  dialogVisible.value = true
}

function handleAddChild() {
  dialogMode.value = 'add'
  dialogLevel.value = 2
  formData.parentId = activeParentId.value
  dialogVisible.value = true
}

function handleParentAction(cmd, item) {
  if (cmd === 'add-child') {
    activeParentId.value = item.id
    loadChildCategories()
    handleAddChild()
  } else if (cmd === 'edit') {
    dialogMode.value = 'edit'
    dialogLevel.value = 1
    formData.id = item.id
    formData.name = item.name
    formData.icon = item.icon
    formData.description = item.description
    formData.status = item.status
    formData.parentId = item.parentId
    dialogVisible.value = true
  } else if (cmd === 'toggle') {
    handleToggleStatus(item)
  } else if (cmd === 'delete') {
    handleDelete(item)
  }
}

function handleChildAction(cmd, item) {
  if (cmd === 'edit') {
    dialogMode.value = 'edit'
    dialogLevel.value = 2
    formData.id = item.id
    formData.name = item.name
    formData.icon = item.icon
    formData.description = item.description
    formData.status = item.status
    formData.parentId = item.parentId
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
    await ElMessageBox.confirm(`确定要${action}该分类吗？`, '提示', {
      type: 'warning'
    })
    await updateCategory(item.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    if (item.parentId === null) {
      loadParentCategories()
    } else {
      loadChildCategories()
    }
  } catch {
    // 用户取消
  }
}

async function handleDelete(item) {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteCategory(item.id)
    ElMessage.success('删除成功')
    if (item.parentId === null) {
      if (activeParentId.value === item.id) {
        activeParentId.value = null
      }
      loadParentCategories()
    }
    loadChildCategories()
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
        await createCategory({
          name: formData.name,
          icon: formData.icon,
          description: formData.description,
          status: formData.status,
          parentId: formData.parentId
        })
        ElMessage.success('创建成功')
      } else {
        await updateCategory(formData.id, {
          name: formData.name,
          icon: formData.icon,
          description: formData.description,
          status: formData.status
        })
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      if (dialogLevel.value === 1) {
        loadParentCategories()
      } else {
        loadChildCategories()
      }
    } finally {
      submitLoading.value = false
    }
  })
}

function resetForm() {
  formData.id = ''
  formData.name = ''
  formData.icon = '📁'
  formData.description = ''
  formData.status = 1
  formData.parentId = null
  formRef.value?.resetFields()
}

function initSortable() {
  nextTick(() => {
    if (parentListRef.value) {
      Sortable.create(parentListRef.value, {
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        animation: 150,
        onEnd: async (evt) => {
          if (evt.oldIndex === evt.newIndex) return
          const items = parentCategories.value.map((item, index) => ({
            id: item.id,
            sort: index + 1
          }))
          try {
            await sortCategories({ parentId: null, items })
            loadParentCategories()
          } catch (err) {
            loadParentCategories()
          }
        }
      })
    }

    if (childListRef.value) {
      Sortable.create(childListRef.value, {
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        animation: 150,
        onEnd: async (evt) => {
          if (evt.oldIndex === evt.newIndex || !activeParentId.value) return
          const items = childCategories.value.map((item, index) => ({
            id: item.id,
            sort: index + 1
          }))
          try {
            await sortCategories({ parentId: activeParentId.value, items })
            loadChildCategories()
          } catch (err) {
            loadChildCategories()
          }
        }
      })
    }
  })
}

onMounted(() => {
  loadParentCategories().then(() => {
    loadChildCategories().then(() => {
      initSortable()
    })
  })
})
</script>

<style scoped>
.category-admin {
  height: 100%;
}

.category-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
}

.category-panel {
  flex: 1;
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 15px;
  color: #1f1f1f;
}

.panel-tip {
  font-size: 12px;
  font-weight: normal;
  color: #999;
}

.panel-current {
  font-size: 13px;
  font-weight: normal;
  color: #666;
  flex: 1;
  margin-left: 12px;
}

.category-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.category-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.child-item {
  margin-left: 16px;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-icon {
  font-size: 20px;
}

.item-name {
  font-size: 14px;
  color: #1f1f1f;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.more-icon {
  cursor: pointer;
  color: #999;
  font-size: 18px;
}

.more-icon:hover {
  color: #409eff;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 0;
}

.icon-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
