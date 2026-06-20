<template>
  <el-container class="app-layout">
    <el-aside width="220px" class="app-aside">
      <div class="app-logo">
        <span class="logo-icon">🗂️</span>
        <span class="logo-text">总后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :router="true"
        class="app-menu"
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/home-preview">
          <el-icon><HomeFilled /></el-icon>
          <span>首页预览</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Files /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/recommends">
          <el-icon><Star /></el-icon>
          <span>推荐入口管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <span class="header-title">{{ currentTitle }}</span>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Files, Star } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '总后台')
</script>

<style scoped>
.app-layout {
  height: 100%;
}

.app-aside {
  background-color: #1f2d3d;
  overflow-x: hidden;
}

.app-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #2c3e50;
}

.logo-icon {
  font-size: 22px;
}

.app-menu {
  border-right: none;
}

.app-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  height: 60px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.app-main {
  background-color: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}
</style>
