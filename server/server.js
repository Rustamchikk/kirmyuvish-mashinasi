const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

// PostgreSQL
const db = require('./config/database')

// Models
const Booking = require('./models/Booking')
const WeeklyLimit = require('./models/WeeklyLimit')

const app = express()

/* -------------------------
   1. CORS (Helmetdan oldin!)
-------------------------- */
app.use(cors({
    origin: [
        "https://kirmyuvish-mashinasi.vercel.app",
        "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}))

// OPTIONS preflight fix
app.options("*", cors())

/* -------------------------
   2. Helmet (CORSdan keyin!)
-------------------------- */
app.use(helmet({
    crossOriginResourcePolicy: false
}))

// JSON parser
app.use(express.json())

/* -------------------------
   3. Rate Limiting
-------------------------- */
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(limiter)

/* -------------------------
   4. Routes
-------------------------- */
try {
    app.use('/api/users', require('./routes/users'))
    app.use('/api/bookings', require('./routes/bookings'))
    app.use('/api/machines', require('./routes/machines'))
    app.use('/api/admin/auth', require('./routes/adminAuth'))
    app.use('/api/admin/monitoring', require('./routes/adminMonitoring'))
    app.use('/api/admin', require('./routes/adminUsers'))
} catch (err) {
    console.error('Route import error:', err)
    process.exit(1)
}

/* -------------------------
   5. Health Check
-------------------------- */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    })
})

/* -------------------------
   6. Cron Jobs
-------------------------- */
const cron = require('node-cron')
cron.schedule('0 23 * * 0', async () => {
    try {
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        await db.query('DELETE FROM bookings WHERE booking_date < $1', [
            lastWeek.toISOString().split('T')[0],
        ])
        await WeeklyLimit.resetWeeklyLimits()
        console.log('✅ Weekly cleanup completed')
    } catch (error) {
        console.error('❌ Weekly cleanup error:', error)
    }
})

/* -------------------------
   7. Error Handler
-------------------------- */
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack)
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
    })
})

/* -------------------------
   8. 404
-------------------------- */
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        requestedUrl: req.originalUrl
    })
})

/* -------------------------
   9. Start Server
-------------------------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
})
