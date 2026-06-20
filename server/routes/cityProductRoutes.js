const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'cityProducts.json'
const CITY_FILE = 'cities.json'
const PROD_FILE = 'products.json'

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
  return list.map((cp) => {
    const city = cities.find((c) => c.id === cp.cityId)
    const product = products.find((p) => p.id === cp.productId)
    return {
      ...cp,
      cityName: city ? city.name : '',
      cityCode: city ? city.code : '',
      isFranchise: isCityFranchised(city),
      productName: product ? product.name : '',
      productIcon: getProductIcon(product),
      productPrice: product ? product.price : 0,
      productCategoryId: product ? product.categoryId : ''
    }
  })
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
  if (isCityFranchised(city)) return fail(res, '加盟城市无需配置默认商品')

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
  const { cityId, items } = req.body || {}
  if (!cityId) return fail(res, '请选择城市')
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, '排序数据不能为空')
  }
  const list = load()
  items.forEach((it) => {
    const idx = list.findIndex((cp) => cp.id === it.id && cp.cityId === cityId)
    if (idx !== -1) {
      if (it.sort !== undefined) list[idx].sort = Number(it.sort) || 0
      list[idx].updatedAt = new Date().toISOString()
    }
  })
  save(list)
  ok(res, { count: items.length }, '排序成功')
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
  if (isCityFranchised(city)) return fail(res, '加盟城市无需配置默认商品')

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
