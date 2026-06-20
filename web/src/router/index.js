import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home-preview'
  },
  {
    path: '/home-preview',
    name: 'HomePreview',
    component: () => import('@/views/HomePreview.vue'),
    meta: { title: '首页预览', icon: 'HomeFilled' }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/ProductAdmin.vue'),
    meta: { title: '官方商品库', icon: 'Goods' }
  },
  {
    path: '/store-product-review',
    name: 'StoreProductReview',
    component: () => import('@/views/StoreProductReview.vue'),
    meta: { title: '门店商品审核', icon: 'Checked' }
  },
  {
    path: '/city-products',
    name: 'CityProducts',
    component: () => import('@/views/CityProductAdmin.vue'),
    meta: { title: '城市商品配置', icon: 'LocationFilled' }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('@/views/CategoryAdmin.vue'),
    meta: { title: '分类管理', icon: 'Files' }
  },
  {
    path: '/recommends',
    name: 'Recommends',
    component: () => import('@/views/RecommendAdmin.vue'),
    meta: { title: '推荐入口', icon: 'Star' }
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
