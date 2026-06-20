<template>
  <div class="store-review page-container">
    <div class="stat-row">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :class="[card.cls, { active: filterStatus === card.key }]"
        @click="toggleStatusFilter(card.key)"
      >
        <div class="stat-num">{{ stats[card.field] || 0 }}</div>
        <div class="stat-label">{{ card.label }}</div>
      </div>
    </div>

    <div class="page-toolbar">
      <div class="left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称/描述"
          :prefix-icon="Search"
          clearable
          style="width: 240px"
          @keyup.enter="loadReviews"
          @clear="loadReviews"
        />
        <el-select
          v-model="filterCity"
          placeholder="提交城市"
          clearable
          style="width: 160px"
          @change="loadReviews"
        >
          <el-option
            v-for="city in cities"
            :key="city.id"
            :label="city.name"
            :value="city.id"
          />
        </el-select>
        <el-select
          v-model="filterParentCategory"
          placeholder="选择一级分类"
          clearable
          style="width: 160px"
          @change="loadReviews"
        >
          <el-option
            v-for="cat in parentCategories"
            :key="cat.id"
            :label="`${cat.icon} ${cat.name}`"
            :value="cat.id"
          />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="审核状态"
          clearable
          style="width: 140px"
          @change="loadReviews"
        >
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-button :icon="Search" @click="loadReviews">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" @click="openSubmitDialog">
          新增门店商品申请
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table :data="filteredReviews" v-loading="loading" stripe border>
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
        <el-table-column prop="fullCategoryName" label="分类" width="150" />
        <el-table-column label="价格" width="130" align="right">
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
        <el-table-column label="标签" width="140">
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
            <span v-if="!row.tags || row.tags.length === 0" class="muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="提交城市" width="150">
          <template #default="{ row }">
            <div class="city-cell">
              <span>{{ row.cityName || '--' }}</span>
              <el-tag
                :type="row.isFranchise ? 'danger' : 'info'"
                size="small"
                effect="plain"
              >
                {{ row.isFranchise ? '加盟' : '非加盟' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatTime(row.submittedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.reviewStatus).type" size="small" effect="dark">
              {{ statusMeta(row.reviewStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="180">
          <template #default="{ row }">
            <span v-if="row.reviewRemark" class="remark-text">{{ row.reviewRemark }}</span>
            <span v-else class="muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.reviewStatus === 'pending'">
              <el-button link type="success" @click="openReviewDialog(row, 'approve')">
                通过
              </el-button>
              <el-button link type="danger" @click="openReviewDialog(row, 'reject')">
                驳回
              </el-button>
            </template>
            <el-tag
              v-if="row.reviewStatus === 'approved' && row.productId"
              type="success"
              size="small"
              effect="light"
            >
              已上架
            </el-tag>
            <el-popconfirm
              :title="`确定要删除该审核记录吗？`"
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
      v-model="reviewDialogVisible"
      :title="reviewMode === 'approve' ? '审核通过' : '审核驳回'"
      width="520px"
      destroy-on-close
    >
      <div v-if="reviewRow" class="review-summary">
        <span class="product-icon">{{ reviewRow.icon }}</span>
        <div>
          <div class="product-name">{{ reviewRow.name }}</div>
          <div class="review-meta">
            {{ reviewRow.cityName }} · {{ reviewRow.fullCategoryName }} · ¥{{ reviewRow.price.toFixed(2) }}
          </div>
        </div>
      </div>
      <el-form label-width="90px" style="margin-top: 16px">
        <el-form-item :label="reviewMode === 'approve' ? '审核备注' : '驳回原因'">
          <el-input
            v-model="reviewRemark"
            type="textarea"
            :rows="3"
            :placeholder="
              reviewMode === 'approve'
                ? '可填写审核备注（选填）'
                : '请填写驳回原因（必填）'
            "
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-alert
          v-if="reviewMode === 'approve'"
          type="success"
          :closable="false"
          show-icon
          title="通过后该商品将自动上架至「官方商品库」，可在商品库中进一步配置"
        />
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button
          :type="reviewMode === 'approve' ? 'success' : 'danger'"
          :loading="reviewLoading"
          @click="confirmReview"
        >
          确认{{ reviewMode === 'approve' ? '通过' : '驳回' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="submitDialogVisible"
      title="代城市合伙人提交商品审核"
      width="600px"
      destroy-on-close
      @close="resetSubmitForm"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="城市合伙人新增的商品需经总部审核通过后方可上架"
        style="margin-bottom: 16px"
      />
      <el-form
        ref="submitFormRef"
        :model="submitForm"
        :rules="submitRules"
        label-width="100px"
      >
        <el-form-item label="提交城市" prop="cityId">
          <el-select
            v-model="submitForm.cityId"
            placeholder="请选择城市合伙人所在城市"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="city in cities"
              :key="city.id"
              :label="`${city.name}（${city.province}）`"
              :value="city.id"
            >
              <span style="float: left">{{ city.name }}</span>
              <span style="float: right; color: #909399; font-size: 12px">
                {{ city.isFranchise ? '加盟' : '非加盟' }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="submitForm.name"
            placeholder="请输入商品名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属分类" prop="categoryId">
          <el-cascader
            v-model="submitForm.categoryCascader"
            :options="categoryTree"
            :props="{ checkStrictly: true, value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择分类（选二级分类）"
            style="width: 100%"
            @change="onCascaderChange"
          />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input
            v-model="submitForm.icon"
            placeholder="请输入 emoji 图标"
            maxlength="4"
          />
          <div class="form-tip">支持 emoji 图标，如：🍲 👗 📱</div>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="submitForm.description"
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
                v-model="submitForm.price"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                placeholder="请输入售价"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价">
              <el-input-number
                v-model="submitForm.originalPrice"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                placeholder="请输入原价"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标签">
          <el-select
            v-model="submitForm.tags"
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
            <el-option label="招牌" value="招牌" />
            <el-option label="限量" value="限量" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          提交审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getCategoryTree, getCategories } from '@/api/category'
import { getCities } from '@/api/cityProduct'
import {
  getStoreProductReviews,
  getStoreProductReviewStats,
  createStoreProductReview,
  approveStoreProductReview,
  rejectStoreProductReview,
  deleteStoreProductReview
} from '@/api/storeProduct'

const loading = ref(false)
const submitLoading = ref(false)
const reviewLoading = ref(false)

const reviews = ref([])
const stats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })
const cities = ref([])
const parentCategories = ref([])
const categoryTree = ref([])

const searchKeyword = ref('')
const filterCity = ref('')
const filterParentCategory = ref('')
const filterStatus = ref('')

const reviewDialogVisible = ref(false)
const reviewMode = ref('approve')
const reviewRow = ref(null)
const reviewRemark = ref('')

const submitDialogVisible = ref(false)
const submitFormRef = ref(null)
const submitForm = reactive({
  cityId: '',
  name: '',
  categoryId: '',
  categoryCascader: [],
  icon: '📦',
  description: '',
  price: 0,
  originalPrice: 0,
  tags: []
})

const submitRules = {
  cityId: [{ required: true, message: '请选择提交城市', trigger: 'change' }],
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  icon: [{ required: true, message: '请输入图标', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    { type: 'number', min: 0, message: '售价必须大于等于0', trigger: 'blur' }
  ]
}

const statCards = [
  { key: '', field: 'total', label: '全部申请', cls: 'stat-total' },
  { key: 'pending', field: 'pending', label: '待审核', cls: 'stat-pending' },
  { key: 'approved', field: 'approved', label: '已通过', cls: 'stat-approved' },
  { key: 'rejected', field: 'rejected', label: '已驳回', cls: 'stat-rejected' }
]

const STATUS_MAP = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' }
}

function statusMeta(status) {
  return STATUS_MAP[status] || { label: '--', type: 'info' }
}

function formatTime(t) {
  if (!t) return '--'
  const d = new Date(t)
  if (isNaN(d.getTime())) return '--'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const filteredReviews = computed(() => {
  if (!filterParentCategory.value) return reviews.value
  const parent = categoryTree.value.find((c) => c.id === filterParentCategory.value)
  const allowedIds = parent && parent.children ? parent.children.map((c) => c.id) : []
  return reviews.value.filter((r) => allowedIds.includes(r.categoryId))
})

function toggleStatusFilter(key) {
  filterStatus.value = filterStatus.value === key ? '' : key
  loadReviews()
}

async function loadReviews() {
  loading.value = true
  try {
    const params = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCity.value) params.cityId = filterCity.value
    if (filterStatus.value) params.reviewStatus = filterStatus.value
    const [list, st] = await Promise.all([
      getStoreProductReviews(params),
      getStoreProductReviewStats()
    ])
    reviews.value = list || []
    stats.value = st || stats.value
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  searchKeyword.value = ''
  filterCity.value = ''
  filterParentCategory.value = ''
  filterStatus.value = ''
  loadReviews()
}

async function loadCities() {
  cities.value = await getCities()
}

async function loadParentCategories() {
  parentCategories.value = await getCategories({ parentId: 'null' })
}

async function loadCategoryTree() {
  categoryTree.value = await getCategoryTree()
}

function openSubmitDialog() {
  submitDialogVisible.value = true
}

function onCascaderChange(val) {
  if (val && val.length > 0) {
    submitForm.categoryId = val[val.length - 1]
  } else {
    submitForm.categoryId = ''
  }
}

function resetSubmitForm() {
  submitForm.cityId = ''
  submitForm.name = ''
  submitForm.categoryId = ''
  submitForm.categoryCascader = []
  submitForm.icon = '📦'
  submitForm.description = ''
  submitForm.price = 0
  submitForm.originalPrice = 0
  submitForm.tags = []
  submitFormRef.value?.resetFields()
}

async function handleSubmit() {
  if (!submitFormRef.value) return
  await submitFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      await createStoreProductReview({
        cityId: submitForm.cityId,
        name: submitForm.name,
        categoryId: submitForm.categoryId,
        icon: submitForm.icon,
        description: submitForm.description,
        price: submitForm.price,
        originalPrice: submitForm.originalPrice,
        tags: submitForm.tags
      })
      ElMessage.success('提交成功，等待总部审核')
      submitDialogVisible.value = false
      loadReviews()
    } finally {
      submitLoading.value = false
    }
  })
}

function openReviewDialog(row, mode) {
  reviewRow.value = row
  reviewMode.value = mode
  reviewRemark.value = row.reviewRemark || ''
  reviewDialogVisible.value = true
}

async function confirmReview() {
  if (!reviewRow.value) return
  if (reviewMode.value === 'reject' && !reviewRemark.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  reviewLoading.value = true
  try {
    if (reviewMode.value === 'approve') {
      await approveStoreProductReview(reviewRow.value.id, { reviewRemark: reviewRemark.value })
      ElMessage.success('审核通过，商品已上架至商品库')
    } else {
      await rejectStoreProductReview(reviewRow.value.id, { reviewRemark: reviewRemark.value })
      ElMessage.success('已驳回')
    }
    reviewDialogVisible.value = false
    loadReviews()
  } finally {
    reviewLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await deleteStoreProductReview(row.id)
    ElMessage.success('删除成功')
    loadReviews()
  } catch {}
}

onMounted(() => {
  loadCities()
  loadParentCategories()
  loadCategoryTree()
  loadReviews()
})
</script>

<style scoped>
.store-review {
  height: 100%;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 18px;
  border: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #c0c4cc;
}

.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.active {
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

.stat-card.stat-total {
  border-left-color: #409eff;
}
.stat-card.stat-pending {
  border-left-color: #e6a23c;
}
.stat-card.stat-approved {
  border-left-color: #67c23a;
}
.stat-card.stat-rejected {
  border-left-color: #f56c6c;
}

.stat-num {
  font-size: 26px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
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

.city-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.muted {
  color: #c0c4cc;
}

.remark-text {
  font-size: 13px;
  color: #606266;
  word-break: break-all;
}

.review-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.review-summary .product-icon {
  font-size: 32px;
  width: 44px;
  height: 44px;
}

.review-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
