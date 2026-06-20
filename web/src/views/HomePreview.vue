<template>
  <div class="home-preview">
    <div class="page-card">
      <div class="page-header">
        <div class="page-title">首页预览</div>
        <div class="preview-switch">
          <el-radio-group v-model="previewMode" size="default">
            <el-radio-button value="mobile">
              <el-icon><Iphone /></el-icon>
              <span>移动端</span>
            </el-radio-button>
            <el-radio-button value="desktop">
              <el-icon><Monitor /></el-icon>
              <span>桌面端</span>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="preview-container" :class="previewMode">
        <div class="preview-frame">
          <div class="phone-frame" v-if="previewMode === 'mobile'">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <div class="app-home">
                <div class="app-header">
                  <div class="search-bar">
                    <el-icon><Search /></el-icon>
                    <span>搜索商品</span>
                  </div>
                </div>

                <div class="banner-area">
                  <div class="banner">
                    <div class="banner-text">
                      <div class="banner-title">限时特惠</div>
                      <div class="banner-desc">精选好物 低至5折</div>
                    </div>
                    <div class="banner-icon">🛍️</div>
                  </div>
                </div>

                <div class="recommend-section">
                  <div class="section-title">热门推荐</div>
                  <div class="recommend-grid">
                    <div
                      v-for="item in activeRecommends"
                      :key="item.id"
                      class="rec-item"
                      :style="{ '--rec-color': item.color, '--rec-bg': item.bgColor }"
                    >
                      <div class="rec-icon">{{ item.icon }}</div>
                      <div class="rec-title">{{ item.title }}</div>
                      <div class="rec-subtitle">{{ item.subtitle }}</div>
                    </div>
                  </div>
                </div>

                <div class="category-section">
                  <div class="section-title">全部分类</div>
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
              </div>
            </div>
          </div>

          <div class="desktop-preview" v-else>
            <div class="desktop-header">
              <div class="desktop-logo">🛒 商城</div>
              <div class="desktop-search">
                <el-icon><Search /></el-icon>
                <span>搜索商品</span>
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
                <div class="banner-text">
                  <div class="banner-title-lg">限时特惠</div>
                  <div class="banner-desc-lg">精选好物 低至5折起</div>
                </div>
                <div class="banner-icon-lg">🛍️</div>
              </div>

              <div class="desktop-recommend">
                <div class="section-title-lg">热门推荐</div>
                <div class="rec-row">
                  <div
                    v-for="item in activeRecommends"
                    :key="item.id"
                    class="rec-card"
                    :style="{ '--rec-color': item.color, '--rec-bg': item.bgColor }"
                  >
                    <div class="rec-icon-lg">{{ item.icon }}</div>
                    <div class="rec-info">
                      <div class="rec-title-lg">{{ item.title }}</div>
                      <div class="rec-subtitle-lg">{{ item.subtitle }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="desktop-categories">
                <div class="section-title-lg">全部分类</div>
                <div class="cat-row">
                  <div
                    v-for="cat in activeCategories"
                    :key="cat.id"
                    class="cat-card"
                  >
                    <div class="cat-icon-lg">{{ cat.icon }}</div>
                    <div class="cat-name-lg">{{ cat.name }}</div>
                    <div class="cat-count">{{ cat.children?.length || 0 }} 个子分类</div>
                  </div>
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
import { ref, computed, onMounted } from 'vue'
import { Iphone, Monitor, Search } from '@element-plus/icons-vue'
import { getRecommends } from '@/api/recommend'
import { getCategoryTree } from '@/api/category'

const previewMode = ref('mobile')
const recommends = ref([])
const categoryTree = ref([])

const activeRecommends = computed(() => {
  return recommends.value.filter(r => r.status === 1)
})

const activeCategories = computed(() => {
  return categoryTree.value.filter(c => c.status === 1)
})

async function loadRecommends() {
  const data = await getRecommends()
  recommends.value = data
}

async function loadCategories() {
  const data = await getCategoryTree()
  categoryTree.value = data
}

onMounted(() => {
  loadRecommends()
  loadCategories()
})
</script>

<style scoped>
.home-preview {
  height: 100%;
}

.preview-switch {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.phone-frame {
  width: 375px;
  height: 720px;
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
}

.app-header {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  padding: 50px 16px 20px;
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
.category-section {
  background: #fff;
  margin: 0 16px 12px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f1f1f;
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

.desktop-preview {
  width: 100%;
  max-width: 900px;
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
  gap: 40px;
}

.desktop-logo {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b6b;
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
.desktop-categories {
  margin-bottom: 24px;
}

.section-title-lg {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f1f1f;
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
</style>
