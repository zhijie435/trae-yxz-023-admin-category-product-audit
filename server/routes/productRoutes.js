const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'products.json'
const CAT_FILE = 'categories.json'
const CITY_FILE = 'cities.json'
const CITY_PROD_FILE = 'cityProducts.json'

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

function normalizeProduct(p) {
  const icon = p.icon || p.image || '📦'
  const salesCount = typeof p.salesCount === 'number' ? p.salesCount : 0
  const tags = Array.isArray(p.tags) ? p.tags : []
  const isDefault = p.isDefault === true || p.isDefault === 1 || p.isDefault === '1'
  return { ...p, icon, salesCount, tags, isDefault }
}

function withCategoryInfo(list) {
  const cats = readJson(CAT_FILE)
  return list.map((p) => {
    const np = normalizeProduct(p)
    const cat = cats.find((c) => c.id === np.categoryId)
    let categoryName = ''
    let parentCategoryName = ''
    if (cat) {
      categoryName = cat.name
      if (cat.parentId) {
        const parent = cats.find((c) => c.id === cat.parentId)
        parentCategoryName = parent ? parent.name : ''
      }
    }
    return {
      ...np,
      categoryName,
      parentCategoryName,
      fullCategoryName: parentCategoryName ? `${parentCategoryName} / ${categoryName}` : categoryName,
      categoryPath: parentCategoryName ? `${parentCategoryName} / ${categoryName}` : categoryName
    }
  })
}

router.get('/', (req, res) => {
  const { keyword, categoryId, status, isDefault, parentCategoryId } = req.query
  let list = load().map(normalizeProduct)
  if (keyword) {
    const kw = String(keyword).trim()
    list = list.filter((p) => p.name.includes(kw) || (p.description && p.description.includes(kw)))
  }
  if (status !== undefined && status !== '') {
    list = list.filter((p) => Number(p.status) === Number(status))
  }
  if (isDefault !== undefined && isDefault !== '') {
    const want = isDefault === 'true' || isDefault === '1'
    list = list.filter((p) => Boolean(p.isDefault) === want)
  }
  if (categoryId) {
    list = list.filter((p) => p.categoryId === categoryId)
  }
  if (parentCategoryId) {
    const cats = readJson(CAT_FILE)
    const childCats = cats.filter((c) => c.parentId === parentCategoryId).map((c) => c.id)
    list = list.filter((p) => childCats.includes(p.categoryId))
  }
  list = [...list].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  ok(res, withCategoryInfo(list))
})

function isCityFranchised(city) {
  if (!city) return false
  const val = city.isFranchised !== undefined ? city.isFranchised : city.isFranchise
  return val === true || val === 1 || val === '1'
}

router.get('/defaults', (req, res) => {
  const { cityId } = req.query
  const list = load().map(normalizeProduct)
  let products = list.filter((p) => p.isDefault && Number(p.status) === 1)

  if (cityId) {
    const cities = readJson(CITY_FILE)
    const city = cities.find((c) => c.id === cityId)
    if (city) {
      const cityProducts = readJson(CITY_PROD_FILE)
      const cityProdIds = cityProducts
        .filter((cp) => cp.cityId === cityId && Number(cp.status) === 1)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((cp) => cp.productId)
      if (cityProdIds.length > 0) {
        const cityMappedProducts = []
        cityProdIds.forEach((pid) => {
          const prod = products.find((p) => p.id === pid)
          if (prod) cityMappedProducts.push(prod)
        })
        const otherDefaults = products
          .filter((p) => !cityProdIds.includes(p.id))
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        products = [...cityMappedProducts, ...otherDefaults]
        ok(res, withCategoryInfo(products))
        return
      }
    }
  }

  products = products.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  ok(res, withCategoryInfo(products))
})

router.get('/:id', (req, res) => {
  const list = load()
  const item = list.find((p) => p.id === req.params.id)
  if (!item) return fail(res, '商品不存在', 404)
  ok(res, withCategoryInfo([item])[0])
})

router.post('/', (req, res) => {
  const {
    name, categoryId, icon, description, price, originalPrice,
    salesCount, status, isDefault, tags
  } = req.body || {}
  if (!name || !String(name).trim()) {
    return fail(res, '商品名称不能为空')
  }
  if (!categoryId) {
    return fail(res, '请选择商品分类')
  }
  const cats = readJson(CAT_FILE)
  const cat = cats.find((c) => c.id === categoryId)
  if (!cat) return fail(res, '所选分类不存在')
  const numPrice = Number(price)
  if (isNaN(numPrice) || numPrice < 0) {
    return fail(res, '商品价格不正确')
  }
  const list = load()
  const maxSort = list.reduce((m, p) => Math.max(m, p.sort || 0), -1)
  const now = new Date().toISOString()
  const item = {
    id: genId('prod'),
    name: String(name).trim(),
    categoryId,
    icon: icon || '📦',
    description: description || '',
    price: numPrice,
    originalPrice: originalPrice ? Number(originalPrice) : numPrice,
    salesCount: salesCount ? Number(salesCount) : 0,
    sort: maxSort + 1,
    status: status === 0 ? 0 : 1,
    isDefault: isDefault === true || isDefault === 'true' || isDefault === 1,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: now,
    updatedAt: now
  }
  list.push(item)
  save(list)
  ok(res, withCategoryInfo([item])[0], '创建成功')
})

