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
