import request from '@/utils/request'

export const getProducts = (params) => {
  return request({
    url: '/products',
    method: 'get',
    params
  })
}

export const getDefaultProducts = (params) => {
  return request({
    url: '/products/defaults',
    method: 'get',
    params
  })
}

export const getProduct = (id) => {
  return request({
    url: `/products/${id}`,
    method: 'get'
  })
}

export const createProduct = (data) => {
  return request({
    url: '/products',
    method: 'post',
    data
  })
}

export const updateProduct = (id, data) => {
  return request({
    url: `/products/${id}`,
    method: 'put',
    data
  })
}

export const deleteProduct = (id) => {
  return request({
    url: `/products/${id}`,
    method: 'delete'
  })
}

export const sortProducts = (data) => {
  return request({
    url: '/products/sort',
    method: 'post',
    data
  })
}

export const batchToggleDefault = (data) => {
  return request({
    url: '/products/batch-toggle-default',
    method: 'post',
    data
  })
}
