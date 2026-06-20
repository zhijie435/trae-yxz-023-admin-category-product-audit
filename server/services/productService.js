const BaseService = require('./baseService')
const categoryService = require('./categoryService')
const { readJson } = require('../utils/fileStorage')

const PROD_FILE = 'products.json'
const CAT_FILE = 'categories.json'
const CITY_FILE = 'cities.json'
const CITY_PROD_FILE = 'cityProducts.json'

class ProductService extends BaseService {
  constructor() {
    super(PROD_FILE, 'prod')
  }

  normalizeProduct(p) {
    const icon = p.icon || p.image || '📦'
    const salesCount = typeof p.salesCount === 'number' ? p.salesCount : 0
    const tags = Array.isArray(p.tags) ? p.tags : []
    const isDefault = p.isDefault === true || p.isDefault === 1 || p.isDefault === '1'
    return { ...p, icon, salesCount, tags, isDefault }
  }

  withCategoryInfo(product) {
    const cats = readJson(CAT_FILE)
    const cat = cats.find((c) => c.id === product.categoryId)
    let categoryName = ''
    let parentCategoryName = ''
    let fullCategoryName = ''
    let categoryPath = ''

    if (cat) {
      categoryName = cat.name
      if (cat.parentId) {
        const parent = cats.find((c) => c.id === cat.parentId)
        parentCategoryName = parent ? parent.name : ''
      }
      fullCategoryName = parentCategoryName
        ? `${parentCategoryName} / ${categoryName}`
        : categoryName
      categoryPath = fullCategoryName
    }

    return {
      ...product,
      categoryName,
      parentCategoryName,
      fullCategoryName,
      categoryPath
    }
  }

  withCategoryInfoList(list) {
    return list.map((p) => this.withCategoryInfo(this.normalizeProduct(p)))
  }

  findAll(filters = {}) {
    let list = this.load().map((p) => this.normalizeProduct(p))

    if (filters.keyword) {
      const kw = String(filters.keyword).trim()
      list = list.filter(
        (p) =>
          p.name.includes(kw) || (p.description && p.description.includes(kw))
      )
    }

    if (filters.status !== undefined && filters.status !== '') {
      list = list.filter((p) => Number(p.status) === Number(filters.status))
    }

    if (filters.isDefault !== undefined && filters.isDefault !== '') {
      const want =
        filters.isDefault === 'true' ||
        filters.isDefault === '1' ||
        filters.isDefault === 1 ||
        filters.isDefault === true
      list = list.filter((p) => Boolean(p.isDefault) === want)
    }

    if (filters.categoryId) {
      list = list.filter((p) => p.categoryId === filters.categoryId)
    }

    if (filters.parentCategoryId) {
      const cats = readJson(CAT_FILE)
      const childCats = cats
        .filter((c) => c.parentId === filters.parentCategoryId)
        .map((c) => c.id)
      list = list.filter((p) => childCats.includes(p.categoryId))
    }

    return list.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }

  findById(id) {
    const list = this.load()
    const item = list.find((p) => p.id === id)
    if (!item) return null
    return this.withCategoryInfo(this.normalizeProduct(item))
  }

  create(data) {
    const {
      name,
      categoryId,
      icon,
      description,
      price,
      originalPrice,
      salesCount,
      status,
      isDefault,
      tags
    } = data

    if (!name || !String(name).trim()) {
      throw new Error('商品名称不能为空')
    }
    if (!categoryId) {
      throw new Error('请选择商品分类')
    }

    const cat = categoryService.findById(categoryId)
    if (!cat) throw new Error('所选分类不存在')

    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice < 0) {
      throw new Error('商品价格不正确')
    }

    const list = this.load()
    const maxSort = list.reduce((m, p) => Math.max(m, p.sort || 0), -1)

    const item = super.create({
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
      tags: Array.isArray(tags) ? tags : []
    })

    return this.withCategoryInfo(this.normalizeProduct(item))
  }

  update(id, data) {
    const existing = this.findById(id)
    if (!existing) throw new Error('商品不存在')

    if (data.name !== undefined && !String(data.name).trim()) {
      throw new Error('商品名称不能为空')
    }

    if (data.categoryId !== undefined) {
      const cat = categoryService.findById(data.categoryId)
      if (!cat) throw new Error('所选分类不存在')
    }

    if (data.price !== undefined) {
      const numPrice = Number(data.price)
      if (isNaN(numPrice) || numPrice < 0) {
        throw new Error('商品价格不正确')
      }
    }

    const updateData = {}
    if (data.name !== undefined) updateData.name = String(data.name).trim()
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.icon !== undefined) updateData.icon = data.icon || '📦'
    if (data.description !== undefined)
      updateData.description = data.description || ''
    if (data.price !== undefined) updateData.price = Number(data.price)
    if (data.originalPrice !== undefined)
      updateData.originalPrice = Number(data.originalPrice) || existing.price
    if (data.salesCount !== undefined)
      updateData.salesCount = Number(data.salesCount) || 0
    if (data.status !== undefined)
      updateData.status = Number(data.status) === 0 ? 0 : 1
    if (data.isDefault !== undefined)
      updateData.isDefault =
        data.isDefault === true || data.isDefault === 'true' || data.isDefault === 1
    if (data.tags !== undefined)
      updateData.tags = Array.isArray(data.tags) ? data.tags : []
    if (data.sort !== undefined) updateData.sort = Number(data.sort) || 0

    const updated = super.update(id, updateData)
    return this.withCategoryInfo(this.normalizeProduct(updated))
  }

  toggleStatus(id, status) {
    const existing = this.findById(id)
    if (!existing) throw new Error('商品不存在')

    let target
    if (status !== undefined && status !== '') {
      target = Number(status) === 0 ? 0 : 1
    } else {
      target = Number(existing.status) === 1 ? 0 : 1
    }

    const updated = super.update(id, { status: target })
    return this.withCategoryInfo(this.normalizeProduct(updated))
  }

  batchToggleDefault(ids, isDefault) {
    const val = isDefault === true || isDefault === 'true' || isDefault === 1
    return this.batchUpdate(ids, { isDefault: val })
  }

  batchToggleStatus(ids, status) {
    const target = Number(status) === 0 ? 0 : 1
    return this.batchUpdate(ids, { status: target })
  }

  getDefaults(cityId = null) {
    let products = this.load()
      .map((p) => this.normalizeProduct(p))
      .filter((p) => p.isDefault && Number(p.status) === 1)

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
          return this.withCategoryInfoList(products)
        }
      }
    }

    products = products.sort((a, b) => (a.sort || 0) - (b.sort || 0))
    return this.withCategoryInfoList(products)
  }
}

module.exports = new ProductService()
