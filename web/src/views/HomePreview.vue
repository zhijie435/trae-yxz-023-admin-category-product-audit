<template>
  <div class="home-preview">
    <div class="page-toolbar">
      <div class="page-title">首页预览</div>
      <div class="right">
        <div class="city-selector">
          <span class="label">选择城市：</span>
          <el-select v-model="selectedCityId" size="default" style="width: 160px">
            <el-option
              v-for="city in cities"
              :key="city.id"
              :label="city.name"
              :value="city.id"
            />
          </el-select>
          <el-tag v-if="selectedCity" size="small" :type="selectedCity.isFranchise ? 'warning' : 'success'" effect="light">
            {{ selectedCity.isFranchise ? '加盟城市' : '直营城市' }}
          </el-tag>
        </div>
        <el-radio-group v-model="previewMode" size="default">
          <el-radio-button value="mobile">
            <el-icon style="vertical-align: -2px"><Iphone /></el-icon>
            <span style="margin-left: 4px">移动端</span>
          </el-radio-button>
          <el-radio-button value="desktop">
            <el-icon style="vertical-align: -2px"><Monitor /></el-icon>
            <span style="margin-left: 4px">桌面端</span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-if="previewMode === 'mobile'" class="preview-container">
      <div class="phone-frame">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <div class="app-home">
            <div class="app-header">
              <div class="city-tag">
                <el-icon><LocationFilled /></el-icon>
                <span>{{ selectedCity?.name || '北京市' }}</span>
                <el-icon class="arrow-down"><ArrowDown /></el-icon>
              </div>
              <div class="search-bar">
                <el-icon><Search /></el-icon>
                <span>搜索商品、分类</span>
              </div>
            </div>

            <div class="banner-area">
              <div class="banner">
                <div class="banner-text">
                  <div class="banner-title">新人专享优惠</div>
                  <div class="banner-desc">首单立减30元，限时抢购</div>
                </div>
                <div class="banner-icon">🎁</div>
              </div>
            </div>

            <div class="recommend-section">
              <div class="section-header">
                <div class="section-title">热门推荐</div>
                <div class="section-subtitle">精选好物，不容错过</div>
              </div>
              <div class="recommend-grid">
                <div
                  v-for="rec in activeRecommends"
                  :key="rec.id"
                  class="rec-item"
                  :style="{
                    '--rec-bg': rec.bgColor || '#f0f7ff',
                    '--rec-color': rec.color || '#1890ff'
                  }"
                >
                  <div class="rec-icon">{{ rec.icon }}</div>
                  <div class="rec-title">{{ rec.title }}</div>
                  <div class="rec-subtitle">{{ rec.subtitle }}</div>
                </div>
              </div>
            </div>

            <div class="category-section">
              <div class="section-header">
                <div class="section-title">全部分类</div>
                <div class="section-subtitle">按分类浏览商品</div>
              </div>
              <div class="category-grid">
                <div
                  v-for="cat in activeCategories"
                  :key="cat.id"
                  class="cat-item"
                >
                  <div class="cat-icon">{{ cat.icon }}</div>
                  <div class="cat-name">{{ cat.name }}</div>
                </div>
              </div>
            </div>

            <div class="products-section">
              <div class="section-header">
                <div class="section-title">为你推荐</div>
                <div class="section-subtitle">
                  {{ selectedCity?.isFranchise ? '加盟城市 · 全量默认商品库' : '直营城市 · 置顶商品优先展示' }}
                </div>
              </div>
              <div class="products-list">
                <div
                  v-for="(prod, index) in displayProducts"
                  :key="prod.id"
                  class="product-card"
                  :class="{ 'pin-top': !selectedCity?.isFranchise && isCityPinned(prod.id, index) }"
                >
                  <div v-if="!selectedCity?.isFranchise && isCityPinned(prod.id, index)" class="pin-badge">
                    <el-icon style="vertical-align: -1px"><Top /></el-icon>
                    <span>置顶</span>
                  </div>
                  <div class="product-img">{{ prod.icon }}</div>
                  <div class="product-detail">
                    <div class="product-title">{{ prod.name }}</div>
                    <div class="product-desc">{{ prod.description }}</div>
                    <div class="product-footer">
                      <div class="product-price">
                        <span class="price-symbol">¥</span>
                        <span class="price-value">{{ Number(prod.price).toFixed(2) }}</span>
                        <span v-if="prod.originalPrice && Number(prod.originalPrice) > Number(prod.price)" class="price-origin">
                          ¥{{ Number(prod.originalPrice).toFixed(2) }}
                        </span>
                      </div>
                      <span class="product-sales">已售{{ formatSales(prod.salesCount) }}</span>
                    </div>
                  </div>
                  <div class="product-tags">
                    <el-tag
                      v-for="tag in (prod.tags || []).slice(0, 2)"
                      :key="tag"
                      size="small"
                      type="warning"
                      effect="light"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="preview-container">
      <div class="desktop-preview">
        <div class="desktop-header">
          <div class="desktop-logo">🛒 优选商城</div>
          <div class="desktop-city">
            <el-icon><LocationFilled /></el-icon>
            <span>{{ selectedCity?.name || '北京市' }}</span>
          </div>
          <div class="desktop-search">
            <el-icon><Search /></el-icon>
            <span>搜索商品、分类、品牌</span>
          </div>
          <div class="desktop-nav">
            <span>首页</span>
            <span>分类</span>
            <span>购物车</span>
            <span>我的</span>
          </div>
        </div>

        <div class="desktop-main">
          <div class="desktop-banner">
            <div>
              <div class="banner-title-lg">🎉 618年中大促</div>
              <div class="banner-desc-lg">全场满300减50，新人首单再减30</div>
            </div>
            <div class="banner-icon-lg">🎊</div>
          </div>

          <div class="desktop-recommend">
            <div class="products-header-lg">
              <div>
                <div class="section-title-lg">热门推荐</div>
                <div class="section-subtitle-lg">官方精选，品质保证</div>
              </div>
            </div>
            <div class="rec-row">
              <div
                v-for="rec in activeRecommends"
                :key="rec.id"
                class="rec-card"
                :style="{
                  '--rec-bg': rec.bgColor || '#f0f7ff',
                  '--rec-color': rec.color || '#1890ff'
                }"
              >
                <div class="rec-icon-lg">{{ rec.icon }}</div>
                <div class="rec-info">
                  <div class="rec-title-lg">{{ rec.title }}</div>
                  <div class="rec-subtitle-lg">{{ rec.subtitle }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="desktop-categories">
            <div class="products-header-lg">
              <div>
                <div class="section-title-lg">全部分类</div>
                <div class="section-subtitle-lg">按分类快速找到想要的商品</div>
              </div>
            </div>
            <div class="cat-row">
              <div
                v-for="cat in activeCategories"
                :key="cat.id"
                class="cat-card"
              >
                <div class="cat-icon-lg">{{ cat.icon }}</div>
                <div class="cat-name-lg">{{ cat.name }}</div>
                <div class="cat-count">{{ (cat.children || []).length }}个子分类</div>
              </div>
            </div>
          </div>

          <div class="desktop-products">
            <div class="products-header-lg">
              <div>
                <div class="section-title-lg">商品列表</div>
                <div class="section-subtitle-lg">
                  共 {{ displayProducts.length }} 件商品 · {{ selectedCity?.isFranchise ? '加盟城市使用全量默认商品库' : '直营城市置顶商品优先' }}
                </div>
              </div>
            </div>
            <div class="products-grid">
              <div
                v-for="(prod, index) in displayProducts"
                :key="prod.id"
                class="product-grid-card"
                :class="{ 'pin-card': !selectedCity?.isFranchise && isCityPinned(prod.id, index) }"
              >
                <div v-if="!selectedCity?.isFranchise && isCityPinned(prod.id, index)" class="pin-corner">
                  <el-icon style="vertical-align: -1px"><Top /></el-icon>
                  <span>置顶</span>
                </div>
                <div class="grid-product-img">{{ prod.icon }}</div>
                <div class="grid-product-info">
                  <div class="grid-product-title">{{ prod.name }}</div>
                  <div class="grid-product-cat">{{ prod.fullCategoryName }}</div>
                  <div class="grid-product-bottom">
                    <div class="grid-product-price">
                      <span class="gp-symbol">¥</span>
                      <span class="gp-value">{{ Number(prod.price).toFixed(2) }}</span>
                      <span v-if="prod.originalPrice && Number(prod.originalPrice) > Number(prod.price)" class="gp-origin">
                        ¥{{ Number(prod.originalPrice).toFixed(2) }}
                      </span>
                    </div>
                  </div>
                  <div class="grid-product-tags">
                    <el-tag
                      v-for="tag in (prod.tags || []).slice(0, 2)"
                      :key="tag"
                      size="small"
                      type="warning"
                      effect="light"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                  <div class="grid-product-sales">已售{{ formatSales(prod.salesCount) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Iphone, Monitor, Search, LocationFilled, ArrowDown, Top } from '@element-plus/icons-vue'
import { getRecommends } from '@/api/recommend'
import { getCategoryTree } from '@/api/category'
import { getProducts } from '@/api/product'
import { getCities, getCityProducts } from '@/api/cityProduct'

const previewMode = ref('mobile')
const recommends = ref([])
const categoryTree = ref([])
const defaultProducts = ref([])
const cities = ref([])
const cityConfigs = ref([])
const selectedCityId = ref('')

const activeRecommends = computed(() => {
  return recommends.value.filter((r) => r.status === 1)
})

const activeCategories = computed(() => {
  return categoryTree.value.filter((c) => c.status === 1)
})

const selectedCity = computed(() => {
  return cities.value.find((c) => c.id === selectedCityId.value) || null
})

const displayProducts = computed(() => {
  return defaultProducts.value
})

const pinnedProductIds = computed(() => {
  if (!selectedCity.value || selectedCity.value.isFranchise) return []
  const cfg = cityConfigs.value.find((c) => c.cityId === selectedCityId.value)
  return cfg ? cfg.customProducts.map((p) => p.productId) : []
})

function isCityPinned(productId, index) {
  return pinnedProductIds.value.includes(productId)
}

function formatSales(num) {
  const n = Number(num) || 0
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n
}

async function loadRecommends() {
  recommends.value = await getRecommends()
}

async function loadCategories() {
  categoryTree.value = await getCategoryTree()
}

async function loadDefaultProducts() {
  const params = { status: 1, isDefault: 1 }
  const allDefaults = await getProducts(params)
  if (selectedCityId.value) {
    const city = cities.value.find((c) => c.id === selectedCityId.value)
    if (city && !city.isFranchise) {
      const cfg = cityConfigs.value.find((c) => c.cityId === selectedCityId.value)
      if (cfg && cfg.customProducts.length > 0) {
        const pinnedMap = new Map()
        cfg.customProducts.forEach((cp) => pinnedMap.set(cp.productId, cp))
        const pinned = []
        cfg.customProducts.forEach((cp) => {
          const p = allDefaults.find((x) => x.id === cp.productId)
          if (p) pinned.push(p)
        })
        const others = allDefaults.filter((p) => !pinnedMap.has(p.id))
        defaultProducts.value = [...pinned, ...others]
        return
      }
    }
  }
  defaultProducts.value = allDefaults
}

async function loadCities() {
  const allCities = await getCities()
  const nonFranchiseCities = allCities.filter((c) => !c.isFranchise)
  const franchiseCities = allCities.filter((c) => c.isFranchise)
  cities.value = [...franchiseCities, ...nonFranchiseCities]

  const allCityProducts = await getCityProducts()
  const groupedMap = new Map()
  allCityProducts.forEach((cp) => {
    if (!groupedMap.has(cp.cityId)) groupedMap.set(cp.cityId, [])
    groupedMap.get(cp.cityId).push(cp)
  })
  cityConfigs.value = nonFranchiseCities.map((city) => {
    const cps = (groupedMap.get(city.id) || [])
      .filter((cp) => Number(cp.status) === 1)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((cp) => ({
        id: cp.id,
        productId: cp.productId,
        productName: cp.productName,
        productIcon: cp.productIcon,
        productPrice: cp.productPrice,
        sort: cp.sort
      }))
    return { cityId: city.id, customProducts: cps }
  })
  if (cities.value.length > 0 && !selectedCityId.value) {
    selectedCityId.value = cities.value[0].id
  }
}

watch(selectedCityId, () => {
  loadDefaultProducts()
})

onMounted(async () => {
  await Promise.all([
    loadRecommends(),
    loadCategories(),
    loadCities()
  ])
  loadDefaultProducts()
})
</script>

<style scoped>
.home-preview {
  min-height: 100%;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.city-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.city-selector .label {
  font-size: 14px;
  color: #606266;
}

.preview-container {
  display: flex;
  justify-content: center;
  padding: 10px 0 40px;
}

.phone-frame {
  width: 375px;
  height: 780px;
  background: #000;
  border-radius: 40px;
  padding: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.phone-notch {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 28px;
  background: #000;
  border-radius: 20px;
  z-index: 10;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  border-radius: 30px;
  overflow: hidden;
}

.app-home {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 20px;
}

.app-header {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  padding: 50px 16px 16px;
}

.city-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 13px;
  margin-bottom: 10px;
  opacity: 0.95;
}

.arrow-down {
  font-size: 12px;
}

.search-bar {
  background: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.banner-area {
  padding: 16px;
}

.banner {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}

.banner-text .banner-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
}

.banner-text .banner-desc {
  font-size: 13px;
  opacity: 0.9;
}

.banner-icon {
  font-size: 48px;
}

.recommend-section,
.category-section,
.products-section {
  background: #fff;
  margin: 0 16px 12px;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f1f1f;
}

.section-subtitle {
  font-size: 12px;
  color: #909399;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.rec-item {
  background: var(--rec-bg, #f0f7ff);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  transition: transform 0.2s;
}

.rec-item:active {
  transform: scale(0.96);
}

.rec-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.rec-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.rec-subtitle {
  font-size: 11px;
  color: var(--rec-color, #1890ff);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 8px;
}

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.cat-icon {
  width: 48px;
  height: 48px;
  background: #f5f5f5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.cat-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-card {
  position: relative;
  background: #fafafa;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.product-card.pin-top {
  background: #fffbf0;
  border-color: #e6a23c;
}

.product-card:active {
  transform: scale(0.98);
}

.pin-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
}

.product-img {
  font-size: 44px;
  width: 72px;
  height: 72px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-detail {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.product-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.price-symbol {
  color: #f56c6c;
  font-size: 12px;
  font-weight: 600;
}

.price-value {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}

.price-origin {
  color: #c0c4cc;
  font-size: 12px;
  text-decoration: line-through;
  margin-left: 4px;
}

.product-sales {
  font-size: 11px;
  color: #909399;
}

.product-tags {
  display: flex;
  gap: 4px;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.desktop-preview {
  width: 100%;
  max-width: 1000px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.desktop-header {
  display: flex;
  align-items: center;
  padding: 0 32px;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  gap: 32px;
}

.desktop-logo {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b6b;
}

.desktop-city {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
  padding: 4px 12px;
  background: #f5f7fa;
  border-radius: 16px;
}

.desktop-search {
  flex: 1;
  max-width: 400px;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
}

.desktop-nav {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #666;
}

.desktop-nav span {
  cursor: pointer;
}

.desktop-main {
  padding: 24px 32px 40px;
  background: #f5f5f5;
}

.desktop-banner {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  margin-bottom: 24px;
}

.banner-title-lg {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.banner-desc-lg {
  font-size: 16px;
  opacity: 0.9;
}

.banner-icon-lg {
  font-size: 80px;
}

.desktop-recommend,
.desktop-categories,
.desktop-products {
  margin-bottom: 24px;
}

.products-header-lg {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title-lg {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f1f1f;
}

.section-subtitle-lg {
  font-size: 13px;
  color: #909399;
}

.rec-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.rec-card {
  background: var(--rec-bg, #f0f7ff);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.rec-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.rec-icon-lg {
  font-size: 40px;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-title-lg {
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.rec-subtitle-lg {
  font-size: 12px;
  color: var(--rec-color, #1890ff);
}

.cat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.cat-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.cat-card:hover {
  border-color: #ff6b6b;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.1);
}

.cat-icon-lg {
  font-size: 40px;
  margin-bottom: 12px;
}

.cat-name-lg {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.cat-count {
  font-size: 12px;
  color: #999;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.product-grid-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
  cursor: pointer;
}

.product-grid-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.product-grid-card.pin-card {
  border-color: #e6a23c;
  background: linear-gradient(180deg, #fffbf0 0%, #ffffff 30%);
}

.pin-corner {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: #fff;
  font-size: 11px;
  padding: 4px 10px;
  border-bottom-left-radius: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  z-index: 2;
  font-weight: 600;
}

.grid-product-img {
  font-size: 64px;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fafafa, #f0f0f0);
}

.grid-product-info {
  padding: 14px;
}

.grid-product-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-product-cat {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.grid-product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.grid-product-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.gp-symbol {
  color: #f56c6c;
  font-size: 12px;
  font-weight: 600;
}

.gp-value {
  color: #f56c6c;
  font-size: 20px;
  font-weight: 700;
}

.gp-origin {
  color: #c0c4cc;
  font-size: 12px;
  text-decoration: line-through;
  margin-left: 4px;
}

.grid-product-tags {
  display: flex;
  gap: 4px;
}

.grid-product-sales {
  font-size: 12px;
  color: #909399;
}
</style>
