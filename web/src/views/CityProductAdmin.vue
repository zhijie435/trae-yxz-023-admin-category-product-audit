<template>
  <div class="city-product-admin page-container">
    <div class="page-toolbar">
      <div class="left">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="仅非加盟城市需要配置默认展示商品，加盟城市使用全量默认商品库"
        />
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="never" class="city-card" header="
          <div style='display:flex;align-items:center;justify-content:space-between'>
            <span>非加盟城市列表</span>
            <el-tag type='warning' size='small'>共 {{ nonFranchiseCities.length }} 个</el-tag>
          </div>
        ">
          <div class="city-list">
            <div
              v-for="city in nonFranchiseCities"
              :key="city.id"
              class="city-item"
              :class="{ active: activeCityId === city.id }"
              @click="selectCity(city)"
            >
              <div class="city-left">
                <el-icon class="city-icon"><LocationFilled /></el-icon>
                <div>
                  <div class="city-name">{{ city.name }}</div>
                  <div class="city-sub">{{ city.province }} · {{ city.code }}</div>
                </div>
              </div>
              <div class="city-right">
                <el-tag
                  v-if="getCityProductCount(city.id) > 0"
                  type="success"
                  size="small"
                  effect="light"
                >
                  已配置 {{ getCityProductCount(city.id) }} 个
                </el-tag>
                <el-tag v-else type="info" size="small">未配置</el-tag>
                <el-icon class="arrow"><ArrowRight /></el-icon>
              </div>
            </div>
            <div v-if="nonFranchiseCities.length === 0" class="empty-tip">
              暂无非加盟城市
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon><Goods /></el-icon>
                <span v-if="activeCity">
                  「{{ activeCity.name }}」默认展示商品配置
                </span>
                <span v-else>请选择左侧城市进行配置</span>
                <el-tag
                  v-if="activeCity"
                  type="warning"
                  size="small"
                  effect="dark"
                  style="margin-left: 8px"
                >
                  优先展示，排序靠前
                </el-tag>
              </div>
              <div class="header-right">
                <el-tooltip content="勾选的商品会在该城市默认置顶展示" placement="top">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
                <el-button
                  type="primary"
                  :icon="Plus"
                  :disabled="!activeCity"
                  @click="openProductSelector"
                >
                  添加商品
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="activeCity" class="config-content">
            <div v-if="activeCityConfig && activeCityConfig.customProducts.length > 0">
              <div
                v-for="(item, index) in activeCityConfig.customProducts"
                :key="item.id"
                class="product-config-item"
              >
                <div class="rank-badge">{{ index + 1 }}</div>
                <span class="product-icon">{{ item.productIcon }}</span>
                <div class="product-main">
                  <div class="product-name">{{ item.productName }}</div>
                  <div class="product-price">¥{{ item.productPrice.toFixed(2) }}</div>
                </div>
                <div class="product-actions">
                  <el-button
                    link
                    type="primary"
                    :disabled="index === 0"
                    @click="moveUp(index)"
                  >
                    <el-icon><Top /></el-icon>
                    上移
                  </el-button>
                  <el-button
                    link
                    type="primary"
                    :disabled="index === activeCityConfig.customProducts.length - 1"
                    @click="moveDown(index)"
                  >
                    <el-icon><Bottom /></el-icon>
                    下移
                  </el-button>
                  <el-popconfirm
                    title="确定要移除该商品吗？"
                    @confirm="removeProduct(item)"
                  >
                    <template #reference>
                      <el-button link type="danger">
                        <el-icon><Delete /></el-icon>
                        移除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>
            <el-empty
              v-else
              description="暂未配置自定义商品，将使用全局默认商品库"
              :image-size="120"
            >
              <el-button type="primary" @click="openProductSelector">
                立即配置
              </el-button>
            </el-empty>
          </div>

          <el-empty
            v-else
            description="请先在左侧选择一个非加盟城市"
            :image-size="150"
          />

          <div v-if="activeCity" class="default-preview">
            <el-divider>全局默认商品（该城市也会展示，按配置商品置顶后排序）</el-divider>
            <div class="default-products-grid">
              <div
                v-for="prod in defaultProducts"
                :key="prod.id"
                class="default-product-item"
                :class="{ custom: isCustomProduct(prod.id) }"
              >
                <el-tag
                  v-if="isCustomProduct(prod.id)"
                  type="success"
                  size="small"
                  class="custom-tag"
                >
                  已置顶
                </el-tag>
                <span class="prod-icon">{{ prod.icon }}</span>
                <div class="prod-name">{{ prod.name }}</div>
                <div class="prod-price">¥{{ prod.price.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="selectorVisible"
      title="选择要添加的商品"
      width="720px"
      destroy-on-close
    >
      <div class="selector-toolbar">
        <el-input
          v-model="selectorKeyword"
          placeholder="搜索商品名称"
          :prefix-icon="Search"
          clearable
          style="width: 280px"
        />
        <el-select
          v-model="selectorCategory"
          placeholder="选择分类"
          clearable
          style="width: 180px"
        >
          <el-option
            v-for="cat in parentCategories"
            :key="cat.id"
            :label="`${cat.icon} ${cat.name}`"
            :value="cat.id"
          />
        </el-select>
      </div>
      <el-table
        ref="selectorTableRef"
        :data="filteredSelectorProducts"
        height="400"
        @selection-change="onSelectorSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:28px">{{ row.icon }}</span>
              <div>
                <div style="font-weight:500">{{ row.name }}</div>
                <div style="font-size:12px;color:#999">{{ row.fullCategoryName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#f56c6c;font-weight:600">¥{{ row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销量" width="100" align="center">
          <template #default="{ row }">
            {{ row.salesCount >= 10000 ? (row.salesCount/10000).toFixed(1)+'w' : row.salesCount }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="isCustomProduct(row.id) ? 'success' : 'info'"
              size="small"
            >
              {{ isCustomProduct(row.id) ? '已添加' : '可添加' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span>已选择 {{ selectorSelectedIds.length }} 个商品</span>
        <div>
          <el-button @click="selectorVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="selectorSelectedIds.length === 0"
            @click="confirmAddProducts"
          >
            确定添加 ({{ selectorSelectedIds.length }})
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, LocationFilled, ArrowRight, Goods,
  QuestionFilled, Top, Bottom, Delete
} from '@element-plus/icons-vue'
import { getCategories } from '@/api/category'
import { getProducts } from '@/api/product'
import {
  getNonFranchiseConfigs,
  createCityProduct,
  deleteCityProduct,
  sortCityProducts,
  batchAddCityProducts
} from '@/api/cityProduct'

const loading = ref(false)
const nonFranchiseCities = ref([])
const defaultProducts = ref([])
const cityConfigs = ref([])
const allProducts = ref([])
const parentCategories = ref([])

const activeCityId = ref('')
const selectorVisible = ref(false)
const selectorKeyword = ref('')
const selectorCategory = ref('')
const selectorSelectedIds = ref([])
const selectorTableRef = ref(null)

const activeCity = computed(() => {
  return nonFranchiseCities.value.find((c) => c.id === activeCityId.value) || null
})

const activeCityConfig = computed(() => {
  return cityConfigs.value.find((c) => c.cityId === activeCityId.value) || null
})

const filteredSelectorProducts = computed(() => {
  let list = allProducts.value.filter((p) => Number(p.status) === 1)
  if (selectorKeyword.value) {
    const kw = selectorKeyword.value.trim()
    list = list.filter(
      (p) => p.name.includes(kw) || (p.description && p.description.includes(kw))
    )
  }
  if (selectorCategory.value) {
    const cats = parentCategories.value
    const parent = cats.find((c) => c.id === selectorCategory.value)
    if (parent) {
      list = list.filter(
        (p) => p.parentCategoryName === parent.name || p.categoryId.startsWith(parent.id.replace('cat-', 'cat-'))
      )
    }
  }
  return list
})

function getCityProductCount(cityId) {
  const cfg = cityConfigs.value.find((c) => c.cityId === cityId)
  return cfg ? cfg.customProducts.length : 0
}

function isCustomProduct(productId) {
  if (!activeCityConfig.value) return false
  return activeCityConfig.value.customProducts.some((p) => p.productId === productId)
}

function selectCity(city) {
  activeCityId.value = city.id
}

async function loadData() {
  loading.value = true
  try {
    const data = await getNonFranchiseConfigs()
    nonFranchiseCities.value = data.nonFranchiseCities || []
    defaultProducts.value = data.defaultProducts || []
    cityConfigs.value = data.cityConfigs || []
    if (nonFranchiseCities.value.length > 0 && !activeCityId.value) {
      activeCityId.value = nonFranchiseCities.value[0].id
    }
  } finally {
    loading.value = false
  }
}

async function loadAllProducts() {
  allProducts.value = await getProducts({ status: 1 })
}

async function loadParentCategories() {
  parentCategories.value = await getCategories({ parentId: 'null' })
}

function openProductSelector() {
  selectorKeyword.value = ''
  selectorCategory.value = ''
  selectorSelectedIds.value = []
  selectorVisible.value = true
  nextTick(() => {
    selectorTableRef.value?.clearSelection()
  })
}

function onSelectorSelectionChange(selection) {
  selectorSelectedIds.value = selection
    .filter((p) => !isCustomProduct(p.id))
    .map((p) => p.id)
}

async function confirmAddProducts() {
  if (selectorSelectedIds.value.length === 0) return
  try {
    const res = await batchAddCityProducts({
      cityId: activeCityId.value,
      productIds: selectorSelectedIds.value
    })
    let msg = `成功添加 ${res.added} 个商品`
    if (res.skipped && res.skipped.length > 0) {
      msg += `，跳过 ${res.skipped.length} 个已存在的商品`
    }
    ElMessage.success(msg)
    selectorVisible.value = false
    loadData()
  } catch {}
}

async function moveUp(index) {
  if (!activeCityConfig.value) return
  const items = [...activeCityConfig.value.customProducts]
  if (index <= 0) return
  ;[items[index - 1], items[index]] = [items[index], items[index - 1]]
  await saveSort(items)
}

async function moveDown(index) {
  if (!activeCityConfig.value) return
  const items = [...activeCityConfig.value.customProducts]
  if (index >= items.length - 1) return
  ;[items[index + 1], items[index]] = [items[index], items[index + 1]]
  await saveSort(items)
}

async function saveSort(items) {
  try {
    const sortItems = items.map((it, idx) => ({ id: it.id, sort: idx }))
    await sortCityProducts({ cityId: activeCityId.value, items: sortItems })
    loadData()
  } catch {}
}

async function removeProduct(item) {
  try {
    await deleteCityProduct(item.id)
    ElMessage.success('移除成功')
    loadData()
  } catch {}
}

onMounted(() => {
  loadData()
  loadAllProducts()
  loadParentCategories()
})
</script>

<style scoped>
.city-product-admin {
  height: 100%;
}

.city-card,
.config-card {
  border-radius: 8px;
  height: calc(100vh - 200px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.city-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.config-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
}

.city-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.city-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.city-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.city-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.city-icon {
  font-size: 22px;
  color: #409eff;
}

.city-name {
  font-weight: 600;
  color: #1f1f1f;
  font-size: 14px;
}

.city-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.city-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow {
  color: #c0c4cc;
  font-size: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-icon {
  color: #909399;
  font-size: 18px;
  cursor: help;
}

.config-content {
  margin-bottom: 20px;
}

.product-config-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.product-config-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.rank-badge {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.product-icon {
  font-size: 32px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-main {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.product-price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
}

.product-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.default-preview {
  margin-top: 20px;
}

.default-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.default-product-item {
  position: relative;
  padding: 12px;
  background: #fafbfc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  text-align: center;
  opacity: 0.85;
}

.default-product-item.custom {
  background: #f0f9eb;
  border-color: #67c23a;
  opacity: 1;
}

.custom-tag {
  position: absolute;
  top: 6px;
  right: 6px;
}

.prod-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 6px;
}

.prod-name {
  font-size: 13px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prod-price {
  font-size: 13px;
  color: #f56c6c;
  font-weight: 600;
}

.selector-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 40px 0;
}
</style>
