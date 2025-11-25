// server.js - YANGILANGAN VERSIYA
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

// ✅ Haftalik tozalash import qilish
const { startWeeklyResetJob } = require('./utils/weeklyReset')

// ✅ YANGI: Database initialization import qilish
const initDatabase = require('./initdatabase')

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

// ✅ YANGI: Database initialization ni ishga tushirish
const initializeApp = async () => {
    try {
        console.log('🚀 Database initialization boshlandi...');
        await initDatabase();
        console.log('✅ Database initialization muvaffaqiyatli tugadi');
        
    } catch (error) {
        console.error('❌ Database initialization xatosi:', error);
        // Xatolik bo'lsa ham server ishlashda davom etsin
    } finally {
        // Route'larni yuklash va server ni ishga tushirish
        loadRoutes();
        startServer();
    }
};

// Route'larni yuklash funksiyasi
const loadRoutes = () => {
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

    // ✅ YANGI: Admin users history route
    try {
        console.log('🔄 Loading admin users history route...');
        app.use('/api/admin/history', require('./routes/adminUsersHistory'));
        console.log('✅ Admin users history route loaded');
    } catch (err) {
        console.error('❌ Admin users history route error:', err.message);
    }

    console.log('=== ROUTE LOADING COMPLETE ===');
};

// Server ni ishga tushirish
const startServer = () => {
    // Health check
    app.get('/api/health', async (req, res) => {
        try {
            // Database connection ni tekshiramiz
            const dbCheck = await db.query('SELECT NOW() as current_time');
            
            res.json({
                success: true,
                message: 'Server is running',
                timestamp: new Date().toISOString(),
                database: {
                    status: 'connected',
                    current_time: dbCheck.rows[0].current_time
                },
                features: {
                    login_limit: '4 attempts + 4 minutes block',
                    weekly_reset: 'active',
                    archive: 'usersadmin active'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Database connection error',
                error: error.message
            });
        }
    });

    // ✅ Haftalik tozalash job ni ishga tushirish
    console.log('🔄 Haftalik reset job ishga tushirilmoqda...');
    startWeeklyResetJob();

    // Cron job (Eski - bookings tozalash)
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

    // Error handling
    app.use((err, req, res, next) => {
        console.error('❌ Error:', err.stack)
        res.status(500).json({
            success: false,
            message: 'Something went wrong!',
        })
    })

    // 404 handling
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
            requestedUrl: req.originalUrl
        })
    })

    // Server port
    const PORT = process.env.PORT || 5001
    console.log(`🔄 Server starting on port ${PORT}...`);

    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`)
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
        console.log('💾 Database: PostgreSQL connected with login tracking')
    })
};

// ✅ App ni ishga tushirish
initializeApp();