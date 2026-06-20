const express = require('express')
const cors = require('cors')

const categoryRoutes = require('./routes/categoryRoutes')
const recommendRoutes = require('./routes/recommendRoutes')
const productRoutes = require('./routes/productRoutes')
const cityProductRoutes = require('./routes/cityProductRoutes')
const storeProductRoutes = require('./routes/storeProductRoutes')

const app = express()
const PORT = process.env.PORT || 3003

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'up', time: new Date().toISOString() } })
})

app.use('/api/categories', categoryRoutes)
app.use('/api/recommends', recommendRoutes)
app.use('/api/products', productRoutes)
app.use('/api/city-products', cityProductRoutes)
app.use('/api/store-products', storeProductRoutes)

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

app.use((err, req, res, next) => {
  console.error('[server error]', err)
  res.status(500).json({ code: 500, message: err.message || '服务器内部错误', data: null })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] 分类管理后端已启动: http://localhost:${PORT}`)
  })
}

module.exports = app
