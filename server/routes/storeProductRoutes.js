const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'storeProductReviews.json'
const CITY_FILE = 'cities.json'
const CAT_FILE = 'categories.json'
const PROD_FILE = 'products.json'

const STATUS_LIST = ['pending', 'approved', 'rejected']

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

function isCityFranchised(city) {
  if (!city) return false
  const val = city.isFranchised !== undefined ? city.isFranchised : city.isFranchise
  return val === true || val === 1 || val === '1'
}

function normalizeSubmission(s) {
  const icon = s.icon || s.image || '📦'
  const tags = Array.isArray(s.tags) ? s.tags : []
  const price = Number(s.price)
  const originalPrice =
    s.originalPrice !== undefined && s.originalPrice !== null && s.originalPrice !== ''
      ? Number(s.originalPrice)
      : price
  const reviewStatus = STATUS_LIST.includes(s.reviewStatus) ? s.reviewStatus : 'pending'
  return { ...s, icon, tags, price, originalPrice, reviewStatus }
}

function buildCategoryInfo(cats, categoryId) {
  let categoryName = ''
  let parentCategoryName = ''
  const cat = cats.find((c) => c.id === categoryId)
  if (cat) {
    categoryName = cat.name
    if (cat.parentId) {
      const parent = cats.find((c) => c.id === cat.parentId)
      parentCategoryName = parent ? parent.name : ''
    }
  }
  return {
    categoryName,
    parentCategoryName,
    fullCategoryName: parentCategoryName ? `${parentCategoryName} / ${categoryName}` : categoryName
  }
}

function withFullInfo(list) {
  const cities = readJson(CITY_FILE)
  const cats = readJson(CAT_FILE)
  return list.map((s) => {
    const ns = normalizeSubmission(s)
    const city = cities.find((c) => c.id === ns.cityId)
    return {
      ...ns,
      cityName: city ? city.name : '',
      cityCode: city ? city.code : '',
      cityProvince: city ? city.province : '',
      isFranchise: isCityFranchised(city),
      ...buildCategoryInfo(cats, ns.categoryId)
    }
  })
}

router.get('/', (req, res) => {
  const { keyword, cityId, reviewStatus, categoryId } = req.query
  let list = load().map(normalizeSubmission)
  if (keyword) {
    const kw = String(keyword).trim()
    list = list.filter(
      (s) => s.name.includes(kw) || (s.description && s.description.includes(kw))
    )
  }
  if (cityId) {
    list = list.filter((s) => s.cityId === cityId)
  }
  if (reviewStatus && STATUS_LIST.includes(reviewStatus)) {
    list = list.filter((s) => s.reviewStatus === reviewStatus)
  }
  if (categoryId) {
    list = list.filter((s) => s.categoryId === categoryId)
  }
  list = [...list].sort(
    (a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
  )
  ok(res, withFullInfo(list))
})

router.get('/stats', (req, res) => {
  const list = load().map(normalizeSubmission)
  const stats = {
    total: list.length,
    pending: list.filter((s) => s.reviewStatus === 'pending').length,
    approved: list.filter((s) => s.reviewStatus === 'approved').length,
    rejected: list.filter((s) => s.reviewStatus === 'rejected').length
  }
  ok(res, stats)
})

router.get('/:id', (req, res) => {
  const list = load()
  const item = list.find((s) => s.id === req.params.id)
  if (!item) return fail(res, '审核记录不存在', 404)
  ok(res, withFullInfo([item])[0])
})

function validateSubmissionBody(body) {
  const { cityId, name, categoryId, price } = body || {}
  if (!cityId) return '请选择所属城市（城市合伙人）'
  if (!name || !String(name).trim()) return '商品名称不能为空'
  if (!categoryId) return '请选择商品分类'
  const numPrice = Number(price)
  if (isNaN(numPrice) || numPrice < 0) return '商品价格不正确'
  return ''
}

router.post('/', (req, res) => {
  const err = validateSubmissionBody(req.body)
  if (err) return fail(res, err)

  const { cityId, name, categoryId, icon, description, price, originalPrice, tags } = req.body || {}

  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return fail(res, '所选城市不存在')

  const cats = readJson(CAT_FILE)
  const cat = cats.find((c) => c.id === categoryId)
  if (!cat) return fail(res, '所选分类不存在')

  const numPrice = Number(price)
  const list = load()
  const now = new Date().toISOString()
  const item = {
    id: genId('spr'),
    cityId,
    name: String(name).trim(),
    categoryId,
    icon: icon || '📦',
    description: description || '',
    price: numPrice,
    originalPrice:
      originalPrice !== undefined && originalPrice !== null && originalPrice !== ''
        ? Number(originalPrice)
        : numPrice,
    tags: Array.isArray(tags) ? tags : [],
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
  ok(res, withFullInfo([item])[0], '提交成功，等待总部审核')
})

router.post('/:id/approve', (req, res) => {
  const { reviewRemark } = req.body || {}
  const list = load()
  const idx = list.findIndex((s) => s.id === req.params.id)
  if (idx === -1) return fail(res, '审核记录不存在', 404)
  const item = normalizeSubmission(list[idx])
  if (item.reviewStatus !== 'pending') {
    return fail(res, '该记录已审核，不可重复操作')
  }

  const products = readJson(PROD_FILE)
  const maxSort = products.reduce((m, p) => Math.max(m, p.sort || 0), -1)
  const now = new Date().toISOString()
  const product = {
    id: genId('prod'),
    name: item.name,
    categoryId: item.categoryId,
    icon: item.icon,
    description: item.description,
    price: item.price,
    originalPrice: item.originalPrice || item.price,
    salesCount: 0,
    sort: maxSort + 1,
    status: 1,
    isDefault: false,
    tags: item.tags || [],
    sourceCityId: item.cityId,
    sourceSubmissionId: item.id,
    createdAt: now,
    updatedAt: now
  }
  products.push(product)
  writeJson(PROD_FILE, products)

  item.reviewStatus = 'approved'
  item.reviewRemark = reviewRemark ? String(reviewRemark).trim() : ''
  item.reviewedAt = now
  item.productId = product.id
  item.updatedAt = now
  list[idx] = item
  save(list)

  ok(res, { submission: withFullInfo([item])[0], product }, '审核通过，商品已上架至商品库')
})

router.post('/:id/reject', (req, res) => {
  const { reviewRemark } = req.body || {}
  if (!reviewRemark || !String(reviewRemark).trim()) {
    return fail(res, '请填写驳回原因')
  }
  const list = load()
  const idx = list.findIndex((s) => s.id === req.params.id)
  if (idx === -1) return fail(res, '审核记录不存在', 404)
  const item = normalizeSubmission(list[idx])
  if (item.reviewStatus !== 'pending') {
    return fail(res, '该记录已审核，不可重复操作')
  }
  const now = new Date().toISOString()
  item.reviewStatus = 'rejected'
  item.reviewRemark = String(reviewRemark).trim()
  item.reviewedAt = now
  item.updatedAt = now
  list[idx] = item
  save(list)
  ok(res, withFullInfo([item])[0], '已驳回')
})

router.delete('/:id', (req, res) => {
  const list = load()
  const idx = list.findIndex((s) => s.id === req.params.id)
  if (idx === -1) return fail(res, '审核记录不存在', 404)
  const target = list[idx]
  list.splice(idx, 1)
  save(list)
  ok(res, { id: target.id }, '删除成功')
})

module.exports = router
