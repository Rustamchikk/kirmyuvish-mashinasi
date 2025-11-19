const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.POSTGRES_URL) {
    console.error("❌ Error: POSTGRES_URL is not set in environment variables");
    console.log("Available environment variables:", Object.keys(process.env));
}

// Aiven uchun SSL sozlamalari
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false // Aiven self-signed certificate uchun
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
});

// Connection test function
const testConnection = async () => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected successfully (Aiven)');
        console.log('Database time:', result.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ PostgreSQL connection error:', err.message);
        console.error('Error code:', err.code);
        return false;
    } finally {
        if (client) client.release();
    }
};

// Ilova ishga tushganda connection ni test qilish
testConnection();

module.exports = {
    pool,
    testConnection
};