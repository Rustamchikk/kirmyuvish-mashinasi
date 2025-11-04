// database.js
const { Pool } = require('pg')
require('dotenv').config()

// Environment variables tekshiruvi
const requiredEnv = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME', 'DB_PORT']
for (const envVar of requiredEnv) {
	if (!process.env[envVar]) {
		console.error(`❌ Error: ${envVar} is not set in .env`)
		process.exit(1)
	}
}

// PostgreSQL pool
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
})

// Test connection
;(async () => {
	try {
		await pool.query('SELECT NOW()')
		console.log('✅ PostgreSQL connected successfully')
	} catch (err) {
		console.error('❌ PostgreSQL connection error:', err)
		process.exit(1)
	}
})()

module.exports = pool
