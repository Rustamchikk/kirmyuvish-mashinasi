const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

// PostgreSQL connect
const db = require('./config/database')

// Models
const Booking = require('./models/Booking')
const WeeklyLimit = require('./models/WeeklyLimit')

const app = express()
app.set("trust proxy", 1);

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(limiter)

// 🔹 DEBUG: Har bir route ni alohida yuklash
console.log('=== ROUTE LOADING START ===');

try {
    console.log('🔄 Loading users route...');
    app.use('/api/users', require('./routes/users'));
    console.log('✅ Users route loaded');
} catch (err) {
    console.error('❌ Users route error:', err.message);
}

try {
    console.log('🔄 Loading bookings route...');
    app.use('/api/bookings', require('./routes/bookings'));
    console.log('✅ Bookings route loaded');
} catch (err) {
    console.error('❌ Bookings route error:', err.message);
}

try {
    console.log('🔄 Loading machines route...');
    app.use('/api/machines', require('./routes/machines'));
    console.log('✅ Machines route loaded');
} catch (err) {
    console.error('❌ Machines route error:', err.message);
}

// Admin routes
try {
    console.log("➡️ adminAuth route yuklanmoqda");
    const adminAuthRoute = require('./routes/adminAuth');
    console.log("✔️ adminAuth route yuklandi");
    app.use('/api/admin/auth', adminAuthRoute);
    console.log("✔️ adminAuth marshrutiga ulandi");
} catch (err) {
    console.error('❌ Admin auth route error:', err);
}

try {
    app.use('/api/admin/monitoring', require('./routes/adminMonitoring'));
    console.log('✅ Admin monitoring route loaded');
} catch (err) {
    console.error('❌ Admin monitoring route error:', err);
}

try {
    app.use('/api/admin/users', require('./routes/adminUsers'));
    console.log('✅ Admin users route loaded');
} catch (err) {
    console.error('❌ Admin users route error:', err);
}

console.log('=== ROUTE LOADING COMPLETE ===');

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    })
})

// Cron job va qolgan kod...