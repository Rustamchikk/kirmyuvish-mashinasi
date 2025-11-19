// Faqat local development uchun dotenv
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// PostgreSQL connect
const db = require('./config/database')

const app = express()

// ✅ MUHIM: Trust proxy qo'shing (Vercel uchun)
app.set('trust proxy', 1)

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://*.vercel.app'
  ],
  credentials: true
}))
app.use(express.json())

// Rate limiting - ENDI ISHLAYDI
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// ✅ ROOT ROUTE
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Washing Machine Booking API is running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// ✅ HEALTH CHECK
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT NOW()')
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'Connected'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    })
  }
})

// Routes
try {
  app.use('/api/users', require('./routes/users'))
  app.use('/api/bookings', require('./routes/bookings'))
  app.use('/api/machines', require('./routes/machines'))
  app.use('/api/admin/auth', require('./routes/adminAuth'))
  app.use('/api/admin/monitoring', require('./routes/adminMonitoring'))
  app.use('/api/admin', require('./routes/adminUsers'));
} catch (err) {
  console.error('Route import error:', err)
  // process.exit(1) // <- BUNI OLIB TASHLANG, server crash qilmasin
}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack)
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  })
})

// 404 handling
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl
  })
})

// Server port
const PORT = process.env.PORT || 5001

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`)
  })
}

module.exports = app