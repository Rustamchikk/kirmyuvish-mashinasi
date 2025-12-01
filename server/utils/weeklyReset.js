// server/utils/weeklyReset.js - YANGILANGAN VERSIYA
const pool = require('../config/database');
const cron = require('node-cron');
const moment = require('moment-timezone');

console.log('✅ weeklyReset.js fayli yuklandi');

// ✅ Haftalik reset holatini saqlash uchun jadval
const createResetLogTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekly_reset_logs (
        id SERIAL PRIMARY KEY,
        reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        users_deleted INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'success'
      )
    `);
    console.log('✅ Weekly reset logs jadvali yaratildi/tekshirildi');
  } catch (error) {
    console.error('❌ Reset logs jadvalini yaratishda xato:', error);
  }
};

// ✅ Oxirgi reset sanasini olish
const getLastResetDate = async () => {
  try {
    const result = await pool.query(
      'SELECT reset_date FROM weekly_reset_logs ORDER BY reset_date DESC LIMIT 1'
    );
    return result.rows[0]?.reset_date || null;
  } catch (error) {
    console.error('❌ Oxirgi reset sanasini olishda xato:', error);
    return null;
  }
};

// ✅ Haftalik tozalash funksiyasi
const resetWeeklyUsers = async () => {
  let connection;
  try {
    console.log('🔄 Haftalik reset boshlandi...');
    
    // Transaction boshlaymiz
    connection = await pool.connect();
    await connection.query('BEGIN');
    
    // Barcha userlarni o'chiramiz
    const deleteResult = await connection.query('DELETE FROM users RETURNING id');
    const deletedCount = deleteResult.rows.length;
    
    // Reset logini saqlaymiz
    await connection.query(
      'INSERT INTO weekly_reset_logs (users_deleted, status) VALUES ($1, $2)',
      [deletedCount, 'success']
    );
    
    await connection.query('COMMIT');
    console.log(`✅ Haftalik reset muvaffaqiyatli tamomlandi. ${deletedCount} ta foydalanuvchi o'chirildi.`);
    
    return { success: true, deletedCount };
    
  } catch (error) {
    if (connection) {
      await connection.query('ROLLBACK');
    }
    console.error('❌ Haftalik reset xatosi:', error);
    
    // Xatoni log qilamiz
    try {
      await pool.query(
        'INSERT INTO weekly_reset_logs (users_deleted, status) VALUES ($1, $2)',
        [0, 'failed']
      );
    } catch (logError) {
      console.error('❌ Xatoni log qilishda xato:', logError);
    }
    
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ✅ Server ishga tushganda avvalgi resetni tekshirish
const checkAndResetIfNeeded = async () => {
  try {
    console.log('🔍 Avvalgi haftalik reset tekshirilmoqda...');
    
    await createResetLogTable();
    
    const lastReset = await getLastResetDate();
    const now = moment().tz('Europe/Moscow');
    
    if (!lastReset) {
      console.log('📝 Birinchi reset logi mavjud emas. Reset log jadvali yaratildi.');
      return false;
    }
    
    const lastResetMoment = moment(lastReset).tz('Europe/Moscow');
    const daysSinceReset = now.diff(lastResetMoment, 'days');
    
    console.log(`📅 Oxirgi reset: ${lastResetMoment.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`📅 Joriy vaqt: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`📅 Oxirgi resetdan beri: ${daysSinceReset} kun`);
    
    // Agar oxirgi reset 7 kundan ko'p bo'lsa, avtomatik reset qilamiz
    if (daysSinceReset >= 7) {
      console.log('⚠️ Oxirgi reset 7 kundan ko\'p bo\'ldi. Avtomatik reset bajarilmoqda...');
      await resetWeeklyUsers();
      return true;
    }
    
    console.log('✅ Oxirgi reset yangi. Qoshimcha reset kerak emas.');
    return false;
    
  } catch (error) {
    console.error('❌ Reset tekshirishda xato:', error);
    return false;
  }
};

// ✅ CRON Job - Har dushanba ertalab 00:00 da (Moscow vaqti)
const startWeeklyResetJob = async () => {
  try {
    console.log('🔄 Haftalik reset CRON job sozlanmoqda...');
    
    // Avval reset jadvalini yaratamiz
    await createResetLogTable();
    
    // Server ishga tushganda avvalgi resetni tekshiramiz
    await checkAndResetIfNeeded();
    
    // Har dushanba ertalab 00:00 da reset qilish
    cron.schedule('0 0 * * 1', async () => {
      console.log('⏰ Haftalik reset CRON job ishga tushdi (Dushanba 00:00 Moscow vaqti)...');
      
      try {
        await resetWeeklyUsers();
        console.log('✅ CRON job orqali haftalik reset muvaffaqiyatli tamomlandi');
      } catch (error) {
        console.error('❌ CRON job resetda xato:', error);
      }
    }, {
      timezone: "Europe/Moscow",
      scheduled: true
    });
    
    console.log('✅ Haftalik reset CRON job muvaffaqiyatli sozlandi');
    return true;
    
  } catch (error) {
    console.error('❌ CRON job ishga tushirishda xato:', error);
    return false;
  }
};

module.exports = {
  resetWeeklyUsers,
  startWeeklyResetJob,
  checkAndResetIfNeeded,
  getLastResetDate
};