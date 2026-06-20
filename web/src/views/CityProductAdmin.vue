<template>
  <div class="city-product-admin page-container">
    <div class="page-toolbar">
      <div class="left">
        <el-alert
          type="success"
          :closable="false"
          show-icon
          title="每个城市（含加盟/非加盟）拥有独立的商品池：官方默认商品 + 城市自选商品合并展示，可拖拽或上下移动调整展示顺序"
        />
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="7">
        <el-card shadow="never" class="city-card">
          <template #header>
            <div class="card-header">
              <span>城市列表</span>
              <el-tag type="warning" size="small">共 {{ cities.length }} 个</el-tag>
            </div>
          </template>
          <div class="city-list">
            <div
              v-for="city in cities"
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
                <el-tag :type="city.isFranchise ? 'danger' : 'info'" size="small" effect="plain">
                  {{ city.isFranchise ? '加盟' : '非加盟' }}
                </el-tag>
                <el-tag
                  v-if="poolData && poolData.cityId === city.id"
                  type="success"
                  size="small"
                  effect="light"
                >
                  {{ poolData.total }} 件
                </el-tag>
                <el-icon class="arrow"><ArrowRight /></el-icon>
              </div>
            </div>
            <div v-if="cities.length === 0" class="empty-tip">暂无城市</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="17">
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon><Goods /></el-icon>
                <span v-if="poolData">「{{ poolData.cityName }}」城市商品池</span>
                <span v-else>请选择左侧城市</span>
                <template v-if="poolData">
                  <el-tag type="success" size="small" effect="dark">官方默认 {{ poolData.officialDefaultCount }}</el-tag>
                  <el-tag type="warning" size="small" effect="dark">城市自选 {{ poolData.cityAddedCount }}</el-tag>
                </template>
              </div>
              <div class="header-right">
                <el-tooltip content="拖动商品行或使用上下移按钮调整展示顺序，保存后生效" placement="top">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
                <el-button
                  type="success"
                  :icon="Check"
                  :disabled="!dirty || !poolData"
                  :loading="saving"
                  @click="saveSort"
                >
                  保存排序
                </el-button>
                <el-button
                  type="primary"
                  :icon="Plus"
                  :disabled="!poolData"
                  @click="openProductSelector"
                >
                  添加商品
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="poolData" class="config-content" v-loading="loading">
            <div v-if="localPool.length > 0">
              <div
                v-for="(item, index) in localPool"
                :key="item.productId"
                class="product-config-item"
                :class="{
                  'is-official': item.isOfficialDefault,
                  'is-custom': !item.isOfficialDefault,
                  dragging: dragIndex === index
                }"
                draggable="true"
                @dragstart="onDragStart(index)"
                @dragover.prevent="onDragOver(index)"
                @dragend="onDragEnd"
                @drop.prevent="onDrop"
              >
                <div class="drag-handle" title="拖动排序">
                  <el-icon><Rank /></el-icon>
                </div>
                <div class="rank-badge">{{ index + 1 }}</div>
                <span class="product-icon">{{ item.productIcon }}</span>
                <div class="product-main">
                  <div class="product-name">
                    {{ item.productName }}
                    <el-tag
                      v-if="item.isOfficialDefault"
                      type="success"
                      size="small"
                      effect="plain"
                    >
                      官方默认
                    </el-tag>
                    <el-tag
                      v-if="!item.isOfficialDefault"
                      type="warning"
                      size="small"
                      effect="plain"
                    >
                      城市自选
                    </el-tag>
                  </div>
                  <div class="product-meta">
                    {{ item.productFullCategoryName }} · ¥{{ Number(item.productPrice).toFixed(2) }}
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
                    上移
                  </el-button>
                  <el-button
                    link
                    type="primary"
                    :disabled="index === localPool.length - 1"
                    @click="moveDown(index)"
                  >
                    <el-icon><Bottom /></el-icon>
                    下移
                  </el-button>
                  <el-popconfirm
                    :title="
                      item.isOfficialDefault
                        ? '将清除该商品在本城市的显式排序（商品仍作为官方默认出现在池中）？'
                        : '确定要从该城市商品池中移除吗？'
                    "
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
              description="暂无商品，请添加商品到城市池"
              :image-size="120"
            />
          </div>

          <el-empty
            v-else
            description="请先在左侧选择一个城市"
            :image-size="150"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="selectorVisible"
      title="添加商品到城市商品池"
      width="720px"
      destroy-on-close
    >
      <div class="selector-toolbar">
        <el-input
          v-model="selectorKeyword"
          placeholder="搜索商品名称"
          :prefix-icon="Search"
          clearable
          style="width: 260px"
        />
        <el-select
          v-model="selectorCategory"
          placeholder="选择一级分类"
          clearable
          style="width: 180px"
        >
          <el-option
            v-for="cat in parentCategories"
            :key="cat.id"
            :label="`${cat.icon || ''} ${cat.name}`"
            :value="cat.id"
          />
        </el-select>
        <el-radio-group v-model="selectorScope" size="small">
          <el-radio-button value="all">全部商品</el-radio-button>
          <el-radio-button value="default">默认商品</el-radio-button>
        </el-radio-group>
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
            <span style="color:#f56c6c;font-weight:600">¥{{ Number(row.price).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="默认" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">是</el-tag>
            <span v-else style="color:#c0c4cc">--</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="isInPool(row.id) ? 'success' : 'info'" size="small">
              {{ isInPool(row.id) ? '已在池中' : '可添加' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span>已选择 {{ selectorSelectedIds.length }} 个可添加商品</span>
        <div>
          <el-button @click="selectorVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="selectorSelectedIds.length === 0"
            :loading="adding"
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
  QuestionFilled, Top, Bottom, Delete, Rank, Check
} from '@element-plus/icons-vue'
import { getCategories } from '@/api/category'
import { getProducts } from '@/api/product'
import {
  getCities,
  getCityProductPool,
  saveCityPoolSort,
  removePoolProduct,
  batchAddCityProducts
} from '@/api/cityProduct'

const loading = ref(false)
const saving = ref(false)
const adding = ref(false)

const cities = ref([])
const poolData = ref(null)
const localPool = ref([])
const parentCategories = ref([])
const allProducts = ref([])

const activeCityId = ref('')
const dirty = ref(false)

const dragIndex = ref(-1)

const selectorVisible = ref(false)
const selectorKeyword = ref('')
const selectorCategory = ref('')
const selectorScope = ref('all')
const selectorSelectedIds = ref([])
const selectorTableRef = ref(null)

const filteredSelectorProducts = computed(() => {
  let list = allProducts.value.filter((p) => Number(p.status) === 1)
  if (selectorScope.value === 'default') {
    list = list.filter((p) => p.isDefault)
  }
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
      list = list.filter((p) => p.parentCategoryName === parent.name)
    }
  }
  return list
})

function isInPool(productId) {
  return localPool.value.some((p) => p.productId === productId)
}

async function selectCity(city) {
  if (activeCityId.value === city.id) return
  if (dirty.value) {
    try {
      await ElMessageBox.confirm(
        '当前城市排序未保存，切换城市将丢失修改，是否继续？',
        '提示',
        { type: 'warning' }
      )
    } catch {
      return
    }
  }
  activeCityId.value = city.id
  loadPool(city.id)
}

async function loadCities() {
  cities.value = await getCities({ status: 1 })
  if (cities.value.length > 0 && !activeCityId.value) {
    activeCityId.value = cities.value[0].id
    loadPool(activeCityId.value)
  }
}

async function loadPool(cityId) {
  loading.value = true
  dirty.value = false
  try {
    const data = await getCityProductPool(cityId)
    poolData.value = data
    localPool.value = (data.pool || []).map((p) => ({ ...p }))
  } finally {
    loading.value = false
  }
}

async function loadParentCategories() {
  parentCategories.value = await getCategories({ parentId: 'null' })
}

async function loadAllProducts() {
  allProducts.value = await getProducts({ status: 1 })
}

function markDirty() {
  dirty.value = true
}

function moveUp(index) {
  if (index <= 0) return
  const arr = [...localPool.value]
  const tmp = arr[index - 1]
  arr[index - 1] = arr[index]
  arr[index] = tmp
  localPool.value = arr
  markDirty()
}

function moveDown(index) {
  const arr = [...localPool.value]
  if (index >= arr.length - 1) return
  const tmp = arr[index + 1]
  arr[index + 1] = arr[index]
  arr[index] = tmp
  localPool.value = arr
  markDirty()
}

function onDragStart(index) {
  dragIndex.value = index
}
function onDragOver(index) {
  if (dragIndex.value === -1 || dragIndex.value === index) return
  const arr = [...localPool.value]
  const [moved] = arr.splice(dragIndex.value, 1)
  arr.splice(index, 0, moved)
  localPool.value = arr
  dragIndex.value = index
  markDirty()
}
function onDrop() {
  dragIndex.value = -1
}
function onDragEnd() {
  dragIndex.value = -1
}

async function saveSort() {
  if (!poolData.value || localPool.value.length === 0) return
  saving.value = true
  try {
    const items = localPool.value.map((p, idx) => ({ productId: p.productId, sort: idx }))
    await saveCityPoolSort(poolData.value.cityId, items)
    ElMessage.success('商品池排序已保存')
    dirty.value = false
    await loadPool(poolData.value.cityId)
  } finally {
    saving.value = false
  }
}

async function removeProduct(item) {
  try {
    await removePoolProduct(poolData.value.cityId, item.productId)
    ElMessage.success('操作成功')
    await loadPool(poolData.value.cityId)
  } catch (e) {
    // ignore
  }
}

function openProductSelector() {
  selectorKeyword.value = ''
  selectorCategory.value = ''
  selectorScope.value = 'all'
  selectorSelectedIds.value = []
  selectorVisible.value = true
  nextTick(() => {
    selectorTableRef.value && selectorTableRef.value.clearSelection()
  })
}

function onSelectorSelectionChange(selection) {
  selectorSelectedIds.value = selection.filter((p) => !isInPool(p.id)).map((p) => p.id)
}

async function confirmAddProducts() {
  if (selectorSelectedIds.value.length === 0) return
  adding.value = true
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
    await loadPool(activeCityId.value)
  } finally {
    adding.value = false
  }
}

onMounted(() => {
  loadCities()
  loadParentCategories()
  loadAllProducts()
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

.city-card :deep(.el-card__body),
.config-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
}

.city-card :deep(.el-card__body) {
  padding: 12px;
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

.config-content {
  padding: 4px 0;
}

.product-config-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s, transform 0.15s;
}

.product-config-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.product-config-item.dragging {
  opacity: 0.5;
  border-style: dashed;
  border-color: #409eff;
}

.product-config-item.is-official {
  background: linear-gradient(180deg, #f0f9eb 0%, #ffffff 60%);
  border-color: #b3e19d;
}

.product-config-item.is-custom {
  background: linear-gradient(180deg, #fdf6ec 0%, #ffffff 60%);
  border-color: #f5dab1;
}

.drag-handle {
  cursor: grab;
  color: #c0c4cc;
  font-size: 18px;
  padding: 4px;
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.rank-badge {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.product-icon {
  font-size: 30px;
  width: 42px;
  height: 42px;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.product-meta {
  font-size: 12px;
  color: #909399;
}

.product-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.selector-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  align-items: center;
}

.empty-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 40px 0;
}
</style>

