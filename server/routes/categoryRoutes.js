const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'categories.json'

function ok(res, data, message = 'ok') {
  res.json({ code: 0, message, data })
}

function fail(res, message, code = 400) {
  res.status(code).json({ code, message, data: null })
}

function load() {
  return readJson(FILE)
}

function save(list) {
  return writeJson(FILE, list)
}

function buildTree(list) {
  const sorted = [...list].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  const activeList = sorted.filter((c) => Number(c.status) === 1)
  const level1 = activeList.filter((c) => c.level === 1 || (!c.parentId))
  return level1.map((parent) => {
    const children = activeList.filter((c) => c.parentId === parent.id)
    return { ...parent, children }
  })
}

router.get('/', (req, res) => {
  const { keyword, status, level, parentId } = req.query
  let list = load()
  if (keyword) {
    const kw = String(keyword).trim()
    list = list.filter((c) => c.name.includes(kw))
  }
  if (status !== undefined && status !== '') {
    list = list.filter((c) => Number(c.status) === Number(status))
  }
  if (level !== undefined && level !== '') {
    list = list.filter((c) => Number(c.level) === Number(level))
  }
  if (parentId !== undefined && parentId !== '') {
    if (parentId === 'null' || parentId === null) {
      list = list.filter((c) => !c.parentId)
    } else {
      list = list.filter((c) => c.parentId === parentId)
    }
  }
  list = [...list].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  ok(res, list)
})

router.get('/tree', (req, res) => {
  const list = load()
  ok(res, buildTree(list))
})

router.get('/:id', (req, res) => {
  const list = load()
  const item = list.find((c) => c.id === req.params.id)
  if (!item) return fail(res, '分类不存在', 404)
  ok(res, item)
})

router.post('/', (req, res) => {
  const { name, parentId, icon, description, status } = req.body || {}
  if (!name || !String(name).trim()) {
    return fail(res, '分类名称不能为空')
  }
  const list = load()
  const isLevel1 = parentId === null || parentId === undefined || parentId === 'null'
  const lvl = isLevel1 ? 1 : 2
  if (!isLevel1) {
    if (!parentId) return fail(res, '二级分类必须指定一级分类')
    const parent = list.find((c) => c.id === parentId)
    if (!parent) return fail(res, '所选一级分类不存在')
    if (parent.level !== 1 && parent.level !== undefined) {
      return fail(res, '只能挂在一级分类下')
    }
  }
  const now = new Date().toISOString()
  const siblings = list.filter((c) => (isLevel1 ? !c.parentId : c.parentId === parentId))
  const maxSort = siblings.reduce((m, c) => Math.max(m, c.sort || 0), -1)
  const item = {
    id: genId('cat'),
    name: String(name).trim(),
    parentId: isLevel1 ? null : parentId,
    level: lvl,
    icon: icon || '',
    description: description || '',
    sort: maxSort + 1,
    status: status === 0 ? 0 : 1,
    createdAt: now,
    updatedAt: now
  }
  list.push(item)
  save(list)
  ok(res, item, '创建成功')
})

router.put('/:id', (req, res) => {
  const { name, icon, description, status, sort } = req.body || {}
  const list = load()
  const idx = list.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return fail(res, '分类不存在', 404)
  if (name !== undefined && !String(name).trim()) {
    return fail(res, '分类名称不能为空')
  }
  const item = list[idx]
  if (name !== undefined) item.name = String(name).trim()
  if (icon !== undefined) item.icon = icon || ''
  if (description !== undefined) item.description = description || ''
  if (status !== undefined) item.status = Number(status) === 0 ? 0 : 1
  if (sort !== undefined) item.sort = Number(sort) || 0
  item.updatedAt = new Date().toISOString()
  list[idx] = item
  save(list)
  ok(res, item, '更新成功')
})

router.delete('/:id', (req, res) => {
  const list = load()
  const idx = list.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return fail(res, '分类不存在', 404)
  const target = list[idx]
  if (target.level === 1 || !target.parentId) {
    const hasChildren = list.some((c) => c.parentId === target.id)
    if (hasChildren) {
      return fail(res, '该一级分类下存在二级分类，请先删除二级分类')
    }
  }
  list.splice(idx, 1)
  save(list)
  ok(res, { id: target.id }, '删除成功')
})

router.post('/sort', (req, res) => {
  const { items, parentId } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, '排序数据不能为空')
  }
  const list = load()
  items.forEach((it) => {
    const idx = list.findIndex((c) => c.id === it.id)
    if (idx !== -1) {
      if (it.sort !== undefined) list[idx].sort = Number(it.sort) || 0
      if (it.parentId !== undefined) {
        list[idx].parentId = it.parentId === null ? null : it.parentId
        list[idx].level = it.parentId === null ? 1 : 2
      }
      list[idx].updatedAt = new Date().toISOString()
    }
  })
  save(list)
  ok(res, { count: items.length }, '排序成功')
})

module.exports = router
