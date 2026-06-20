import request from '@/utils/request'

export const getCityProducts = (params) => {
  return request({
    url: '/city-products',
    method: 'get',
    params
  })
}

export const getCityProductsByCity = (cityId, params) => {
  return request({
    url: `/city-products/city/${cityId}`,
    method: 'get',
    params
  })
}

export const getNonFranchiseConfigs = () => {
  return request({
    url: '/city-products/non-franchise-configs',
    method: 'get'
  })
}

export const getCityProduct = (id) => {
  return request({
    url: `/city-products/${id}`,
    method: 'get'
  })
}

export const createCityProduct = (data) => {
  return request({
    url: '/city-products',
    method: 'post',
    data
  })
}

export const updateCityProduct = (id, data) => {
  return request({
    url: `/city-products/${id}`,
    method: 'put',
    data
  })
}

export const deleteCityProduct = (id) => {
  return request({
    url: `/city-products/${id}`,
    method: 'delete'
  })
}

export const sortCityProducts = (data) => {
  return request({
    url: '/city-products/sort',
    method: 'post',
    data
  })
}

export const batchAddCityProducts = (data) => {
  return request({
    url: '/city-products/batch-add',
    method: 'post',
    data
  })
}
