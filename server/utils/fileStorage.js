const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName)
  ensureDir(DATA_DIR)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

function writeJson(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName)
  ensureDir(DATA_DIR)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return data
}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

module.exports = {
  readJson,
  writeJson,
  genId,
  DATA_DIR
}
