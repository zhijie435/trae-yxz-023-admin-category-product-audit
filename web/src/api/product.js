import request from '@/utils/request'

export const getProducts = (params) => {
  return request({ url: '/products', method: 'get', params })
}

export const getProduct = (id) => {
  return request({ url: `/products/${id}`, method: 'get' })
}

export const createProduct = (data) => {
  return request({ url: '/products', method: 'post', data })
}

export const updateProduct = (id, data) => {
  return request({ url: `/products/${id}`, method: 'put', data })
}

export const deleteProduct = (id) => {
  return request({ url: `/products/${id}`, method: 'delete' })
}

export const sortProducts = (items) => {
  return request({ url: '/products/sort', method: 'post', data: { items } })
}

export const batchToggleProductStatus = (ids, status) => {
  return request({ url: '/products/batch-toggle-status', method: 'post', data: { ids, status } })
}

export const batchToggleDefault = (ids, isDefault) => {
  return request({ url: '/products/batch-toggle-default', method: 'post', data: { ids, isDefault } })
}

export const toggleProductStatus = (id, status) => {
  return request({ url: `/products/${id}/toggle-status`, method: 'post', data: { status } })
}

export const getDefaultProducts = (cityId) => {
  return request({ url: '/products/defaults', method: 'get', params: { cityId } })
}
