const express = require('express')
const cors = require('cors')
const { clerkMiddleware } = require('@clerk/express')
const socialRoutes = require('./modules/social/social.routes')
const inventoryRoutes = require('./modules/inventory/inventory.routes')
const reviewRoutes = require('./modules/review/review.routes')
const discoveryRoutes = require('./modules/discovery/discovery.routes')
const userRoutes = require('./modules/user/user.routes')

const app = express()

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean)
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(clerkMiddleware())

app.use('/api/social', socialRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/discovery', discoveryRoutes)
app.use('/api/me', userRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({ message: err.message || 'Internal server error' })
})

module.exports = app
