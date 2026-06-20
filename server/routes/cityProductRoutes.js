const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'cityProducts.json'
const CITY_FILE = 'cities.json'
const PROD_FILE = 'products.json'
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

function isCityFranchised(city) {
  if (!city) return false
  const val = city.isFranchised !== undefined ? city.isFranchised : city.isFranchise
  return val === true || val === 1 || val === '1'
}

function getProductIcon(p) {
  if (!p) return ''
  return p.icon || p.image || '📦'
}

function withFullInfo(list) {
  const cities = readJson(CITY_FILE)
  const products = readJson(PROD_FILE)
  const cats = readJson(CAT_FILE)
  return list.map((cp) => {
    const city = cities.find((c) => c.id === cp.cityId)
    const product = products.find((p) => p.id === cp.productId)
    const cat = product ? cats.find((c) => c.id === product.categoryId) : null
    const parent = product && cat && cat.parentId ? cats.find((c) => c.id === cat.parentId) : null
    return {
      ...cp,
      cityName: city ? city.name : '',
      cityCode: city ? city.code : '',
      isFranchise: isCityFranchised(city),
      productName: product ? product.name : '',
      productIcon: getProductIcon(product),
      productPrice: product ? product.price : 0,
      productOriginalPrice: product ? product.originalPrice || product.price : 0,
      productCategoryId: product ? product.categoryId : '',
      productCategoryName: cat ? cat.name : '',
      productParentCategoryName: parent ? parent.name : '',
      productFullCategoryName:
        parent && cat ? `${parent.name} / ${cat.name}` : cat ? cat.name : ''
    }
  })
}

function buildPool(cityId) {
  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return null
  const products = readJson(PROD_FILE)
  const cityProductsAll = readJson(FILE)
  const cats = readJson(CAT_FILE)

  const explicitCityProducts = cityProductsAll.filter(
    (cp) => cp.cityId === cityId && Number(cp.status) === 1
  )

  const officialDefaults = products.filter(
    (p) => (p.isDefault === true || p.isDefault === 1) && Number(p.status) === 1
  )

  const poolById = new Map()

  officialDefaults.forEach((p) => {
    poolById.set(p.id, { product: p, isOfficialDefault: true })
  })

  explicitCityProducts.forEach((cp) => {
    const p = products.find((x) => x.id === cp.productId)
    if (!p || Number(p.status) !== 1) return
    const existing = poolById.get(cp.productId)
    if (existing) {
      existing.cityProduct = cp
      existing.isOfficialDefault = existing.isOfficialDefault || false
    } else {
      poolById.set(cp.productId, { product: p, isOfficialDefault: false, cityProduct: cp })
    }
  })

  const pool = []
  poolById.forEach((entry) => {
    const { product, isOfficialDefault, cityProduct } = entry
    const cat = cats.find((c) => c.id === product.categoryId) || null
    const parent = cat && cat.parentId ? cats.find((c) => c.id === cat.parentId) : null
    const explicitSort =
      cityProduct && cityProduct.sort !== undefined ? Number(cityProduct.sort) : null
    const effectiveSort =
      explicitSort !== null
        ? explicitSort
        : Number(product.sort || 0) + (isOfficialDefault ? 100000 : 0)
    pool.push({
      productId: product.id,
      cityProductId: cityProduct ? cityProduct.id : '',
      productName: product.name,
      productIcon: getProductIcon(product),
      productPrice: product.price,
      productOriginalPrice: product.originalPrice || product.price,
      productCategoryId: product.categoryId,
      productCategoryName: cat ? cat.name : '',
      productParentCategoryName: parent ? parent.name : '',
      productFullCategoryName:
        parent && cat ? `${parent.name} / ${cat.name}` : cat ? cat.name : '',
      isOfficialDefault,
      hasCityConfig: !!cityProduct,
      explicitSort,
      effectiveSort
    })
  })

  pool.sort((a, b) => a.effectiveSort - b.effectiveSort)
  pool.forEach((item, idx) => {
    item.displayIndex = idx
  })

  return {
    cityId: city.id,
    cityName: city.name,
    cityCode: city.code,
    cityProvince: city.province,
    isFranchise: isCityFranchised(city),
    total: pool.length,
    officialDefaultCount: pool.filter((p) => p.isOfficialDefault).length,
    cityAddedCount: pool.filter((p) => !p.isOfficialDefault).length,
    pool
  }
}

router.get('/', (req, res) => {
  const { cityId, productId, status } = req.query
  let list = load()
  if (cityId) {
    list = list.filter((cp) => cp.cityId === cityId)
  }
  if (productId) {
    list = list.filter((cp) => cp.productId === productId)
  }
  if (status !== undefined && status !== '') {
    list = list.filter((cp) => Number(cp.status) === Number(status))
  }
  list = [...list].sort((a, b) => {
    if (a.cityId !== b.cityId) {
      return a.cityId.localeCompare(b.cityId)
    }
    return (a.sort || 0) - (b.sort || 0)
  })
  ok(res, withFullInfo(list))
})

