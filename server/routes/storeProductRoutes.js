const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'storeProductReviews.json'
const PROD_FILE = 'products.json'
const CAT_FILE = 'categories.json'
const CITY_FILE = 'cities.json'

function ok(res, data, message = 'ok') {
  res.json({ code: 0, message, data })
}

function fail(res, message, code = 400) {
  res.status(code).json({ code, message, data: null })
}

function tryInit() {
  try {
    readJson(FILE)
  } catch (e) {
    writeJson(FILE, [])
  }
}

function load() {
  tryInit()
  return readJson(FILE)
}

function save(list) {
  writeJson(FILE, list)
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags : []
}

function withExtraInfo(list) {
  const cats = readJson(CAT_FILE)
  const cities = readJson(CITY_FILE)
  return list.map((it) => {
    const cat = cats.find((c) => c.id === it.categoryId)
    let categoryName = ''
    let parentCategoryName = ''
    let fullCategoryName = ''
    if (cat) {
      categoryName = cat.name
      if (cat.parentId) {
        const parent = cats.find((c) => c.id === cat.parentId)
        parentCategoryName = parent ? parent.name : ''
      }
      fullCategoryName = parentCategoryName
        ? `${parentCategoryName} / ${categoryName}`
        : categoryName
    }
    const city = cities.find((c) => c.id === it.cityId)
    const cityName = city ? city.name : ''
    const isFranchise = city ? (city.isFranchise === true || city.isFranchise === 1 || city.isFranchised === true) : false
    const tags = normalizeTags(it.tags)
    const price = Number(it.price) || 0
    const originalPrice = Number(it.originalPrice) || price
    return {
      ...it,
      tags,
      price,
      originalPrice,
      categoryName,
      parentCategoryName,
      fullCategoryName,
      cityName,
      isFranchise
    }
  })
}

router.get('/', (req, res) => {
  const { keyword, cityId, reviewStatus } = req.query
  let list = load()
  if (keyword) {
    const kw = String(keyword).trim()
    list = list.filter((it) =>
      (it.name && it.name.includes(kw)) ||
      (it.description && it.description.includes(kw))
    )
  }
  if (cityId) {
    list = list.filter((it) => it.cityId === cityId)
  }
  if (reviewStatus && reviewStatus !== '') {
    list = list.filter((it) => it.reviewStatus === reviewStatus)
  }
  list = [...list].sort((a, b) => (a.submittedAt || a.createdAt) < (b.submittedAt || b.createdAt) ? 1 : -1)
  ok(res, withExtraInfo(list))
})

router.get('/stats', (req, res) => {
  const list = load()
  const stats = {
    total: list.length,
    pending: list.filter((it) => it.reviewStatus === 'pending').length,
    approved: list.filter((it) => it.reviewStatus === 'approved').length,
    rejected: list.filter((it) => it.reviewStatus === 'rejected').length
  }
  ok(res, stats)
})

router.get('/:id', (req, res) => {
  const list = load()
  const item = list.find((it) => it.id === req.params.id)
  if (!item) return fail(res, '审核记录不存在', 404)
  ok(res, withExtraInfo([item])[0])
})

router.post('/', (req, res) => {
  const {
    cityId, name, categoryId, icon, description,
    price, originalPrice, tags
  } = req.body || {}
  if (!name || !String(name).trim()) {
    return fail(res, '商品名称不能为空')
  }
  if (!cityId) {
    return fail(res, '请选择提交城市')
  }
  if (!categoryId) {
    return fail(res, '请选择商品分类')
  }
  const cats = readJson(CAT_FILE)
  const cat = cats.find((c) => c.id === categoryId)
  if (!cat) return fail(res, '所选分类不存在')
  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return fail(res, '所选城市不存在')
  const list = load()
  const now = new Date().toISOString()
  const numPrice = Number(price) || 0
  const item = {
    id: genId('spr'),
    cityId: String(cityId),
    name: String(name).trim(),
    categoryId: String(categoryId),
    icon: icon || '📦',
    description: description || '',
    price: numPrice,
    originalPrice: originalPrice ? Number(originalPrice) : numPrice,
    tags: normalizeTags(tags),
    reviewStatus: 'pending',
    reviewRemark: '',
    submittedAt: now,
    reviewedAt: '',
    productId: '',
    createdAt: now,
    updatedAt: now
  }
  list.push(item)
  save(list)
  ok(res, withExtraInfo([item])[0], '提交成功')
})

router.post('/:id/approve', (req, res) => {
  const { reviewRemark } = req.body || {}
  const list = load()
  const idx = list.findIndex((it) => it.id === req.params.id)
  if (idx === -1) return fail(res, '审核记录不存在', 404)
  const item = list[idx]
  if (item.reviewStatus === 'approved') {
    return fail(res, '该申请已通过审核，无需重复操作')
  }
  const now = new Date().toISOString()
  const products = readJson(PROD_FILE)
  const maxSort = products.reduce((m, p) => Math.max(m, p.sort || 0), -1)
  const newProduct = {
    id: genId('prod'),
    name: item.name,
    categoryId: item.categoryId,
    icon: item.icon || '📦',
    description: item.description || '',
    price: Number(item.price) || 0,
    originalPrice: Number(item.originalPrice) || Number(item.price) || 0,
    salesCount: 0,
    sort: maxSort + 1,
    status: 1,
    isDefault: true,
    tags: normalizeTags(item.tags),
    createdAt: now,
    updatedAt: now
  }
  products.push(newProduct)
  writeJson(PROD_FILE, products)
  item.reviewStatus = 'approved'
  item.reviewRemark = reviewRemark || ''
  item.reviewedAt = now
  item.productId = newProduct.id
  item.updatedAt = now
  list[idx] = item
  save(list)
  ok(res, withExtraInfo([item])[0], '审核通过，商品已上架')
})

router.post('/:id/reject', (req, res) => {
  const { reviewRemark } = req.body || {}
  if (!reviewRemark || !String(reviewRemark).trim()) {
    return fail(res, '驳回原因不能为空')
  }
  const list = load()
  const idx = list.findIndex((it) => it.id === req.params.id)
  if (idx === -1) return fail(res, '审核记录不存在', 404)
  const item = list[idx]
  if (item.reviewStatus === 'rejected') {
    return fail(res, '该申请已被驳回，无需重复操作')
  }
  const now = new Date().toISOString()
  item.reviewStatus = 'rejected'
  item.reviewRemark = String(reviewRemark).trim()
  item.reviewedAt = now
  item.productId = ''
  item.updatedAt = now
  list[idx] = item
  save(list)
  ok(res, withExtraInfo([item])[0], '已驳回')
})

router.delete('/:id', (req, res) => {
  const list = load()
  const idx = list.findIndex((it) => it.id === req.params.id)
  if (idx === -1) return fail(res, '审核记录不存在', 404)
  const target = list[idx]
  list.splice(idx, 1)
  save(list)
  ok(res, { id: target.id }, '删除成功')
})

module.exports = router
