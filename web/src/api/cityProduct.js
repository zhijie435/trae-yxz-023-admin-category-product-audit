import request from '@/utils/request'

export const getCities = (params) => {
  return request({ url: '/city-products/cities', method: 'get', params })
}

export const getCityProducts = (params) => {
  return request({ url: '/city-products', method: 'get', params })
}

export const getCityProductsByCity = (cityId) => {
  return request({ url: `/city-products/city/${cityId}`, method: 'get' })
}

export const getNonFranchiseConfigs = () => {
  return request({ url: '/city-products/non-franchise-configs', method: 'get' })
}

export const getCityProduct = (id) => {
  return request({ url: `/city-products/${id}`, method: 'get' })
}

export const getCityProductPool = (cityId) => {
  return request({ url: `/city-products/pool/${cityId}`, method: 'get' })
}

export const saveCityPoolSort = (cityId, items) => {
  return request({
    url: `/city-products/pool/${cityId}/sort`,
    method: 'post',
    data: { items }
  })
}

export const removePoolProduct = (cityId, productId) => {
  return request({
    url: `/city-products/pool/${cityId}/remove-product`,
    method: 'post',
    data: { productId }
  })
}

export const createCityProduct = (data) => {
  return request({ url: '/city-products', method: 'post', data })
}

export const updateCityProduct = (id, data) => {
  return request({ url: `/city-products/${id}`, method: 'put', data })
}

export const deleteCityProduct = (id) => {
  return request({ url: `/city-products/${id}`, method: 'delete' })
}

export const batchCityProducts = (cityId, productIds) => {
  return request({ url: '/city-products/batch-add', method: 'post', data: { cityId, productIds } })
}

export const batchAddCityProducts = (data) => {
  return request({ url: '/city-products/batch-add', method: 'post', data })
}

export const resetDefaultCityProducts = (cityId) => {
  return request({ url: `/city-products/reset-default/${cityId}`, method: 'post' })
}

export const sortCityProducts = (data) => {
  return request({ url: '/city-products/sort', method: 'post', data })
}
