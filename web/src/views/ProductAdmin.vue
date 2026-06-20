<template>
  <div class="product-admin page-container">
    <div class="page-toolbar">
      <div class="left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          :prefix-icon="Search"
          clearable
          style="width: 240px"
          @keyup.enter="loadProducts"
          @clear="loadProducts"
        />
        <el-select
          v-model="filterParentCategory"
          placeholder="选择一级分类"
          clearable
          style="width: 160px"
          @change="onParentCategoryChange"
        >
          <el-option
            v-for="cat in parentCategories"
            :key="cat.id"
            :label="`${cat.icon} ${cat.name}`"
            :value="cat.id"
          />
        </el-select>
        <el-select
          v-model="filterCategory"
          placeholder="选择二级分类"
          clearable
          style="width: 160px"
          :disabled="!filterParentCategory"
          @change="loadProducts"
        >
          <el-option
            v-for="cat in childCategories"
            :key="cat.id"
            :label="`${cat.icon} ${cat.name}`"
            :value="cat.id"
          />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="状态"
          clearable
          style="width: 120px"
          @change="loadProducts"
        >
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-select
          v-model="filterDefault"
          placeholder="默认商品"
          clearable
          style="width: 120px"
          @change="loadProducts"
        >
          <el-option label="是默认" value="true" />
          <el-option label="非默认" value="false" />
        </el-select>
        <el-button :icon="Search" @click="loadProducts">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <div class="right">
        <el-button
          v-if="selectedIds.length > 0"
          type="warning"
          @click="handleBatchToggleDefault(true)"
        >
          批量设为默认 ({{ selectedIds.length }})
        </el-button>
        <el-button
          v-if="selectedIds.length > 0"
          type="info"
          @click="handleBatchToggleDefault(false)"
        >
          批量取消默认 ({{ selectedIds.length }})
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新增商品
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table
        ref="tableRef"
        :data="products"
        v-loading="loading"
        stripe
        border
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">
            <div class="product-cell">
              <span class="product-icon">{{ row.icon }}</span>
              <div class="product-info">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-desc">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fullCategoryName" label="分类" width="160" />
        <el-table-column label="价格" width="140" align="right">
          <template #default="{ row }">
            <div class="price-wrap">
              <span class="price-current">¥{{ row.price.toFixed(2) }}</span>
              <span
                v-if="row.originalPrice && row.originalPrice > row.price"
                class="price-original"
              >
                ¥{{ row.originalPrice.toFixed(2) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="salesCount" label="销量" width="100" align="center">
          <template #default="{ row }">
            {{ formatNumber(row.salesCount) }}
          </template>
        </el-table-column>
        <el-table-column label="标签" width="160">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              size="small"
              type="warning"
              effect="light"
              style="margin-right: 4px"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="默认商品" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.isDefault"
              type="success"
              size="small"
              effect="dark"
            >
              默认
            </el-tag>
            <el-tag v-else type="info" size="small">--</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.sort }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="handleToggleDefault(row)"
            >
              {{ row.isDefault ? '取消默认' : '设为默认' }}
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm
              :title="`确定要删除「${row.name}」吗？`"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增商品' : '编辑商品'"
      width="600px"
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
          <el-cascader
            v-model="formData.categoryCascader"
            :options="categoryTree"
            :props="{ checkStrictly: true, value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择分类（选二级分类）"
            style="width: 100%"
            @change="onCascaderChange"
          />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input
            v-model="formData.icon"
            placeholder="请输入 emoji 图标"
            maxlength="4"
          />
          <div class="form-tip">支持 emoji 图标，如：🍲 👗 📱</div>
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
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="售价" prop="price">
              <el-input-number
                v-model="formData.price"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                placeholder="请输入售价"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number
                v-model="formData.originalPrice"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                placeholder="请输入原价"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="销量">
              <el-input-number
                v-model="formData.salesCount"
                :min="0"
                :step="100"
                style="width: 100%"
                placeholder="默认为0"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select
                v-model="formData.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或创建标签"
                style="width: 100%"
              >
                <el-option label="热销" value="热销" />
                <el-option label="推荐" value="推荐" />
                <el-option label="新品" value="新品" />
                <el-option label="限时" value="限时" />
                <el-option label="折扣" value="折扣" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认商品" prop="isDefault">
              <el-switch
                v-model="formData.isDefault"
                active-text="是（非加盟城市展示）"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>
        </el-row>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getCategoryTree, getCategories } from '@/api/category'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  batchToggleDefault
} from '@/api/product'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('add')
const tableRef = ref(null)
const formRef = ref(null)

const searchKeyword = ref('')
const filterParentCategory = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const filterDefault = ref('')
const selectedIds = ref([])

const products = ref([])
const parentCategories = ref([])
const childCategories = ref([])
const categoryTree = ref([])

const dialogData = reactive({
  id: ''
})

