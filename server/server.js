const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const db = require('./config/database')

const Booking = require('./models/Booking')
const WeeklyLimit = require('./models/WeeklyLimit')

const app = express()

// MUHIM: Trust proxy qo'shing (Vercel uchun)
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({
    origin: [
        "https://kirmyuvish-mashinasi.vercel.app",
        "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}))
app.use(express.json())

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
})
app.use(limiter)

// ASOSIY ROUTE QO'SHING
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: "Washing Machine Booking API is running",
        version: "1.0.0"
    })
})

app.use('/api/users', require('./routes/users'))
app.use('/api/bookings', require('./routes/bookings'))
app.use('/api/machines', require('./routes/machines'))
app.use('/api/admin/auth', require('./routes/adminAuth'))
app.use('/api/admin/monitoring', require('./routes/adminMonitoring'))
app.use('/api/admin', require('./routes/adminUsers'))

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "Server is running" })
})

module.exports = app