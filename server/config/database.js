const { Pool } = require('pg');
require('dotenv').config();

// Environment variable tekshirish
if (!process.env.POSTGRES_URL) {
    console.error("❌ Error: POSTGRES_URL is not set in environment variables");
    console.log("Available environment variables:", Object.keys(process.env));
    // process.exit(1); // Vercelda exit qilma, faqat log qil
}

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { 
        rejectUnauthorized: false 
    },
    // Connection settings qo'shing
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

// Connection test function
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected successfully (Aiven, URL)');
        console.log('Database time:', result.rows[0].now);
        client.release();
        return true;
    } catch (err) {
        console.error('❌ PostgreSQL connection error:', err.message);
        console.error('Connection string:', process.env.POSTGRES_URL ? 'Exists' : 'Missing');
        return false;
    }
};

// Ilova ishga tushganda connection ni test qilish
if (process.env.NODE_ENV !== 'production') {
    testConnection();
}

module.exports = {
    pool,
    testConnection
};