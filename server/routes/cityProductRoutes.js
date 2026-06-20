const express = require('express')
const cityProductService = require('../services/cityProductService')
const { ok, fail, notFound, wrapAsync } = require('../utils/response')

const router = express.Router()

router.get(
  '/',
  wrapAsync((req, res) => {
    const { cityId, productId, status } = req.query
    const list = cityProductService.withFullInfo(
      cityProductService.findAll({ cityId, productId, status })
    )
    ok(res, list)
  })
)

router.get(
  '/city/:cityId',
  wrapAsync((req, res) => {
    const { status } = req.query
    const list = cityProductService.withFullInfo(
      cityProductService.findByCity(req.params.cityId, status)
    )
    ok(res, list)
  })
)

router.get(
  '/non-franchise-configs',
  wrapAsync((req, res) => {
    const data = cityProductService.getNonFranchiseConfigs()
    ok(res, data)
  })
)

router.get(
  '/cities',
  wrapAsync((req, res) => {
    const { status, isFranchise } = req.query
    const cities = cityProductService.getCities({ status, isFranchise })
    ok(res, cities)
  })
)

router.get(
  '/pool/:cityId',
  wrapAsync((req, res) => {
    try {
      const data = cityProductService.getPool(req.params.cityId)
      ok(res, data)
    } catch (e) {
      fail(res, e.message, 404)
    }
  })
)

router.post(
  '/pool/:cityId/sort',
  wrapAsync((req, res) => {
    try {
      const { items } = req.body || {}
      if (!Array.isArray(items) || items.length === 0) {
        return fail(res, '排序数据不能为空')
      }
      const result = cityProductService.sortPool(req.params.cityId, items)
      ok(res, result, '商品池排序已保存')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/pool/:cityId/remove-product',
  wrapAsync((req, res) => {
    try {
      const { productId } = req.body || {}
      const result = cityProductService.removeFromPool(req.params.cityId, productId)
      ok(res, { productId, removed: result.removed }, result.message)
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.get(
  '/:id',
  wrapAsync((req, res) => {
    const item = cityProductService.findById(req.params.id)
    if (!item) return notFound(res, '配置不存在')
    ok(res, cityProductService.withFullInfo([item])[0])
  })
)

router.post(
  '/',
  wrapAsync((req, res) => {
    try {
      const item = cityProductService.create(req.body || {})
      ok(res, cityProductService.withFullInfo([item])[0], '配置成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.put(
  '/:id',
  wrapAsync((req, res) => {
    try {
      const item = cityProductService.update(req.params.id, req.body || {})
      if (!item) return notFound(res, '配置不存在')
      ok(res, cityProductService.withFullInfo([item])[0], '更新成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.delete(
  '/:id',
  wrapAsync((req, res) => {
    const removed = cityProductService.remove(req.params.id)
    if (!removed) return notFound(res, '配置不存在')
    ok(res, { id: req.params.id }, '删除成功')
  })
)

router.post(
  '/sort',
  wrapAsync((req, res) => {
    const { items } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, '排序数据不能为空')
    }
    const result = cityProductService.sort(items)
    ok(res, { count: result.count }, '排序成功')
  })
)

router.post(
  '/batch',
  wrapAsync((req, res) => {
    try {
      const { cityId, productIds } = req.body || {}
      const result = cityProductService.batchAdd(cityId, productIds)
      ok(res, result, '批量配置完成')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/reset-default/:cityId',
  wrapAsync((req, res) => {
    try {
      const result = cityProductService.resetToDefault(req.params.cityId)
      ok(res, result, '已重置为总部默认')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/batch-add',
  wrapAsync((req, res) => {
    try {
      const { cityId, productIds } = req.body || {}
      const result = cityProductService.batchAdd(cityId, productIds)
      ok(res, result, '批量配置完成')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

module.exports = router
