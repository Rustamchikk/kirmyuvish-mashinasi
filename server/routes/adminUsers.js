const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Foydalanuvchini o'chirish
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔄 Foydalanuvchi o\'chirish so\'rovi:', userId);

    // Foydalanuvchi mavjudligini tekshirish
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Foydalanuvchi topilmadi:', userId);
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }

    console.log('✅ Foydalanuvchi topildi:', userCheck.rows[0].full_name);

    // Avval bog'liq ma'lumotlarni o'chirish (CASCADE ishlamasa)
    try {
      await pool.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM weekly_limits WHERE user_id = $1', [userId]);
      console.log('✅ Bog\'liq ma\'lumotlar o\'chirildi');
    } catch (error) {
      console.log('⚠️ Bog\'liq ma\'lumotlar o\'chirilmadi, lekin davom etamiz:', error.message);
    }

    // Foydalanuvchini o'chirish
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('✅ Foydalanuvchi o\'chirildi');

    res.json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi'
    });

  } catch (error) {
    console.error('❌ Foydalanuvchini o\'chirish xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi: ' + error.message
    });
  }
});

// Barcha foydalanuvchilarni o'chirish
router.delete('/users', async (req, res) => {
  try {
    console.log('🔄 Barcha foydalanuvchilarni o\'chirish so\'rovi');

    // Avval bog'liq ma'lumotlarni o'chirish
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM weekly_limits');
    
    // Keyin foydalanuvchilarni o'chirish
    await pool.query('DELETE FROM users');

    console.log('✅ Barcha foydalanuvchilar o\'chirildi');

    res.json({
      success: true,
      message: 'Barcha foydalanuvchilar muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    console.error('❌ Barcha foydalanuvchilarni o\'chirish xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi: ' + error.message
    });
  }
});

module.exports = router;