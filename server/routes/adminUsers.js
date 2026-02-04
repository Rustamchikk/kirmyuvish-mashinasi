const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Foydalanuvchini o'chirish
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
   

    // Foydalanuvchi mavjudligini tekshirish
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }
    // Avval bog'liq ma'lumotlarni o'chirish (CASCADE ishlamasa)
    try {
      await pool.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM weekly_limits WHERE user_id = $1', [userId]);
    } catch (error) {
    }

    // Foydalanuvchini o'chirish
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

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
router.delete('/', async (req, res) => {
  try {
    // Avval bog'liq ma'lumotlarni o'chirish
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM weekly_limits');
    
    // Keyin foydalanuvchilarni o'chirish
    await pool.query('DELETE FROM users');
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