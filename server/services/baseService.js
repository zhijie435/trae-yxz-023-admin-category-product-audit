const { readJson, writeJson, genId } = require('../utils/fileStorage')

class BaseService {
  constructor(fileName, idPrefix) {
    this.fileName = fileName
    this.idPrefix = idPrefix
  }

  load() {
    return readJson(this.fileName)
  }

  save(list) {
    return writeJson(this.fileName, list)
  }

  genId() {
    return genId(this.idPrefix)
  }

  findAll(filters = {}) {
    let list = this.load()
    if (filters.keyword) {
      const kw = String(filters.keyword).trim()
      list = list.filter((item) =>
        (item.name && item.name.includes(kw)) ||
        (item.description && item.description.includes(kw))
      )
    }
    if (filters.status !== undefined && filters.status !== '') {
      list = list.filter((item) => Number(item.status) === Number(filters.status))
    }
    return list
  }

  findById(id) {
    const list = this.load()
    return list.find((item) => item.id === id) || null
  }

  create(data) {
    const list = this.load()
    const now = new Date().toISOString()
    const item = {
      id: this.genId(),
      ...data,
      createdAt: now,
      updatedAt: now
    }
    list.push(item)
    this.save(list)
    return item
  }

  update(id, data) {
    const list = this.load()
    const idx = list.findIndex((item) => item.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    list[idx] = { ...list[idx], ...data, updatedAt: now }
    this.save(list)
    return list[idx]
  }

  remove(id) {
    const list = this.load()
    const idx = list.findIndex((item) => item.id === id)
    if (idx === -1) return null
    const removed = list.splice(idx, 1)[0]
    this.save(list)
    return removed
  }

  batchUpdate(ids, data) {
    const list = this.load()
    const now = new Date().toISOString()
    let count = 0
    ids.forEach((id) => {
      const idx = list.findIndex((item) => item.id === id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data, updatedAt: now }
        count++
      }
    })
    this.save(list)
    return { count }
  }

  batchRemove(ids) {
    const list = this.load()
    const idSet = new Set(ids)
    const before = list.length
    const newList = list.filter((item) => !idSet.has(item.id))
    this.save(newList)
    return { count: before - newList.length }
  }

  sort(items) {
    const list = this.load()
    const now = new Date().toISOString()
    let updated = 0
    items.forEach((it) => {
      if (!it || !it.id) return
      const idx = list.findIndex((item) => item.id === it.id)
      if (idx !== -1) {
        if (it.sort !== undefined) list[idx].sort = Number(it.sort) || 0
        list[idx].updatedAt = now
        updated++
      }
    })
    this.save(list)
    return { count: updated }
  }

  getMaxSort(filterFn) {
    const list = this.load()
    const filtered = filterFn ? list.filter(filterFn) : list
    return filtered.reduce((max, item) => Math.max(max, item.sort || 0), -1)
  }
}

module.exports = BaseService
