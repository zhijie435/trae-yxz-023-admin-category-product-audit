const express = require('express')
const productService = require('../services/productService')
const { ok, fail, notFound, wrapAsync } = require('../utils/response')

const router = express.Router()

router.get(
  '/',
  wrapAsync((req, res) => {
    const { keyword, categoryId, status, isDefault, parentCategoryId } = req.query
    const list = productService.withCategoryInfoList(
      productService.findAll({ keyword, categoryId, status, isDefault, parentCategoryId })
    )
    ok(res, list)
  })
)

router.get(
  '/defaults',
  wrapAsync((req, res) => {
    const { cityId } = req.query
    const products = productService.getDefaults(cityId || null)
    ok(res, products)
  })
)

router.get(
  '/:id',
  wrapAsync((req, res) => {
    const item = productService.findById(req.params.id)
    if (!item) return notFound(res, '商品不存在')
    ok(res, item)
  })
)

router.post(
  '/',
  wrapAsync((req, res) => {
    try {
      const item = productService.create(req.body || {})
      ok(res, item, '创建成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.put(
  '/:id',
  wrapAsync((req, res) => {
    try {
      const item = productService.update(req.params.id, req.body || {})
      if (!item) return notFound(res, '商品不存在')
      ok(res, item, '更新成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.delete(
  '/:id',
  wrapAsync((req, res) => {
    const removed = productService.remove(req.params.id)
    if (!removed) return notFound(res, '商品不存在')
    ok(res, { id: removed.id }, '删除成功')
  })
)

router.post(
  '/sort',
  wrapAsync((req, res) => {
    const { items } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, '排序数据不能为空')
    }
    const result = productService.sort(items)
    ok(res, { count: result.count }, '排序成功')
  })
)

router.post(
  '/batch-toggle-default',
  wrapAsync((req, res) => {
    const { ids, isDefault } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(res, '请选择要操作的商品')
    }
    const result = productService.batchToggleDefault(ids, isDefault)
    ok(res, { count: result.count }, '批量操作成功')
  })
)

router.post(
  '/batch-toggle-status',
  wrapAsync((req, res) => {
    const { ids, status } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(res, '请选择要操作的商品')
    }
    const target = Number(status) === 0 ? 0 : 1
    const result = productService.batchToggleStatus(ids, status)
    ok(
      res,
      { count: result.count, status: target },
      target === 1 ? '批量上架成功' : '批量下架成功'
    )
  })
)

router.post(
  '/:id/toggle-status',
  wrapAsync((req, res) => {
    try {
      const { status } = req.body || {}
      const item = productService.toggleStatus(req.params.id, status)
      if (!item) return notFound(res, '商品不存在')
      ok(res, item, item.status === 1 ? '上架成功' : '下架成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/batch-delete',
  wrapAsync((req, res) => {
    const { ids } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(res, '请选择要删除的商品')
    }
    const result = productService.batchRemove(ids)
    ok(res, { count: result.count }, '批量删除成功')
  })
)

module.exports = router
