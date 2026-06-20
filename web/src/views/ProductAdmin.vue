<template>
  <div class="product-admin">
    <div class="page-card">
      <div class="page-header">
        <div class="page-title">商品管理</div>
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新增商品
        </el-button>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          :prefix-icon="Search"
          clearable
          style="width: 220px"
        />
        <el-select
          v-model="filterCategoryId"
          placeholder="选择分类"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="cat in flatCategoryOptions"
            :key="cat.id"
            :label="cat.label"
            :value="cat.id"
          />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="状态"
          clearable
          style="width: 120px"
        >
          <el-option label="全部" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-select
          v-model="filterDefault"
          placeholder="默认商品"
          clearable
          style="width: 140px"
        >
          <el-option label="全部" value="" />
          <el-option label="总部默认" :value="1" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadProducts">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <div class="table-wrapper" ref="tableWrapperRef">
        <el-table
          ref="tableRef"
          :data="products"
          v-loading="loading"
          stripe
          border
          row-key="id"
          class="product-table"
        >
          <el-table-column label="图标" width="80" align="center">
            <template #default="{ row }">
              <span class="product-icon">{{ row.icon }}</span>
            </template>
          </el-table-column>
          <el-table-column label="商品名称" min-width="180">
            <template #default="{ row }">
              <span class="product-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="分类路径" width="200">
            <template #default="{ row }">
              <span class="category-path">{{ row.categoryPath }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" width="160" align="right">
            <template #default="{ row }">
              <div class="price-wrap">
                <span class="price-current">¥{{ Number(row.price).toFixed(2) }}</span>
                <span
                  v-if="row.originalPrice && Number(row.originalPrice) > Number(row.price)"
                  class="price-original"
                >
                  ¥{{ Number(row.originalPrice).toFixed(2) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="总部默认" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="row.isDefault === 1"
                type="warning"
                effect="dark"
                size="small"
                class="default-tag"
              >
                默认
              </el-tag>
              <el-tag v-else type="info" size="small">--</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 1 ? 'success' : 'info'"
                size="small"
              >
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="排序" width="90" align="center">
            <template #default="{ row }">
              <span>{{ row.sort }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" align="center" fixed="right">
            <template #default="{ row, $index }">
              <el-button
                link
                type="primary"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="$index === 0"
                @click="moveUp($index)"
              >
                上移
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="$index === products.length - 1"
                @click="moveDown($index)"
              >
                下移
              </el-button>
              <el-button
                link
                :type="row.status === 1 ? 'warning' : 'success'"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增商品' : '编辑商品'"
      width="560px"
      @close="resetForm"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入商品名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属分类" prop="categoryId">
          <el-select
            v-model="formData.categoryId"
            placeholder="请选择分类（仅二级分类）"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="cat in flatCategoryOptions"
              :key="cat.id"
              :label="cat.label"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input
            v-model="formData.icon"
            placeholder="请输入 emoji 图标"
            maxlength="4"
          />
          <div class="form-tip">支持 emoji 图标，如：🍲 👗 📱</div>
        </el-form-item>
        <el-form-item label="售价" prop="price">
          <el-input-number
            v-model="formData.price"
            :min="0"
            :precision="2"
            :step="1"
            style="width: 100%"
            placeholder="请输入售价"
          />
        </el-form-item>
        <el-form-item label="原价" prop="originalPrice">
          <el-input-number
            v-model="formData.originalPrice"
            :min="0"
            :precision="2"
            :step="1"
            style="width: 100%"
            placeholder="请输入原价"
          />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="总部默认" prop="isDefault">
          <el-switch
            v-model="formData.isDefault"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
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
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { getCategoryTree } from '@/api/category'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  sortProducts
} from '@/api/product'

const tableRef = ref(null)
const formRef = ref(null)
const tableWrapperRef = ref(null)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const loading = ref(false)
const dialogMode = ref('add')

const searchKeyword = ref('')
const filterCategoryId = ref('')
const filterStatus = ref('')
const filterDefault = ref('')

const products = ref([])
const categoryTree = ref([])

const formData = reactive({
  id: '',
  name: '',
  categoryId: '',
  icon: '📦',
  price: 0,
  originalPrice: 0,
  description: '',
  isDefault: 0,
  status: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ],
  icon: [
    { required: true, message: '请输入图标', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    { type: 'number', min: 0, message: '售价必须大于等于 0', trigger: 'blur' }
  ]
}

const flatCategoryOptions = computed(() => {
  const options = []
  categoryTree.value.forEach((parent) => {
    if (parent.children && parent.children.length > 0) {
      parent.children.forEach((child) => {
        options.push({
          id: child.id,
          label: `${parent.icon} ${parent.name} / ${child.icon} ${child.name}`
        })
      })
    }
  })
  return options
})

function getCategoryPath(categoryId) {
  for (const parent of categoryTree.value) {
    if (parent.children) {
      for (const child of parent.children) {
        if (child.id === categoryId) {
          return `${parent.name} / ${child.name}`
        }
      }
    }
  }
  return ''
}

async function loadCategoryTree() {
  categoryTree.value = await getCategoryTree()
}

async function loadProducts() {
  loading.value = true
  try {
    const params = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCategoryId.value) params.categoryId = filterCategoryId.value
    if (filterStatus !== '' && filterStatus.value !== null) params.status = filterStatus.value
    if (filterDefault.value === 1) params.isDefault = 1
    const data = await getProducts(params)
    products.value = data.map((item) => ({
      ...item,
      categoryPath: item.categoryPath || getCategoryPath(item.categoryId)
    }))
  } finally {
    loading.value = false
    nextTick(() => {
      initSortable()
    })
  }
}

function resetFilters() {
  searchKeyword.value = ''
  filterCategoryId.value = ''
  filterStatus.value = ''
  filterDefault.value = ''
  loadProducts()
}

function handleAdd() {
  dialogMode.value = 'add'
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogMode.value = 'edit'
  formData.id = row.id
  formData.name = row.name
  formData.categoryId = row.categoryId
  formData.icon = row.icon
  formData.price = Number(row.price)
  formData.originalPrice = Number(row.originalPrice)
  formData.description = row.description || ''
  formData.isDefault = row.isDefault
  formData.status = row.status
  dialogVisible.value = true
}

async function handleToggleDefault(row) {
  try {
    const newVal = row.isDefault === 1 ? 0 : 1
    await updateProduct(row.id, { isDefault: newVal })
    ElMessage.success(newVal === 1 ? '已设为默认' : '已取消默认')
    loadProducts()
  } catch {}
}

async function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${action}该商品吗？`, '提示', {
      type: 'warning'
    })
    await updateProduct(row.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadProducts()
  } catch {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch {}
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogMode.value === 'add') {
        await createProduct({
          name: formData.name,
          categoryId: formData.categoryId,
          icon: formData.icon,
          price: formData.price,
          originalPrice: formData.originalPrice,
          description: formData.description,
          isDefault: formData.isDefault,
          status: formData.status
        })
        ElMessage.success('创建成功')
      } else {
        await updateProduct(formData.id, {
          name: formData.name,
          categoryId: formData.categoryId,
          icon: formData.icon,
          price: formData.price,
          originalPrice: formData.originalPrice,
          description: formData.description,
          isDefault: formData.isDefault,
          status: formData.status
        })
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      loadProducts()
    } finally {
      submitLoading.value = false
    }
  })
}

function resetForm() {
  formData.id = ''
  formData.name = ''
  formData.categoryId = ''
  formData.icon = '📦'
  formData.price = 0
  formData.originalPrice = 0
  formData.description = ''
  formData.isDefault = 0
  formData.status = 1
  formRef.value?.resetFields()
}

async function moveUp(index) {
  if (index <= 0) return
  const items = [...products.value]
  ;[items[index - 1], items[index]] = [items[index], items[index - 1]]
  products.value = items
  await saveSort()
}

async function moveDown(index) {
  if (index >= products.value.length - 1) return
  const items = [...products.value]
  ;[items[index + 1], items[index]] = [items[index], items[index + 1]]
  products.value = items
  await saveSort()
}

async function saveSort() {
  try {
    const sortItems = products.value.map((item, index) => ({
      id: item.id,
      sort: index + 1
    }))
    await sortProducts(sortItems)
    loadProducts()
  } catch (err) {
    loadProducts()
  }
}

function initSortable() {
  if (!tableWrapperRef.value) return
  const table = tableWrapperRef.value.querySelector('.el-table__body-wrapper tbody')
  if (!table) return
  Sortable.create(table, {
    handle: 'tr',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    animation: 150,
    onEnd: async (evt) => {
      if (evt.oldIndex === evt.newIndex) return
      const items = [...products.value]
      const [moved] = items.splice(evt.oldIndex, 1)
      items.splice(evt.newIndex, 0, moved)
      products.value = items
      try {
        const sortItems = products.value.map((item, index) => ({
          id: item.id,
          sort: index + 1
        }))
        await sortProducts(sortItems)
        loadProducts()
      } catch (err) {
        loadProducts()
      }
    }
  })
}

onMounted(() => {
  loadCategoryTree().then(() => {
    loadProducts()
  })
})
</script>

<style scoped>
.product-admin {
  height: 100%;
}

.page-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
  flex-wrap: wrap;
}

.table-wrapper {
  position: relative;
}

.product-table {
  width: 100%;
}

.product-icon {
  font-size: 28px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
}

.category-path {
  font-size: 13px;
  color: #606266;
}

.price-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.price-current {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
}

.price-original {
  color: #c0c4cc;
  text-decoration: line-through;
  font-size: 12px;
}

.default-tag {
  background: linear-gradient(135deg, #f7ba2a, #e6a23c);
  border: none;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

:deep(.sortable-ghost) {
  opacity: 0.4;
  background: #ecf5ff !important;
}

:deep(.sortable-chosen) {
  background: #ecf5ff !important;
}
</style>
