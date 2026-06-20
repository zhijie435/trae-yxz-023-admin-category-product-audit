import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/categories'
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('@/views/CategoryAdmin.vue'),
    meta: { title: '分类管理', icon: 'Menu' }
  },
  {
    path: '/recommends',
    name: 'Recommends',
    component: () => import('@/views/RecommendAdmin.vue'),
    meta: { title: '推荐入口', icon: 'Star' }
  },
  {
    path: '/home-preview',
    name: 'HomePreview',
    component: () => import('@/views/HomePreview.vue'),
    meta: { title: '首页预览', icon: 'HomeFilled' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 分类管理后台` : '分类管理后台'
  next()
})

export default router
