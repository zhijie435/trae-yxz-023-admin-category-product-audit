<template>
  <div class="city-product-admin page-container">
    <div class="layout">
      <div class="left-panel">
        <div class="panel-header">
          <el-icon class="header-icon"><Location /></el-icon>
          <span class="header-title">非加盟城市列表</span>
          <el-tag type="info" size="small">{{ cities.length }} 个</el-tag>
        </div>
        <div class="city-list">
          <div
            v-for="city in cities"
            :key="city.id"
            class="city-item"
            :class="{ active: activeCityId === city.id }"
            @click="selectCity(city)"
          >
            <div class="city-left">
              <div class="city-name-row">
                <span class="city-name">{{ city.name }}</span>
                <el-tag type="primary" size="small" effect="light">直营</el-tag>
              </div>
              <div class="city-province">{{ city.province }}</div>
            </div>
            <div class="city-right">
              <el-badge
                v-if="getCityCount(city.id) > 0"
                :value="getCityCount(city.id)"
                class="city-badge"
                :max="99"
              />
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
          <el-empty v-if="cities.length === 0" description="暂无非加盟城市" :image-size="80" />
        </div>
      </div>

      <div class="right-panel">
        <template v-if="activeCity">
          <div class="panel-header right-header">
            <div class="header-left">
              <el-icon class="header-icon"><Goods /></el-icon>
              <span class="city-title">{{ activeCity.name }} - 商品配置</span>
              <el-tag type="info" size="small" effect="light">
                总部默认 + 城市定制
              </el-tag>
            </div>
            <div class="header-right">
              <el-tooltip content="清除该城市所有自定义配置，恢复使用总部默认商品排序" placement="top">
                <el-button
                  type="warning"
                  :icon="RefreshLeft"
                  :disabled="customProductCount === 0"
                  @click="handleResetDefault"
                >
                  重置为总部默认
                </el-button>
              </el-tooltip>
              <el-button
                type="primary"
                :icon="Plus"
                @click="openAddDialog"
              >
                批量添加商品
              </el-button>
            </div>
          </div>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="virtual-alert"
            title="默认商品始终显示，可通过排序调整商品展示顺序；新增商品会被加入该城市商品池"
          />

          <div class="product-list">
            <div
              v-for="(item, index) in displayProducts"
              :key="item._key"
              class="product-item"
              :class="{ virtual: item.isOfficialDefault && !item.hasCityConfig }"
            >
              <el-badge :value="index + 1" class="index-badge" />
              <span class="product-icon">{{ item.productIcon }}</span>
              <div class="product-main">
                <div class="product-name-row">
                  <span class="product-name">{{ item.productName }}</span>
                  <el-tag v-if="item.isOfficialDefault && !item.hasCityConfig" type="info" size="small" effect="plain">
                    总部默认
                  </el-tag>
                  <el-tag v-else-if="item.isOfficialDefault && item.hasCityConfig" type="success" size="small" effect="plain">
                    总部默认（已排序）
                  </el-tag>
                  <el-tag v-else type="warning" size="small" effect="plain">
                    城市定制
                  </el-tag>
                </div>
                <div class="product-meta">
                  <span class="product-price">¥{{ Number(item.productPrice).toFixed(2) }}</span>
                  <span class="product-category">{{ item.productFullCategoryName }}</span>
                </div>
              </div>
              <div class="product-actions">
                <el-button
                  link
                  type="primary"
                  :disabled="index === 0"
                  @click="moveUp(index)"
                >
                  <el-icon><Top /></el-icon>
                  <span>上移</span>
                </el-button>
                <el-button
                  link
                  type="primary"
                  :disabled="index === displayProducts.length - 1"
                  @click="moveDown(index)"
                >
                  <el-icon><Bottom /></el-icon>
                  <span>下移</span>
                </el-button>
                <el-button
                  v-if="!item.isOfficialDefault || item.hasCityConfig"
                  link
                  type="danger"
                  @click="handleDelete(item)"
                >
                  <el-icon><Delete /></el-icon>
                  <span>{{ item.isOfficialDefault ? '恢复默认' : '删除' }}</span>
                </el-button>
                <el-tooltip v-else content="纯总部默认商品不可删除，可调整排序" placement="top">
                  <el-button link type="danger" disabled>
                    <el-icon><Delete /></el-icon>
                    <span>删除</span>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
            <el-empty
              v-if="displayProducts.length === 0"
              description="暂无商品"
              :image-size="100"
            >
              <el-button type="primary" @click="openAddDialog">立即添加</el-button>
            </el-empty>
          </div>
        </template>
        <el-empty
          v-else
          description="请先在左侧选择一个城市"
          :image-size="150"
        />
      </div>
    </div>

    <el-dialog
      v-model="addDialogVisible"
      title="批量添加商品"
      width="820px"
      destroy-on-close
    >
      <div class="dialog-toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          :prefix-icon="Search"
          clearable
          style="width: 260px"
        />
        <el-select
          v-model="filterCategoryId"
          placeholder="选择分类"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="cat in topLevelCategories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
        <span class="dialog-tip">共 {{ filteredProducts.length }} 个可选商品</span>
      </div>
      <el-table
        ref="tableRef"
        :data="filteredProducts"
        height="420"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="50" :selectable="isProductSelectable" />
        <el-table-column label="商品" min-width="260">
          <template #default="{ row }">
            <div class="table-product-cell">
              <span class="table-product-icon">{{ row.icon }}</span>
              <div>
                <div class="table-product-name">{{ row.name }}</div>
                <div class="table-product-category">{{ row.fullCategoryName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="110" align="right">
          <template #default="{ row }">
            <span class="table-price">¥{{ Number(row.price).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销量" width="90" align="center">
          <template #default="{ row }">
            {{ formatSales(row.salesCount) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="isProductExist(row.id)"
              type="info"
              size="small"
            >
              已存在
            </el-tag>
            <el-tag v-else type="success" size="small">可添加</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <span>已选择 {{ selectedIds.length }} 个商品</span>
          <div>
            <el-button @click="addDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              :disabled="selectedIds.length === 0"
              @click="handleConfirmAdd"
            >
              确定添加 ({{ selectedIds.length }})
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Location, ArrowRight, Goods, Plus, RefreshLeft, Search,
  Top, Bottom, Delete
} from '@element-plus/icons-vue'
import {
  getCities,
  getCityProductsByCity,
  batchCityProducts,
  resetDefaultCityProducts,
  deleteCityProduct,
  sortCityProducts,
  getCityProductPool,
  sortCityProductPool,
  removeProductFromPool
} from '@/api/cityProduct'
import { getProducts } from '@/api/product'
import { getCategoryTree } from '@/api/category'

const cities = ref([])
const allProducts = ref([])
const categoryTree = ref([])
const activeCityId = ref('')
const cityProductMap = ref({})

const addDialogVisible = ref(false)
const searchKeyword = ref('')
const filterCategoryId = ref('')
const selectedIds = ref([])
const tableRef = ref(null)

const currentPool = ref({ pool: [], total: 0, officialDefaultCount: 0, cityAddedCount: 0 })
const currentCityProducts = ref([])
const localSort = ref([])

const activeCity = computed(() => {
  return cities.value.find((c) => c.id === activeCityId.value) || null
})

const customProductCount = computed(() => {
  return currentCityProducts.value.length
})

const displayProducts = computed(() => {
  if (localSort.value.length > 0) {
    return localSort.value
  }
  return currentPool.value.pool.map((p, idx) => ({
    _key: `p_${p.productId}`,
    id: p.cityProductId || '',
    productId: p.productId,
    productName: p.productName,
    productIcon: p.productIcon,
    productPrice: p.productPrice,
    productFullCategoryName: p.productFullCategoryName,
    isOfficialDefault: p.isOfficialDefault,
    hasCityConfig: p.hasCityConfig,
    sort: p.displayIndex ?? idx
  }))
})

const topLevelCategories = computed(() => {
  return categoryTree.value.map((n) => ({ id: n.id, name: n.name }))
})

const existProductIds = computed(() => {
  const ids = new Set()
  currentPool.value.pool.forEach((p) => ids.add(p.productId))
  return ids
})

const filteredProducts = computed(() => {
  let list = allProducts.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.trim()
    list = list.filter(
      (p) => p.name.includes(kw) || (p.description && p.description.includes(kw))
    )
  }
  if (filterCategoryId.value) {
    const allChildIds = new Set()
    const collect = (nodes, targetId) => {
      const found = nodes.find((n) => n.id === targetId)
      if (found) {
        const walk = (n) => {
          allChildIds.add(n.id)
          if (n.children) n.children.forEach(walk)
        }
        walk(found)
        return true
      }
      for (const n of nodes) {
        if (n.children && collect(n.children, targetId)) return true
      }
      return false
    }
    collect(categoryTree.value, filterCategoryId.value)
    list = list.filter((p) => {
      return allChildIds.has(p.categoryId) ||
        (p.parentCategoryId && allChildIds.has(p.parentCategoryId))
    })
  }
  return list
})

function getCityCount(cityId) {
  const cfg = cityProductMap.value[cityId]
  return cfg ? cfg.length : 0
}

function isProductExist(productId) {
  return existProductIds.value.has(productId)
}

function isProductSelectable(row) {
  return !isProductExist(row.id)
}

function formatSales(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num
}

async function selectCity(city) {
  activeCityId.value = city.id
  localSort.value = []
  await loadCityProducts(city.id)
}

async function loadCities() {
  cities.value = await getCities({ isFranchise: 0 })
}

async function loadAllProducts() {
  allProducts.value = await getProducts({ status: 1 })
}

async function loadCategoryTree() {
  categoryTree.value = await getCategoryTree()
}

async function loadAllCityProductCounts() {
  cityProductMap.value = {}
  for (const city of cities.value) {
    try {
      const list = await getCityProductsByCity(city.id)
      cityProductMap.value[city.id] = list || []
    } catch {
      cityProductMap.value[city.id] = []
    }
  }
}

async function loadCityProducts(cityId) {
  try {
    const [list, pool] = await Promise.all([
      getCityProductsByCity(cityId),
      getCityProductPool(cityId)
    ])
    currentCityProducts.value = list || []
    currentPool.value = pool || { pool: [], total: 0, officialDefaultCount: 0, cityAddedCount: 0 }
  } catch {
    currentCityProducts.value = []
    currentPool.value = { pool: [], total: 0, officialDefaultCount: 0, cityAddedCount: 0 }
  }
}

function openAddDialog() {
  searchKeyword.value = ''
  filterCategoryId.value = ''
  selectedIds.value = []
  addDialogVisible.value = true
  nextTick(() => {
    tableRef.value?.clearSelection()
  })
}

function onSelectionChange(selection) {
  selectedIds.value = selection
    .filter((p) => !isProductExist(p.id))
    .map((p) => p.id)
}

async function handleConfirmAdd() {
  if (selectedIds.value.length === 0) return
  try {
    const res = await batchCityProducts(activeCityId.value, selectedIds.value)
    const added = res && res.added ? res.added : selectedIds.value.length
    ElMessage.success(`成功添加 ${added} 个商品`)
    addDialogVisible.value = false
    localSort.value = []
    await loadCityProducts(activeCityId.value)
    await loadAllCityProductCounts()
  } catch {}
}

async function handleResetDefault() {
  try {
    await ElMessageBox.confirm(
      '确定要重置该城市为总部默认吗？所有自定义配置将被清除。',
      '确认重置',
      { type: 'warning' }
    )
    await resetDefaultCityProducts(activeCityId.value)
    ElMessage.success('已重置为总部默认')
    localSort.value = []
    await loadCityProducts(activeCityId.value)
    await loadAllCityProductCounts()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

async function handleDelete(item) {
  try {
    const msg = item.isOfficialDefault && item.hasCityConfig
      ? '确定要清除该商品的城市排序配置，恢复为总部默认吗？'
      : '确定要删除该商品吗？'
    const title = item.isOfficialDefault ? '确认恢复默认' : '确认删除'
    await ElMessageBox.confirm(msg, title, { type: 'warning' })
    if (item.isOfficialDefault) {
      await removeProductFromPool(activeCityId.value, item.productId)
      ElMessage.success('已恢复为总部默认')
    } else {
      await deleteCityProduct(item.id)
      ElMessage.success('删除成功')
    }
    localSort.value = []
    await loadCityProducts(activeCityId.value)
    await loadAllCityProductCounts()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

async function moveUp(index) {
  const list = [...displayProducts.value]
  if (index <= 0) return
  ;[list[index - 1], list[index]] = [list[index], list[index - 1]]
  await savePoolSort(list)
}

async function moveDown(index) {
  const list = [...displayProducts.value]
  if (index >= list.length - 1) return
  ;[list[index + 1], list[index]] = [list[index], list[index + 1]]
  await savePoolSort(list)
}

async function savePoolSort(list) {
  try {
    const items = list.map((it, idx) => ({
      productId: it.productId, sort: idx
    }))
    await sortCityProductPool(activeCityId.value, items)
    localSort.value = list.map((it, idx) => ({ ...it, sort: idx }))
    await loadCityProducts(activeCityId.value)
    localSort.value = []
  } catch {}
}

onMounted(async () => {
  await Promise.all([
    loadCities(),
    loadAllProducts(),
    loadCategoryTree()
  ])
  await loadAllCityProductCounts()
  if (cities.value.length > 0) {
    await selectCity(cities.value[0])
  }
})
</script>

<style scoped>
.city-product-admin {
  height: 100%;
  width: 100%;
}

.layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 120px);
  min-height: 560px;
}

.left-panel {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 18px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  flex: 1;
}

.right-header {
  justify-content: space-between;
}

.right-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.right-header .header-right {
  display: flex;
  gap: 10px;
}

.city-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
}

.virtual-alert {
  margin: 14px 18px 0;
  border-radius: 6px;
}

.city-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 8px;
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
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.12);
}

.city-left {
  min-width: 0;
  flex: 1;
}

.city-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.city-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f1f1f;
}

.city-province {
  font-size: 12px;
  color: #909399;
}

.city-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.city-badge :deep(.el-badge__content) {
  background: #67c23a;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 14px;
}

.product-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  padding-left: 50px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  position: relative;
  transition: all 0.2s;
}

.product-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.product-item.virtual {
  background: #fafafa;
  border-color: #e4e7ed;
}

.index-badge {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.index-badge :deep(.el-badge__content) {
  width: 28px;
  height: 28px;
  line-height: 26px;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
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

.product-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.product-price {
  font-size: 15px;
  font-weight: 600;
  color: #f56c6c;
}

.product-category {
  font-size: 12px;
  color: #909399;
}

.product-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.product-actions .el-button {
  padding: 4px 8px;
  font-size: 13px;
}

.dialog-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.dialog-tip {
  flex: 1;
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.table-product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-product-icon {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 6px;
}

.table-product-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 2px;
}

.table-product-category {
  font-size: 12px;
  color: #909399;
}

.table-price {
  color: #f56c6c;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.dialog-footer > span {
  font-size: 13px;
  color: #606266;
}

.city-list::-webkit-scrollbar,
.product-list::-webkit-scrollbar {
  width: 6px;
}

.city-list::-webkit-scrollbar-thumb,
.product-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.city-list::-webkit-scrollbar-thumb:hover,
.product-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
