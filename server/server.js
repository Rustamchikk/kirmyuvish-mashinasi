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

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
	// ✅ Yaxshi - faqat environment variables
	windowMs: process.env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
	max: process.env.RATE_LIMIT_MAX,
	standardHeaders: true,
	legacyHeaders: false,
})
app.use(limiter)

// Routes
try {
	app.use('/api/users', require('./routes/users'))
	app.use('/api/bookings', require('./routes/bookings'))
	app.use('/api/machines', require('./routes/machines'))
	app.use('/api/admin/auth', require('./routes/adminAuth'))
	app.use('/api/admin/monitoring', require('./routes/adminMonitoring'))
	app.use('/api/admin', require('./routes/adminUsers'));
	// app.use('/api/admin', require('./routes/adminUsers'))
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
	})
})

// Cron job
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
app.use('*', (req, res) => {
	res.status(404).json({
		success: false,
		message: 'Route not found',
		requestedUrl: req.originalUrl // Qaysi URL so'ralayotganini ko'rish uchun
	})
})

// Server port
const PORT = process.env.PORT
app.listen(PORT, () => {
	console.log(`✅ Server is running on port ${PORT}`)
	// console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
	// console.log(`🔗 Admin auth: http://localhost:${PORT}/api/admin/auth/login`)
})