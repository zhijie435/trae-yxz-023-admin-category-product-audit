const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'recommends.json'
const CAT_FILE = 'categories.json'

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

function withCategoryName(list) {
  const cats = readJson(CAT_FILE)
  return list.map((r) => {
    const cat = cats.find((c) => c.id === r.categoryId)
    return { ...r, categoryName: cat ? cat.name : '' }
  })
}

router.get('/', (req, res) => {
  const list = [...load()].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  ok(res, withCategoryName(list))
})

router.get('/:id', (req, res) => {
  const list = load()
  const item = list.find((r) => r.id === req.params.id)
  if (!item) return fail(res, '推荐入口不存在', 404)
  ok(res, withCategoryName([item])[0])
})

router.post('/', (req, res) => {
  const { title, subtitle, icon, color, bgColor, categoryId, link, status } = req.body || {}
  if (!title || !String(title).trim()) {
    return fail(res, '推荐入口标题不能为空')
  }
  const cats = readJson(CAT_FILE)
  if (categoryId) {
    const cat = cats.find((c) => c.id === categoryId)
    if (!cat) return fail(res, '所选分类不存在')
  }
  const list = load()
  if (list.length >= 4) {
    return fail(res, '最多只能配置 4 个推荐入口')
  }
  const maxSort = list.reduce((m, r) => Math.max(m, r.sort || 0), -1)
  const item = {
    id: genId('rec'),
    title: String(title).trim(),
    subtitle: subtitle || '',
    icon: icon || '⭐',
    color: color || '#1890ff',
    bgColor: bgColor || '#e6f7ff',
    categoryId: categoryId || null,
    link: link || '',
    sort: maxSort + 1,
    status: status === 0 ? 0 : 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  list.push(item)
  save(list)
  ok(res, withCategoryName([item])[0], '创建成功')
})

router.put('/:id', (req, res) => {
  const { title, subtitle, icon, color, bgColor, categoryId, link, status, sort } = req.body || {}
  const list = load()
  const idx = list.findIndex((r) => r.id === req.params.id)
  if (idx === -1) return fail(res, '推荐入口不存在', 404)
  if (title !== undefined && !String(title).trim()) {
    return fail(res, '推荐入口标题不能为空')
  }
  if (categoryId) {
    const cats = readJson(CAT_FILE)
    const cat = cats.find((c) => c.id === categoryId)
    if (!cat) return fail(res, '所选分类不存在')
  }
  const item = list[idx]
  if (title !== undefined) item.title = String(title).trim()
  if (subtitle !== undefined) item.subtitle = subtitle || ''
  if (icon !== undefined) item.icon = icon || '⭐'
  if (color !== undefined) item.color = color || '#1890ff'
  if (bgColor !== undefined) item.bgColor = bgColor || '#e6f7ff'
  if (categoryId !== undefined) item.categoryId = categoryId || null
  if (link !== undefined) item.link = link || ''
  if (status !== undefined) item.status = Number(status) === 0 ? 0 : 1
  if (sort !== undefined) item.sort = Number(sort) || 0
  item.updatedAt = new Date().toISOString()
  list[idx] = item
  save(list)
  ok(res, withCategoryName([item])[0], '更新成功')
})

router.delete('/:id', (req, res) => {
  const list = load()
  const idx = list.findIndex((r) => r.id === req.params.id)
  if (idx === -1) return fail(res, '推荐入口不存在', 404)
  list.splice(idx, 1)
  save(list)
  ok(res, { id: req.params.id }, '删除成功')
})

router.post('/sort', (req, res) => {
  const { items } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, '排序数据不能为空')
  }
  const list = load()
  items.forEach((it) => {
    const idx = list.findIndex((r) => r.id === it.id)
    if (idx !== -1) {
      list[idx].sort = Number(it.sort) || 0
      list[idx].updatedAt = new Date().toISOString()
    }
  })
  save(list)
  ok(res, { count: items.length }, '排序成功')
})

module.exports = router
