const express = require('express')
const { readJson, writeJson, genId } = require('../utils/fileStorage')

const router = express.Router()
const FILE = 'storeProducts.json'
const PROD_FILE = 'products.json'
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

router.get('/', (req, res) => {
  tryInit()
  const { status, cityId, keyword } = req.query
  let list = readJson(FILE)
  const products = readJson(PROD_FILE)
  const cities = readJson(CITY_FILE)
  if (status !== undefined && status !== '') {
    list = list.filter((it) => Number(it.status) === Number(status))
  }
  if (cityId) {
    list = list.filter((it) => it.cityId === cityId)
  }
  if (keyword) {
    const kw = String(keyword).trim()
    list = list.filter((it) => {
      const p = products.find((x) => x.id === it.productId)
      return (p && p.name.includes(kw)) || (it.storeName && it.storeName.includes(kw))
    })
  }
  list = list.map((it) => {
    const p = products.find((x) => x.id === it.productId)
    const c = cities.find((x) => x.id === it.cityId)
    return {
      ...it,
      productName: p ? p.name : '',
      productImage: p ? p.image : '',
      productPrice: p ? p.price : 0,
      cityName: c ? c.name : ''
    }
  })
  list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  ok(res, list)
})

router.post('/:id/audit', (req, res) => {
  tryInit()
  const { pass, rejectReason } = req.body || {}
  const list = readJson(FILE)
  const idx = list.findIndex((it) => it.id === req.params.id)
  if (idx === -1) return fail(res, '审核记录不存在', 404)
  if (pass) {
    list[idx].status = 2
    list[idx].auditAt = new Date().toISOString()
    list[idx].rejectReason = ''
  } else {
    list[idx].status = 3
    list[idx].auditAt = new Date().toISOString()
    list[idx].rejectReason = rejectReason || ''
  }
  list[idx].updatedAt = new Date().toISOString()
  writeJson(FILE, list)
  ok(res, list[idx], pass ? '已通过' : '已拒绝')
})

module.exports = router
