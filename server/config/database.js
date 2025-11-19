const { Pool } = require('pg')

const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL is not set')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

// Ulanishni tekshirish
(async () => {
  try {
    await pool.query('SELECT NOW()')
    console.log('✅ PostgreSQL connected successfully (Aiven)')
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err)
    process.exit(1)
  }
})()

module.exports = pool