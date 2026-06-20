import request from '@/utils/request'

export const getRecommends = () => {
  return request({
    url: '/recommends',
    method: 'get'
  })
}

export const getRecommend = (id) => {
  return request({
    url: `/recommends/${id}`,
    method: 'get'
  })
}

export const createRecommend = (data) => {
  return request({
    url: '/recommends',
    method: 'post',
    data
  })
}

export const updateRecommend = (id, data) => {
  return request({
    url: `/recommends/${id}`,
    method: 'put',
    data
  })
}

export const deleteRecommend = (id) => {
  return request({
    url: `/recommends/${id}`,
    method: 'delete'
  })
}

export const sortRecommends = (data) => {
  return request({
    url: '/recommends/sort',
    method: 'post',
    data
  })
}
