import request from '@/utils/request'

export const getCategories = (params) => {
  return request({
    url: '/categories',
    method: 'get',
    params
  })
}

export const getCategoryTree = () => {
  return request({
    url: '/categories/tree',
    method: 'get'
  })
}

export const getCategory = (id) => {
  return request({
    url: `/categories/${id}`,
    method: 'get'
  })
}

export const createCategory = (data) => {
  return request({
    url: '/categories',
    method: 'post',
    data
  })
}

export const updateCategory = (id, data) => {
  return request({
    url: `/categories/${id}`,
    method: 'put',
    data
  })
}

export const deleteCategory = (id) => {
  return request({
    url: `/categories/${id}`,
    method: 'delete'
  })
}

export const sortCategories = (data) => {
  return request({
    url: '/categories/sort',
    method: 'post',
    data
  })
}

export const moveCategory = (id, parentId) => {
  return request({
    url: `/categories/${id}/move`,
    method: 'post',
    data: { parentId }
  })
}

export const getCategoryPath = (id) => {
  return request({
    url: `/categories/${id}/path`,
    method: 'get'
  })
}

export const batchToggleCategoryStatus = (ids, status) => {
  return request({
    url: '/categories/batch-toggle-status',
    method: 'post',
    data: { ids, status }
  })
}
