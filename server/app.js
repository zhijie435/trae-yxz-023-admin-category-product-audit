const express = require('express')
const cors = require('cors')
const categoryRoutes = require('./routes/categoryRoutes')
const recommendRoutes = require('./routes/recommendRoutes')

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { status: 'running' }
  })
})

app.use('/api/categories', categoryRoutes)
app.use('/api/recommends', recommendRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

module.exports = app
