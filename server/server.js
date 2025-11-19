const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
require('dotenv').config()

const { pool, testConnection } = require('./config/database')

const app = express()

// Vercel uchun trust proxy
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

// Favicon xatosini oldini olish
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.get('/favicon.png', (req, res) => {
    res.status(204).end();
});

// VAQTINCHA database middleware ni o'chiring
// app.use(async (req, res, next) => {
//     try {
//         await pool.query('SELECT 1');
//         next();
//     } catch (error) {
//         console.error('Database connection lost:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Database connection error'
//         });
//     }
// });

// Asosiy route
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: "Washing Machine Booking API is running",
        version: "1.0.0"
    })
})

// Database test route
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            success: true, 
            time: result.rows[0].now,
            message: 'Database connected successfully'
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            code: error.code
        });
    }
});

// Boshqa routelar - database bilan ishlaydiganlar
app.use('/api/users', require('./routes/users'))
app.use('/api/bookings', require('./routes/bookings'))
app.use('/api/machines', require('./routes/machines'))
app.use('/api/admin/auth', require('./routes/adminAuth'))
app.use('/api/admin/monitoring', require('./routes/adminMonitoring'))
app.use('/api/admin', require('./routes/adminUsers'))

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "Server is running" })
})

module.exports = app;