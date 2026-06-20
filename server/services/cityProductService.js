const BaseService = require('./baseService')
const productService = require('./productService')
const categoryService = require('./categoryService')
const { readJson } = require('../utils/fileStorage')

const CITY_PROD_FILE = 'cityProducts.json'
const CITY_FILE = 'cities.json'

class CityProductService extends BaseService {
  constructor() {
    super(CITY_PROD_FILE, 'cp')
  }

  isCityFranchised(city) {
    if (!city) return false
    const val = city.isFranchised !== undefined ? city.isFranchised : city.isFranchise
    return val === true || val === 1 || val === '1'
  }

  getCities(filters = {}) {
    let cities = readJson(CITY_FILE)
    if (filters.status !== undefined && filters.status !== '') {
      cities = cities.filter((c) => Number(c.status) === Number(filters.status))
    }
    if (filters.isFranchise !== undefined && filters.isFranchise !== '') {
      const want =
        filters.isFranchise === 'true' ||
        filters.isFranchise === '1' ||
        filters.isFranchise === 1 ||
        filters.isFranchise === true
      cities = cities.filter((c) => this.isCityFranchised(c) === want)
    }
    return cities
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((c) => ({ ...c, isFranchise: this.isCityFranchised(c) }))
  }

  getCityById(cityId) {
    const cities = readJson(CITY_FILE)
    const city = cities.find((c) => c.id === cityId)
    if (!city) return null
    return { ...city, isFranchise: this.isCityFranchised(city) }
  }

  withFullInfo(list) {
    const cities = readJson(CITY_FILE)
    const products = productService.load()
    const cats = categoryService.load()

    return list.map((cp) => {
      const city = cities.find((c) => c.id === cp.cityId)
      const product = products.find((p) => p.id === cp.productId)
      const cat = product
        ? cats.find((c) => c.id === product.categoryId)
        : null
      const parent =
        product && cat && cat.parentId
          ? cats.find((c) => c.id === cat.parentId)
          : null

      return {
        ...cp,
        cityName: city ? city.name : '',
        cityCode: city ? city.code : '',
        isFranchise: this.isCityFranchised(city),
        productName: product ? product.name : '',
        productIcon: product ? product.icon || product.image || '📦' : '',
        productPrice: product ? product.price : 0,
        productOriginalPrice: product
          ? product.originalPrice || product.price
          : 0,
        productCategoryId: product ? product.categoryId : '',
        productCategoryName: cat ? cat.name : '',
        productParentCategoryName: parent ? parent.name : '',
        productFullCategoryName:
          parent && cat
            ? `${parent.name} / ${cat.name}`
            : cat
            ? cat.name
            : ''
      }
    })
  }

  findAll(filters = {}) {
    let list = this.load()

    if (filters.cityId) {
      list = list.filter((cp) => cp.cityId === filters.cityId)
    }
    if (filters.productId) {
      list = list.filter((cp) => cp.productId === filters.productId)
    }
    if (filters.status !== undefined && filters.status !== '') {
      list = list.filter((cp) => Number(cp.status) === Number(filters.status))
    }

    return list.sort((a, b) => {
      if (a.cityId !== b.cityId) {
        return a.cityId.localeCompare(b.cityId)
      }
      return (a.sort || 0) - (b.sort || 0)
    })
  }

  findByCity(cityId, status = null) {
    let list = this.load().filter((cp) => cp.cityId === cityId)
    if (status !== undefined && status !== null && status !== '') {
      list = list.filter((cp) => Number(cp.status) === Number(status))
    }
    return list.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }

  findByCityAndProduct(cityId, productId) {
    const list = this.load()
    return (
      list.find((cp) => cp.cityId === cityId && cp.productId === productId) ||
      null
    )
  }