router.put('/:id', (req, res) => {
  const {
    name, categoryId, icon, description, price, originalPrice,
    salesCount, status, isDefault, tags, sort
  } = req.body || {}
  const list = load()
  const idx = list.findIndex((p) => p.id === req.params.id)
  if (idx === -1) return fail(res, '商品不存在', 404)
  if (name !== undefined && !String(name).trim()) {
    return fail(res, '商品名称不能为空')
  }
  if (categoryId !== undefined) {
    const cats = readJson(CAT_FILE)
    const cat = cats.find((c) => c.id === categoryId)
    if (!cat) return fail(res, '所选分类不存在')
  }
  if (price !== undefined) {
    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice < 0) {
      return fail(res, '商品价格不正确')
    }
  }
  const item = list[idx]
  if (name !== undefined) item.name = String(name).trim()
  if (categoryId !== undefined) item.categoryId = categoryId
  if (icon !== undefined) item.icon = icon || '📦'
  if (description !== undefined) item.description = description || ''
  if (price !== undefined) item.price = Number(price)
  if (originalPrice !== undefined) item.originalPrice = Number(originalPrice) || item.price
  if (salesCount !== undefined) item.salesCount = Number(salesCount) || 0
  if (status !== undefined) item.status = Number(status) === 0 ? 0 : 1
  if (isDefault !== undefined) item.isDefault = isDefault === true || isDefault === 'true' || isDefault === 1
  if (tags !== undefined) item.tags = Array.isArray(tags) ? tags : []
  if (sort !== undefined) item.sort = Number(sort) || 0
  item.updatedAt = new Date().toISOString()
  list[idx] = item
  save(list)
  ok(res, withCategoryInfo([item])[0], '更新成功')
})

router.delete('/:id', (req, res) => {
  const list = load()
  const idx = list.findIndex((p) => p.id === req.params.id)
  if (idx === -1) return fail(res, '商品不存在', 404)
  const target = list[idx]
  list.splice(idx, 1)
  save(list)
  ok(res, { id: target.id }, '删除成功')
})

router.post('/sort', (req, res) => {
  const { items } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, '排序数据不能为空')
  }
  const list = load()
  items.forEach((it) => {
    const idx = list.findIndex((p) => p.id === it.id)
    if (idx !== -1) {
      if (it.sort !== undefined) list[idx].sort = Number(it.sort) || 0
      list[idx].updatedAt = new Date().toISOString()
    }
  })
  save(list)
  ok(res, { count: items.length }, '排序成功')
})

router.post('/batch-toggle-default', (req, res) => {
  const { ids, isDefault } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return fail(res, '请选择要操作的商品')
  }
  const list = load()
  let count = 0
  const val = isDefault === true || isDefault === 'true' || isDefault === 1
  ids.forEach((id) => {
    const idx = list.findIndex((p) => p.id === id)
    if (idx !== -1) {
      list[idx].isDefault = val
      list[idx].updatedAt = new Date().toISOString()
      count++
    }
  })
  save(list)
  ok(res, { count }, '批量操作成功')
})

router.post('/batch-toggle-status', (req, res) => {
  const { ids, status } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return fail(res, '请选择要操作的商品')
  }
  const target = Number(status) === 0 ? 0 : 1
  const list = load()
  let count = 0
  ids.forEach((id) => {
    const idx = list.findIndex((p) => p.id === id)
    if (idx !== -1) {
      list[idx].status = target
      list[idx].updatedAt = new Date().toISOString()
      count++
    }
  })
  save(list)
  ok(res, { count, status: target }, target === 1 ? '批量上架成功' : '批量下架成功')
})

router.post('/:id/toggle-status', (req, res) => {
  const { status } = req.body || {}
  const list = load()
  const idx = list.findIndex((p) => p.id === req.params.id)
  if (idx === -1) return fail(res, '商品不存在', 404)
  let target
  if (status !== undefined && status !== '') {
    target = Number(status) === 0 ? 0 : 1
  } else {
    target = Number(list[idx].status) === 1 ? 0 : 1
  }
  list[idx].status = target
  list[idx].updatedAt = new Date().toISOString()
  save(list)
  ok(res, withCategoryInfo([list[idx]])[0], target === 1 ? '上架成功' : '下架成功')
})

module.exports = router
