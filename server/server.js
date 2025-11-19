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

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// ✅ ROOT ROUTE - BU MUAMMONI HAL QILADI
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Washing Machine Booking API is running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      bookings: '/api/bookings',
      machines: '/api/machines',
      admin: '/api/admin/auth/login'
    }
  })
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
  process.exit(1)
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'Connected'
  })
})

// Vercel serverless muhitida cron job ishlamasligi mumkin
if (process.env.NODE_ENV !== 'production') {
  const cron = require('node-cron')
  cron.schedule('0 23 * * 0', async () => {
    try {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      await db.query('DELETE FROM bookings WHERE booking_date < $1', [
        lastWeek.toISOString().split('T')[0],
      ])
      console.log('✅ Weekly cleanup completed')
    } catch (error) {
      console.error('❌ Weekly cleanup error:', error)
    }
  })
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
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
  })
}

module.exports = app