const express = require('express')
const reviewService = require('../services/reviewService')
const { ok, fail, notFound, wrapAsync } = require('../utils/response')

const router = express.Router()

router.get(
  '/',
  wrapAsync((req, res) => {
    const { keyword, cityId, reviewStatus } = req.query
    const list = reviewService.withExtraInfoList(
      reviewService.findAll({ keyword, cityId, reviewStatus })
    )
    ok(res, list)
  })
)

router.get(
  '/stats',
  wrapAsync((req, res) => {
    const stats = reviewService.getStats()
    ok(res, stats)
  })
)

router.get(
  '/:id',
  wrapAsync((req, res) => {
    const item = reviewService.findById(req.params.id)
    if (!item) return notFound(res, '审核记录不存在')
    ok(res, item)
  })
)

router.post(
  '/',
  wrapAsync((req, res) => {
    try {
      const item = reviewService.create(req.body || {})
      ok(res, item, '提交成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/:id/approve',
  wrapAsync((req, res) => {
    try {
      const { reviewRemark } = req.body || {}
      const item = reviewService.approve(req.params.id, reviewRemark)
      ok(res, item, '审核通过，商品已上架')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/:id/reject',
  wrapAsync((req, res) => {
    try {
      const { reviewRemark } = req.body || {}
      const item = reviewService.reject(req.params.id, reviewRemark)
      ok(res, item, '已驳回')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/:id/resubmit',
  wrapAsync((req, res) => {
    try {
      const item = reviewService.resubmit(req.params.id, req.body || {})
      ok(res, item, '已重新提交审核')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.delete(
  '/:id',
  wrapAsync((req, res) => {
    const removed = reviewService.remove(req.params.id)
    if (!removed) return notFound(res, '审核记录不存在')
    ok(res, { id: removed.id }, '删除成功')
  })
)

module.exports = router
