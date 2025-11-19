const { Pool } = require('pg')

// Vercel uchun POSTGRES_URL dan foydalanish
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL is not set')
  process.exit(1)
}

const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false } // Aiven SSL talab qiladi
});

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