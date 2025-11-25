// server/utils/weeklyReset.js - YANGILANGAN MOSCOW VAQTI BILAN
const pool = require('../config/database');
const cron = require('node-cron');

console.log('✅ weeklyReset.js fayli yuklandi');

// ✅ Haftalik tozalash funksiyasi
const resetWeeklyUsers = async () => {
  try {
    console.log('🔄 Haftalik reset boshlandi...');
    
    // Barcha userlarni o'chiramiz
    const result = await pool.query('DELETE FROM users');
    console.log('✅ Haftalik reset muvaffaqiyatli tamomlandi');
    
  } catch (error) {
    console.error('❌ Haftalik reset xatosi:', error);
    throw error;
  }
};

// ✅ CRON Job - Yakshanbadan dushanbaga o'tish kechasi 00:00 da ishlaydi (Moscow vaqti bilan)
const startWeeklyResetJob = () => {
  try {
    console.log('🔄 Haftalik reset CRON job sozlanmoqda...');
    
    // Har yakshanba kechasi 23:59:59 dan keyin dushanba 00:00:00 da (Moscow vaqti bilan)
    cron.schedule('0 0 * * 1', async () => {
      console.log('⏰ Haftalik reset CRON job ishga tushdi (Dushanba 00:00 Moscow vaqti)...');
      await resetWeeklyUsers();
    }, {
      timezone: "Europe/Moscow"
    });
    return true;
    
  } catch (error) {
    console.error('❌ CRON job ishga tushirishda xato:', error);
    return false;
  }
};

module.exports = {
  resetWeeklyUsers,
  startWeeklyResetJob
};