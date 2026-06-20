const BaseService = require('./baseService')
const { readJson } = require('../utils/fileStorage')

const CAT_FILE = 'categories.json'
const PROD_FILE = 'products.json'

class CategoryService extends BaseService {
  constructor() {
    super(CAT_FILE, 'cat')
  }

  isRoot(category) {
    if (!category) return false
    const pid = category.parentId
    return pid === null || pid === undefined || pid === 'null' || pid === ''
  }

  buildTree(list, options = {}) {
    const { onlyActive = true, maxLevel = 0 } = options
    let nodes = [...list].sort((a, b) => (a.sort || 0) - (b.sort || 0))

    if (onlyActive) {
      nodes = nodes.filter((c) => Number(c.status) === 1)
    }

    const map = new Map()
    nodes.forEach((node) => {
      map.set(node.id, { ...node, children: [] })
    })

    const roots = []
    map.forEach((node) => {
      if (this.isRoot(node)) {
        roots.push(node)
      } else {
        const parent = map.get(node.parentId)
        if (parent) {
          parent.children.push(node)
        } else {
          roots.push(node)
        }
      }
    })

    function filterByLevel(nodes, level) {
      if (maxLevel > 0 && level > maxLevel) return []
      return nodes.map((node) => ({
        ...node,
        children: filterByLevel(node.children, level + 1)
      }))
    }

    return filterByLevel(roots, 1)
  }

  getLevel(category) {
    if (!category) return 0
    let level = 1
    let current = category
    const list = this.load()
    while (current && !this.isRoot(current)) {
      const parent = list.find((c) => c.id === current.parentId)
      if (!parent) break
      current = parent
      level++
    }
    return level
  }

  getChildren(parentId) {
    const list = this.load()
    return list
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }

  getDescendants(parentId) {
    const list = this.load()
    const result = []
    const stack = [parentId]
    while (stack.length > 0) {
      const id = stack.pop()
      const children = list.filter((c) => c.parentId === id)
      children.forEach((c) => {
        result.push(c)
        stack.push(c.id)
      })
    }
    return result
  }

  getAncestors(id) {
    const list = this.load()
    const result = []
    let current = list.find((c) => c.id === id)
    while (current && !this.isRoot(current)) {
      const parent = list.find((c) => c.id === current.parentId)
      if (!parent) break
      result.unshift(parent)
      current = parent
    }
    return result
  }

  getPath(id) {
    const ancestors = this.getAncestors(id)
    const current = this.findById(id)
    if (current) ancestors.push(current)
    return ancestors
  }

  getPathNames(id) {
    return this.getPath(id).map((c) => c.name)
  }

  hasChildren(id) {
    const list = this.load()
    return list.some((c) => c.parentId === id)
  }

  hasProducts(id) {
    const products = readJson(PROD_FILE)
    const childIds = this.getDescendants(id).map((c) => c.id)
    const allIds = [id, ...childIds]
    return products.some((p) => allIds.includes(p.categoryId))
  }

  create(data) {
    const list = this.load()
    const { name, parentId, icon, description, status, sort } = data

    if (!name || !String(name).trim()) {
      throw new Error('分类名称不能为空')
    }

    const isRoot = parentId === null || parentId === undefined || parentId === 'null' || parentId === ''
    const effectiveParentId = isRoot ? null : parentId

    if (!isRoot) {
      const parent = list.find((c) => c.id === parentId)
      if (!parent) throw new Error('父分类不存在')
    }

    const siblings = isRoot
      ? list.filter((c) => this.isRoot(c))
      : list.filter((c) => c.parentId === effectiveParentId)

    const maxSort = siblings.reduce((m, c) => Math.max(m, c.sort || 0), -1)

    return super.create({
      name: String(name).trim(),
      parentId: effectiveParentId,
      icon: icon || '',
      description: description || '',
      sort: sort !== undefined ? Number(sort) : maxSort + 1,
      status: status === 0 ? 0 : 1
    })
  }

  update(id, data) {
    const existing = this.findById(id)
    if (!existing) throw new Error('分类不存在')

    if (data.name !== undefined && !String(data.name).trim()) {
      throw new Error('分类名称不能为空')
    }

    const updateData = {}
    if (data.name !== undefined) updateData.name = String(data.name).trim()
    if (data.icon !== undefined) updateData.icon = data.icon || ''
    if (data.description !== undefined) updateData.description = data.description || ''
    if (data.status !== undefined) updateData.status = Number(data.status) === 0 ? 0 : 1
    if (data.sort !== undefined) updateData.sort = Number(data.sort) || 0

    return super.update(id, updateData)
  }

  move(id, newParentId) {
    const item = this.findById(id)
    if (!item) throw new Error('分类不存在')

    const isNewRoot = newParentId === null || newParentId === undefined || newParentId === 'null' || newParentId === ''
    const effectiveParentId = isNewRoot ? null : newParentId

    if (!isNewRoot) {
      const newParent = this.findById(newParentId)
      if (!newParent) throw new Error('目标父分类不存在')

      const descendants = this.getDescendants(id).map((d) => d.id)
      if (descendants.includes(newParentId) || id === newParentId) {
        throw new Error('不能移动到自身或子孙分类下')
      }
    }

    return super.update(id, { parentId: effectiveParentId })
  }

  remove(id) {
    const item = this.findById(id)
    if (!item) throw new Error('分类不存在')

    if (this.hasChildren(id)) {
      throw new Error('该分类下存在子分类，请先删除子分类')
    }

    if (this.hasProducts(id)) {
      throw new Error('该分类下存在商品，请先移动或删除商品')
    }

    return super.remove(id)
  }

  findAll(filters = {}) {
    let list = super.findAll(filters)

    if (filters.parentId !== undefined && filters.parentId !== '') {
      if (filters.parentId === 'null' || filters.parentId === null) {
        list = list.filter((c) => this.isRoot(c))
      } else {
        list = list.filter((c) => c.parentId === filters.parentId)
      }
    }

    if (filters.level !== undefined && filters.level !== '') {
      list = list.filter((c) => this.getLevel(c) === Number(filters.level))
    }

    return list.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }

  getTree(options = {}) {
    const list = this.load()
    return this.buildTree(list, options)
  }
}

module.exports = new CategoryService()
