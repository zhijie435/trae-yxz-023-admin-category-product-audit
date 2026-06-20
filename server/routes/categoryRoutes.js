const express = require('express')
const categoryService = require('../services/categoryService')
const { ok, fail, notFound, wrapAsync } = require('../utils/response')

const router = express.Router()

router.get(
  '/',
  wrapAsync((req, res) => {
    const { keyword, status, level, parentId } = req.query
    const list = categoryService.findAll({ keyword, status, level, parentId })
    ok(res, list)
  })
)

router.get(
  '/tree',
  wrapAsync((req, res) => {
    const { onlyActive, maxLevel } = req.query
    const options = {}
    if (onlyActive !== undefined) options.onlyActive = onlyActive !== 'false' && onlyActive !== '0'
    if (maxLevel) options.maxLevel = Number(maxLevel)
    const tree = categoryService.getTree(options)
    ok(res, tree)
  })
)

router.get(
  '/:id',
  wrapAsync((req, res) => {
    const item = categoryService.findById(req.params.id)
    if (!item) return notFound(res, '分类不存在')
    ok(res, item)
  })
)

router.get(
  '/:id/children',
  wrapAsync((req, res) => {
    const { id } = req.params
    const children = categoryService.getChildren(id === 'root' ? null : id)
    ok(res, children)
  })
)

router.get(
  '/:id/path',
  wrapAsync((req, res) => {
    const item = categoryService.findById(req.params.id)
    if (!item) return notFound(res, '分类不存在')
    const path = categoryService.getPath(req.params.id)
    ok(res, path)
  })
)

router.post(
  '/',
  wrapAsync((req, res) => {
    try {
      const item = categoryService.create(req.body || {})
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
      const item = categoryService.update(req.params.id, req.body || {})
      if (!item) return notFound(res, '分类不存在')
      ok(res, item, '更新成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.delete(
  '/:id',
  wrapAsync((req, res) => {
    try {
      const removed = categoryService.remove(req.params.id)
      if (!removed) return notFound(res, '分类不存在')
      ok(res, { id: removed.id }, '删除成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/sort',
  wrapAsync((req, res) => {
    const { items, parentId } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, '排序数据不能为空')
    }
    const result = categoryService.sort(items)
    if (parentId !== undefined) {
      items.forEach((it) => {
        if (it.id) {
          try {
            categoryService.move(it.id, parentId === null ? null : parentId)
          } catch (e) {}
        }
      })
    }
    ok(res, { count: result.count }, '排序成功')
  })
)

router.post(
  '/:id/move',
  wrapAsync((req, res) => {
    try {
      const { parentId } = req.body || {}
      const item = categoryService.move(req.params.id, parentId)
      if (!item) return notFound(res, '分类不存在')
      ok(res, item, '移动成功')
    } catch (e) {
      fail(res, e.message)
    }
  })
)

router.post(
  '/batch-toggle-status',
  wrapAsync((req, res) => {
    const { ids, status } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(res, '请选择要操作的分类')
    }
    const target = Number(status) === 0 ? 0 : 1
    const result = categoryService.batchUpdate(ids, { status: target })
    ok(res, { count: result.count, status: target }, '批量操作成功')
  })
)

module.exports = router
