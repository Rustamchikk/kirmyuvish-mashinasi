const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.POSTGRES_URL) {
    console.error("❌ Error: POSTGRES_URL is not set in environment variables");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected successfully (Aiven, URL)');
    } catch (err) {
        console.error('❌ PostgreSQL connection error:', err);
        process.exit(1);
    }
})();

module.exports = pool;