const formData = reactive({
  name: '',
  categoryId: '',
  categoryCascader: [],
  icon: '📦',
  description: '',
  price: 0,
  originalPrice: 0,
  salesCount: 0,
  status: 1,
  isDefault: true,
  tags: []
})

const formRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  icon: [{ required: true, message: '请输入图标', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    {
      type: 'number',
      min: 0,
      message: '售价必须大于等于0',
      trigger: 'blur'
    }
  ]
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}

async function loadCategoryTree() {
  categoryTree.value = await getCategoryTree()
}

async function loadParentCategories() {
  parentCategories.value = await getCategories({ parentId: 'null' })
}

async function loadChildCategories() {
  if (!filterParentCategory.value) {
    childCategories.value = []
    return
  }
  childCategories.value = await getCategories({ parentId: filterParentCategory.value })
}

function onParentCategoryChange() {
  filterCategory.value = ''
  loadChildCategories()
  loadProducts()
}

async function loadProducts() {
  loading.value = true
  try {
    const params = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCategory.value) params.categoryId = filterCategory.value
    else if (filterParentCategory.value) params.parentCategoryId = filterParentCategory.value
    if (filterStatus !== '') params.status = filterStatus.value
    if (filterDefault !== '') params.isDefault = filterDefault.value
    products.value = await getProducts(params)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  searchKeyword.value = ''
  filterParentCategory.value = ''
  filterCategory.value = ''
  filterStatus.value = ''
  filterDefault.value = ''
  loadProducts()
}

function onSelectionChange(selection) {
  selectedIds.value = selection.map((item) => item.id)
}

function onSortChange({ prop, order }) {
  if (prop === 'sort' && order) {
    products.value.sort((a, b) => {
      return order === 'ascending' ? a.sort - b.sort : b.sort - a.sort
    })
  }
}

function handleAdd() {
  dialogMode.value = 'add'
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogMode.value = 'edit'
  dialogData.id = row.id
  formData.name = row.name
  formData.categoryId = row.categoryId
  formData.icon = row.icon
  formData.description = row.description
  formData.price = row.price
  formData.originalPrice = row.originalPrice
  formData.salesCount = row.salesCount
  formData.status = row.status
  formData.isDefault = row.isDefault
  formData.tags = [...(row.tags || [])]
  if (row.parentCategoryName) {
    formData.categoryCascader = [findParentId(row.categoryId), row.categoryId]
  } else {
    formData.categoryCascader = [row.categoryId]
  }
  dialogVisible.value = true
}

function findParentId(childId) {
  for (const parent of categoryTree.value) {
    if (parent.children) {
      for (const child of parent.children) {
        if (child.id === childId) return parent.id
      }
    }
  }
  return ''
}

function onCascaderChange(val) {
  if (val && val.length > 0) {
    formData.categoryId = val[val.length - 1]
  } else {
    formData.categoryId = ''
  }
}

async function handleToggleDefault(row) {
  try {
    await updateProduct(row.id, { isDefault: !row.isDefault })
    ElMessage.success(row.isDefault ? '已取消默认' : '已设为默认')
    loadProducts()
  } catch {}
}

async function handleBatchToggleDefault(isDefault) {
  try {
    const action = isDefault ? '设为默认商品' : '取消默认商品'
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedIds.value.length} 个商品${action}吗？`,
      '提示',
      { type: 'warning' }
    )
    await batchToggleDefault({ ids: selectedIds.value, isDefault })
    ElMessage.success('批量操作成功')
    loadProducts()
  } catch {}
}

async function handleDelete(row) {
  try {
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
          description: formData.description,
          price: formData.price,
          originalPrice: formData.originalPrice,
          salesCount: formData.salesCount,
          status: formData.status,
          isDefault: formData.isDefault,
          tags: formData.tags
        })
        ElMessage.success('创建成功')
      } else {
        await updateProduct(dialogData.id, {
          name: formData.name,
          categoryId: formData.categoryId,
          icon: formData.icon,
          description: formData.description,
          price: formData.price,
          originalPrice: formData.originalPrice,
          salesCount: formData.salesCount,
          status: formData.status,
          isDefault: formData.isDefault,
          tags: formData.tags
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
  dialogData.id = ''
  formData.name = ''
  formData.categoryId = ''
  formData.categoryCascader = []
  formData.icon = '📦'
  formData.description = ''
  formData.price = 0
  formData.originalPrice = 0
  formData.salesCount = 0
  formData.status = 1
  formData.isDefault = true
  formData.tags = []
  formRef.value?.resetFields()
}

onMounted(() => {
  loadCategoryTree()
  loadParentCategories()
  loadProducts()
})
</script>

<style scoped>
.product-admin {
  height: 100%;
}

.table-card {
  border-radius: 8px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-icon {
  font-size: 36px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-info {
  min-width: 0;
}

.product-name {
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.product-desc {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