router.get('/city/:cityId', (req, res) => {
  const { cityId } = req.params
  const { status } = req.query
  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return fail(res, '城市不存在', 404)

  let list = load().filter((cp) => cp.cityId === cityId)
  if (status !== undefined && status !== '') {
    list = list.filter((cp) => Number(cp.status) === Number(status))
  }
  list = [...list].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  ok(res, withFullInfo(list))
})

router.get('/non-franchise-configs', (req, res) => {
  const cities = readJson(CITY_FILE)
  const cityProducts = load()
  const products = readJson(PROD_FILE)

  const nonFranchiseCities = cities
    .filter((c) => !isCityFranchised(c) && Number(c.status) === 1)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))

  const defaultProducts = products
    .filter((p) => (p.isDefault === true || p.isDefault === 1) && Number(p.status) === 1)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))

  const cityConfigs = nonFranchiseCities.map((city) => {
    const cityProdList = cityProducts
      .filter((cp) => cp.cityId === city.id && Number(cp.status) === 1)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((cp) => {
        const prod = products.find((p) => p.id === cp.productId)
        return {
          id: cp.id,
          productId: cp.productId,
          productName: prod ? prod.name : '',
          productIcon: getProductIcon(prod),
          productPrice: prod ? prod.price : 0,
          sort: cp.sort
        }
      })
    return {
      cityId: city.id,
      cityName: city.name,
      cityCode: city.code,
      province: city.province,
      customProducts: cityProdList
    }
  })

  ok(res, {
    nonFranchiseCities: nonFranchiseCities.map((c) => ({
      ...c,
      isFranchise: false
    })),
    defaultProducts: defaultProducts.map((p) => ({
      id: p.id,
      name: p.name,
      icon: getProductIcon(p),
      price: p.price
    })),
    cityConfigs
  })
})

router.get('/cities', (req, res) => {
  const { status, isFranchise } = req.query
  let cities = readJson(CITY_FILE)
  if (status !== undefined && status !== '') {
    cities = cities.filter((c) => Number(c.status) === Number(status))
  }
  if (isFranchise !== undefined && isFranchise !== '') {
    const want = isFranchise === 'true' || isFranchise === '1'
    cities = cities.filter((c) => isCityFranchised(c) === want)
  }
  cities = [...cities].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  ok(res, cities.map((c) => ({ ...c, isFranchise: isCityFranchised(c) })))
})

router.get('/pool/:cityId', (req, res) => {
  const data = buildPool(req.params.cityId)
  if (!data) return fail(res, '城市不存在', 404)
  ok(res, data)
})

router.post('/pool/:cityId/sort', (req, res) => {
  const { items } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, '排序数据不能为空')
  }
  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === req.params.cityId)
  if (!city) return fail(res, '城市不存在', 404)

  const list = load()
  const now = new Date().toISOString()
  let updated = 0
  items.forEach((it) => {
    if (!it || !it.productId) return
    const idx = list.findIndex(
      (cp) => cp.cityId === req.params.cityId && cp.productId === it.productId
    )
    const sortNum = it.sort !== undefined ? Number(it.sort) : 0
    if (idx !== -1) {
      list[idx].sort = sortNum
      list[idx].updatedAt = now
      updated++
    } else {
      list.push({
        id: genId('cp'),
        cityId: req.params.cityId,
        productId: it.productId,
        sort: sortNum,
        status: 1,
        createdAt: now,
        updatedAt: now
      })
      updated++
    }
  })
  save(list)
  ok(res, { count: updated, cityId: req.params.cityId }, '商品池排序已保存')
})

router.post('/pool/:cityId/remove-product', (req, res) => {
  const { productId } = req.body || {}
  if (!productId) return fail(res, '缺少 productId')
  const data = buildPool(req.params.cityId)
  if (!data) return fail(res, '城市不存在', 404)
  const poolItem = data.pool.find((p) => p.productId === productId)
  if (!poolItem) return fail(res, '商品不在该城市池中', 404)
  if (poolItem.isOfficialDefault && !poolItem.hasCityConfig) {
    return fail(res, '官方默认商品无法移除，可调整其排序或在商品库取消默认属性')
  }
  if (poolItem.isOfficialDefault && poolItem.hasCityConfig) {
    const list = load()
    const idx = list.findIndex(
      (cp) => cp.cityId === req.params.cityId && cp.productId === productId
    )
    if (idx !== -1) {
      list.splice(idx, 1)
      save(list)
    }
    return ok(
      res,
      { productId, removed: true },
      '已移除该商品在本城市的显式排序（商品仍作为官方默认出现在池中）'
    )
  }
  const list = load()
  const idx = list.findIndex(
    (cp) => cp.cityId === req.params.cityId && cp.productId === productId
  )
  if (idx === -1) return fail(res, '配置不存在', 404)
  list.splice(idx, 1)
  save(list)
  ok(res, { productId, removed: true }, '已从城市商品池中移除')
})

