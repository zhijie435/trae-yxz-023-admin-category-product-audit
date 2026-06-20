import request from '@/utils/request'

export const getStoreProductReviews = (params) => {
  return request({
    url: '/store-products',
    method: 'get',
    params
  })
}

export const getStoreProductReviewStats = () => {
  return request({
    url: '/store-products/stats',
    method: 'get'
  })
}

export const getStoreProductReview = (id) => {
  return request({
    url: `/store-products/${id}`,
    method: 'get'
  })
}

export const createStoreProductReview = (data) => {
  return request({
    url: '/store-products',
    method: 'post',
    data
  })
}

export const approveStoreProductReview = (id, data) => {
  return request({
    url: `/store-products/${id}/approve`,
    method: 'post',
    data
  })
}

export const rejectStoreProductReview = (id, data) => {
  return request({
    url: `/store-products/${id}/reject`,
    method: 'post',
    data
  })
}

export const deleteStoreProductReview = (id) => {
  return request({
    url: `/store-products/${id}`,
    method: 'delete'
  })
}