  getPool(cityId) {
    const city = this.getCityById(cityId)
    if (!city) throw new Error('城市不存在')

    const allProducts = productService.load()
    const cityProductsAll = this.load()
    const cats = categoryService.load()

    const explicitCityProducts = cityProductsAll.filter(
      (cp) => cp.cityId === cityId && Number(cp.status) === 1
    )

    const officialDefaults = allProducts.filter(
      (p) =>
        (p.isDefault === true || p.isDefault === 1) && Number(p.status) === 1
    )

    const poolById = new Map()

    officialDefaults.forEach((p) => {
      poolById.set(p.id, { product: p, isOfficialDefault: true })
    })

    explicitCityProducts.forEach((cp) => {
      const p = allProducts.find((x) => x.id === cp.productId)
      if (!p || Number(p.status) !== 1) return
      const existing = poolById.get(cp.productId)
      if (existing) {
        existing.cityProduct = cp
        existing.isOfficialDefault = existing.isOfficialDefault || false
      } else {
        poolById.set(cp.productId, {
          product: p,
          isOfficialDefault: false,
          cityProduct: cp
        })
      }
    })

    const pool = []
    poolById.forEach((entry) => {
      const { product, isOfficialDefault, cityProduct } = entry
      const cat = cats.find((c) => c.id === product.categoryId) || null
      const parent =
        cat && cat.parentId
          ? cats.find((c) => c.id === cat.parentId)
          : null
      const explicitSort =
        cityProduct && cityProduct.sort !== undefined
          ? Number(cityProduct.sort)
          : null
      const effectiveSort =
        explicitSort !== null
          ? explicitSort
          : Number(product.sort || 0) + (isOfficialDefault ? 100000 : 0)

      pool.push({
        productId: product.id,
        cityProductId: cityProduct ? cityProduct.id : '',
        productName: product.name,
        productIcon: product.icon || product.image || '📦',
        productPrice: product.price,
        productOriginalPrice: product.originalPrice || product.price,
        productCategoryId: product.categoryId,
        productCategoryName: cat ? cat.name : '',
        productParentCategoryName: parent ? parent.name : '',
        productFullCategoryName:
          parent && cat
            ? `${parent.name} / ${cat.name}`
            : cat
            ? cat.name
            : '',
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
      isFranchise: this.isCityFranchised(city),
      total: pool.length,
      officialDefaultCount: pool.filter((p) => p.isOfficialDefault).length,
      cityAddedCount: pool.filter((p) => !p.isOfficialDefault).length,
      pool
    }
  }

  create(data) {
    const { cityId, productId, sort, status } = data

    if (!cityId) throw new Error('请选择城市')
    if (!productId) throw new Error('请选择商品')

    const city = this.getCityById(cityId)
    if (!city) throw new Error('城市不存在')

    const product = productService.findById(productId)
    if (!product) throw new Error('商品不存在')

    if (this.findByCityAndProduct(cityId, productId)) {
      throw new Error('该城市已配置此商品')
    }

    const cityList = this.findByCity(cityId)
    const maxSort = cityList.reduce((m, cp) => Math.max(m, cp.sort || 0), -1)

    return super.create({
      cityId,
      productId,
      sort: sort !== undefined ? Number(sort) : maxSort + 1,
      status: status === 0 ? 0 : 1
    })
  }

  batchAdd(cityId, productIds) {
    if (!cityId) throw new Error('请选择城市')
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('请选择商品')
    }

    const city = this.getCityById(cityId)
    if (!city) throw new Error('城市不存在')

    const list = this.load()
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
        id: this.genId(),
        cityId,
        productId: pid,
        sort: maxSort,
        status: 1,
        createdAt: now,
        updatedAt: now
      })
      added++
    })

    this.save(list)
    return { added, skipped }
  }

  update(id, data) {
    const existing = this.findById(id)
    if (!existing) throw new Error('配置不存在')

    const updateData = {}
    if (data.sort !== undefined) updateData.sort = Number(data.sort) || 0
    if (data.status !== undefined)
      updateData.status = Number(data.status) === 0 ? 0 : 1

    return super.update(id, updateData)
  }

  sortPool(cityId, items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('排序数据不能为空')
    }

    const city = this.getCityById(cityId)
    if (!city) throw new Error('城市不存在')

    const list = this.load()
    const now = new Date().toISOString()
    let updated = 0

    items.forEach((it) => {
      if (!it || !it.productId) return
      const idx = list.findIndex(
        (cp) => cp.cityId === cityId && cp.productId === it.productId
      )
      const sortNum = it.sort !== undefined ? Number(it.sort) : 0

      if (idx !== -1) {
        list[idx].sort = sortNum
        list[idx].updatedAt = now
        updated++
      } else {
        list.push({
          id: this.genId(),
          cityId,
          productId: it.productId,
          sort: sortNum,
          status: 1,
          createdAt: now,
          updatedAt: now
        })
        updated++
      }
    })

    this.save(list)
    return { count: updated, cityId }
  }

  removeFromPool(cityId, productId) {
    if (!productId) throw new Error('缺少 productId')

    const poolData = this.getPool(cityId)
    const poolItem = poolData.pool.find((p) => p.productId === productId)

    if (!poolItem) throw new Error('商品不在该城市池中')

    if (poolItem.isOfficialDefault && !poolItem.hasCityConfig) {
      throw new Error(
        '官方默认商品无法移除，可调整其排序或在商品库取消默认属性'
      )
    }

    const list = this.load()
    const idx = list.findIndex(
      (cp) => cp.cityId === cityId && cp.productId === productId
    )

    if (idx !== -1) {
      list.splice(idx, 1)
      this.save(list)
    }

    if (poolItem.isOfficialDefault && poolItem.hasCityConfig) {
      return {
        productId,
        removed: true,
        message: '已移除该商品在本城市的显式排序（商品仍作为官方默认出现在池中）'
      }
    }

    return { productId, removed: true, message: '已从城市商品池中移除' }
  }

  resetToDefault(cityId) {
    if (!cityId) throw new Error('请选择城市')

    const city = this.getCityById(cityId)
    if (!city) throw new Error('城市不存在')

    const list = this.load()
    const before = list.length
    const newList = list.filter((cp) => cp.cityId !== cityId)
    const removed = before - newList.length
    this.save(newList)

    return { cityId, removed }
  }

  getNonFranchiseConfigs() {
    const cities = this.getCities({ status: 1, isFranchise: false })
    const cityProducts = this.load()
    const products = productService.load()

    const defaultProducts = products
      .filter(
        (p) =>
          (p.isDefault === true || p.isDefault === 1) && Number(p.status) === 1
      )
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))

    const cityConfigs = cities.map((city) => {
      const cityProdList = cityProducts
        .filter((cp) => cp.cityId === city.id && Number(cp.status) === 1)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((cp) => {
          const prod = products.find((p) => p.id === cp.productId)
          return {
            id: cp.id,
            productId: cp.productId,
            productName: prod ? prod.name : '',
            productIcon: prod ? prod.icon || prod.image || '📦' : '',
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

    return {
      nonFranchiseCities: cities.map((c) => ({ ...c, isFranchise: false })),
      defaultProducts: defaultProducts.map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.icon || p.image || '📦',
        price: p.price
      })),
      cityConfigs
    }
  }
}

module.exports = new CityProductService()