router.get('/:id', (req, res) => {
  const list = load()
  const item = list.find((cp) => cp.id === req.params.id)
  if (!item) return fail(res, '配置不存在', 404)
  ok(res, withFullInfo([item])[0])
})

router.post('/', (req, res) => {
  const { cityId, productId, sort, status } = req.body || {}
  if (!cityId) return fail(res, '请选择城市')
  if (!productId) return fail(res, '请选择商品')

  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return fail(res, '城市不存在')

  const products = readJson(PROD_FILE)
  const product = products.find((p) => p.id === productId)
  if (!product) return fail(res, '商品不存在')

  const list = load()
  const exists = list.some(
    (cp) => cp.cityId === cityId && cp.productId === productId
  )
  if (exists) return fail(res, '该城市已配置此商品')

  const cityList = list.filter((cp) => cp.cityId === cityId)
  const maxSort = cityList.reduce((m, cp) => Math.max(m, cp.sort || 0), -1)
  const now = new Date().toISOString()
  const item = {
    id: genId('cp'),
    cityId,
    productId,
    sort: sort !== undefined ? Number(sort) : maxSort + 1,
    status: status === 0 ? 0 : 1,
    createdAt: now,
    updatedAt: now
  }
  list.push(item)
  save(list)
  ok(res, withFullInfo([item])[0], '配置成功')
})

router.put('/:id', (req, res) => {
  const { sort, status } = req.body || {}
  const list = load()
  const idx = list.findIndex((cp) => cp.id === req.params.id)
  if (idx === -1) return fail(res, '配置不存在', 404)
  const item = list[idx]
  if (sort !== undefined) item.sort = Number(sort) || 0
  if (status !== undefined) item.status = Number(status) === 0 ? 0 : 1
  item.updatedAt = new Date().toISOString()
  list[idx] = item
  save(list)
  ok(res, withFullInfo([item])[0], '更新成功')
})

router.delete('/:id', (req, res) => {
  const list = load()
  const idx = list.findIndex((cp) => cp.id === req.params.id)
  if (idx === -1) return fail(res, '配置不存在', 404)
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
  let updated = 0
  const now = new Date().toISOString()
  items.forEach((it) => {
    if (!it || !it.id) return
    const idx = list.findIndex((cp) => cp.id === it.id)
    if (idx !== -1) {
      if (it.sort !== undefined) list[idx].sort = Number(it.sort) || 0
      list[idx].updatedAt = now
      updated++
    }
  })
  save(list)
  ok(res, { count: updated }, '排序成功')
})

router.post('/batch', (req, res) => {
  const { cityId, productIds } = req.body || {}
  if (!cityId) return fail(res, '请选择城市')
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return fail(res, '请选择商品')
  }
  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return fail(res, '城市不存在')

  const list = load()
  const cityList = list.filter((cp) => cp.cityId === cityId)
  let maxSort = cityList.reduce((m, cp) => Math.max(m, cp.sort || 0), -1)
  const now = new Date().toISOString()
  let added = 0
  const skipped = []

  productIds.forEach((pid) => {
    const exists = list.some((cp) => cp.cityId === cityId && cp.productId === pid)
    if (exists) {
      skipped.push(pid)
      return
    }
    maxSort++
    list.push({
      id: genId('cp'),
      cityId,
      productId: pid,
      sort: maxSort,
      status: 1,
      createdAt: now,
      updatedAt: now
    })
    added++
  })
  save(list)
  ok(res, { added, skipped }, '批量配置完成')
})

router.post('/reset-default/:cityId', (req, res) => {
  const { cityId } = req.params
  if (!cityId) return fail(res, '请选择城市')
  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return fail(res, '城市不存在')

  const list = load()
  const before = list.length
  const newList = list.filter((cp) => cp.cityId !== cityId)
  const removed = before - newList.length
  save(newList)
  ok(res, { cityId, removed }, '已重置为总部默认')
})

router.post('/batch-add', (req, res) => {
  const { cityId, productIds } = req.body || {}
  if (!cityId) return fail(res, '请选择城市')
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return fail(res, '请选择商品')
  }
  const cities = readJson(CITY_FILE)
  const city = cities.find((c) => c.id === cityId)
  if (!city) return fail(res, '城市不存在')

  const list = load()
  const cityList = list.filter((cp) => cp.cityId === cityId)
  let maxSort = cityList.reduce((m, cp) => Math.max(m, cp.sort || 0), -1)
  const now = new Date().toISOString()
  let added = 0
  const skipped = []

  productIds.forEach((pid) => {
    const exists = list.some((cp) => cp.cityId === cityId && cp.productId === pid)
    if (exists) {
      skipped.push(pid)
      return
    }
    maxSort++
    list.push({
      id: genId('cp'),
      cityId,
      productId: pid,
      sort: maxSort,
      status: 1,
      createdAt: now,
      updatedAt: now
    })
    added++
  })
  save(list)
  ok(res, { added, skipped }, '批量配置完成')
})

module.exports = router
