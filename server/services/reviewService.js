const BaseService = require('./baseService')
const productService = require('./productService')
const cityProductService = require('./cityProductService')
const categoryService = require('./categoryService')
const { readJson } = require('../utils/fileStorage')

const REVIEW_FILE = 'storeProductReviews.json'
const CAT_FILE = 'categories.json'
const CITY_FILE = 'cities.json'

const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

class ReviewService extends BaseService {
  constructor() {
    super(REVIEW_FILE, 'spr')
  }

  normalizeTags(tags) {
    return Array.isArray(tags) ? tags : []
  }

  isCityFranchised(city) {
    if (!city) return false
    const val = city.isFranchised !== undefined ? city.isFranchised : city.isFranchise
    return val === true || val === 1 || val === '1'
  }

  withExtraInfo(review) {
    const cats = readJson(CAT_FILE)
    const cities = readJson(CITY_FILE)

    const cat = cats.find((c) => c.id === review.categoryId)
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

    const city = cities.find((c) => c.id === review.cityId)
    const cityName = city ? city.name : ''
    const isFranchise = city ? this.isCityFranchised(city) : false

    const tags = this.normalizeTags(review.tags)
    const price = Number(review.price) || 0
    const originalPrice = Number(review.originalPrice) || price

    return {
      ...review,
      tags,
      price,
      originalPrice,
      categoryName,
      parentCategoryName,
      fullCategoryName,
      cityName,
      isFranchise
    }
  }

  withExtraInfoList(list) {
    return list.map((item) => this.withExtraInfo(item))
  }

  findAll(filters = {}) {
    let list = this.load()

    if (filters.keyword) {
      const kw = String(filters.keyword).trim()
      list = list.filter(
        (it) =>
          (it.name && it.name.includes(kw)) ||
          (it.description && it.description.includes(kw))
      )
    }

    if (filters.cityId) {
      list = list.filter((it) => it.cityId === filters.cityId)
    }

    if (filters.reviewStatus && filters.reviewStatus !== '') {
      list = list.filter((it) => it.reviewStatus === filters.reviewStatus)
    }

    return list.sort((a, b) =>
      (a.submittedAt || a.createdAt) < (b.submittedAt || b.createdAt) ? 1 : -1
    )
  }

  findById(id) {
    const list = this.load()
    const item = list.find((it) => it.id === id)
    if (!item) return null
    return this.withExtraInfo(item)
  }

  getStats() {
    const list = this.load()
    return {
      total: list.length,
      pending: list.filter((it) => it.reviewStatus === REVIEW_STATUS.PENDING).length,
      approved: list.filter((it) => it.reviewStatus === REVIEW_STATUS.APPROVED).length,
      rejected: list.filter((it) => it.reviewStatus === REVIEW_STATUS.REJECTED).length
    }
  }

  create(data) {
    const {
      cityId,
      name,
      categoryId,
      icon,
      description,
      price,
      originalPrice,
      tags
    } = data

    if (!name || !String(name).trim()) {
      throw new Error('商品名称不能为空')
    }
    if (!cityId) {
      throw new Error('请选择提交城市')
    }
    if (!categoryId) {
      throw new Error('请选择商品分类')
    }

    const cat = categoryService.findById(categoryId)
    if (!cat) throw new Error('所选分类不存在')

    const city = cityProductService.getCityById(cityId)
    if (!city) throw new Error('所选城市不存在')

    const now = new Date().toISOString()
    const numPrice = Number(price) || 0

    const item = super.create({
      cityId: String(cityId),
      name: String(name).trim(),
      categoryId: String(categoryId),
      icon: icon || '📦',
      description: description || '',
      price: numPrice,
      originalPrice: originalPrice ? Number(originalPrice) : numPrice,
      tags: this.normalizeTags(tags),
      reviewStatus: REVIEW_STATUS.PENDING,
      reviewRemark: '',
      submittedAt: now,
      reviewedAt: '',
      productId: ''
    })

    return this.withExtraInfo(item)
  }

  approve(id, reviewRemark = '') {
    const list = this.load()
    const idx = list.findIndex((it) => it.id === id)
    if (idx === -1) throw new Error('审核记录不存在')

    const item = list[idx]
    if (item.reviewStatus === REVIEW_STATUS.APPROVED) {
      throw new Error('该申请已通过审核，无需重复操作')
    }

    const now = new Date().toISOString()

    const newProduct = productService.create({
      name: item.name,
      categoryId: item.categoryId,
      icon: item.icon || '📦',
      description: item.description || '',
      price: Number(item.price) || 0,
      originalPrice: Number(item.originalPrice) || Number(item.price) || 0,
      salesCount: 0,
      status: 1,
      isDefault: true,
      tags: this.normalizeTags(item.tags)
    })

    try {
      cityProductService.create({
        cityId: item.cityId,
        productId: newProduct.id,
        status: 1
      })
    } catch (e) {
      if (!e.message.includes('已配置')) {
        throw e
      }
    }

    item.reviewStatus = REVIEW_STATUS.APPROVED
    item.reviewRemark = reviewRemark || ''
    item.reviewedAt = now
    item.productId = newProduct.id
    item.updatedAt = now
    list[idx] = item
    this.save(list)

    return this.withExtraInfo(item)
  }

  reject(id, reviewRemark) {
    if (!reviewRemark || !String(reviewRemark).trim()) {
      throw new Error('驳回原因不能为空')
    }

    const list = this.load()
    const idx = list.findIndex((it) => it.id === id)
    if (idx === -1) throw new Error('审核记录不存在')

    const item = list[idx]
    if (item.reviewStatus === REVIEW_STATUS.REJECTED) {
      throw new Error('该申请已被驳回，无需重复操作')
    }

    const now = new Date().toISOString()
    item.reviewStatus = REVIEW_STATUS.REJECTED
    item.reviewRemark = String(reviewRemark).trim()
    item.reviewedAt = now
    item.productId = ''
    item.updatedAt = now
    list[idx] = item
    this.save(list)

    return this.withExtraInfo(item)
  }

  resubmit(id, data) {
    const list = this.load()
    const idx = list.findIndex((it) => it.id === id)
    if (idx === -1) throw new Error('审核记录不存在')

    const item = list[idx]
    if (item.reviewStatus !== REVIEW_STATUS.REJECTED) {
      throw new Error('只有被驳回的申请才能重新提交')
    }

    const now = new Date().toISOString()

    if (data.name !== undefined) item.name = String(data.name).trim()
    if (data.categoryId !== undefined) item.categoryId = String(data.categoryId)
    if (data.icon !== undefined) item.icon = data.icon || '📦'
    if (data.description !== undefined) item.description = data.description || ''
    if (data.price !== undefined) item.price = Number(data.price) || 0
    if (data.originalPrice !== undefined)
      item.originalPrice = Number(data.originalPrice) || item.price
    if (data.tags !== undefined) item.tags = this.normalizeTags(data.tags)

    item.reviewStatus = REVIEW_STATUS.PENDING
    item.reviewRemark = ''
    item.submittedAt = now
    item.reviewedAt = ''
    item.productId = ''
    item.updatedAt = now

    list[idx] = item
    this.save(list)

    return this.withExtraInfo(item)
  }
}

module.exports = new ReviewService()
