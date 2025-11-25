// routes/adminUsersHistory.js - YANGILANGAN VERSIYA (USERSADMIN ARXIVI BILAN)
const express = require('express')
const router = express.Router()
const db = require('../config/database')

// ✅ Simple token tekshirish
const checkAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'errors.unauthorized'
        });
    }
    next();
};

// ✅ Barcha FOYDALANUVCHI VA BRON MA'LUMOTLARINI olish (usersadmin ARXIVIDAN)
router.get('/users', checkAdminToken, async (req, res) => {
  try {
    // ✅ YANGI: usersadmin jadvalidan TO'LIQ ARXIVNI olamiz
    const query = `
      SELECT 
        id,
        full_name,
        room_number,
        user_id,
        machine_name,
        booking_date,
        time_slot,
        booking_created_at,
        registered_at,
        last_active,
        -- ✅ YANGI: Bron qilganligini tekshirish
        CASE 
          WHEN machine_name IS NOT NULL THEN 'BRON_QILGAN'
          ELSE 'FAQAT_ROYXATDAN_OTGAN'
        END as status
      FROM usersadmin 
      ORDER BY COALESCE(booking_created_at, registered_at) DESC
      LIMIT 1000
    `;
    
    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Get all archive data error:', error);
    res.status(500).json({
      success: false,
      message: "errors.server_error"
    });
  }
});

// ✅ Foydalanuvchining BRON TARIXINI olish (usersadmin ARXIVIDAN)
router.get('/users/:userId/bookings', checkAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    // ✅ YANGI: usersadmin jadvalidan bron tarixini olish
    const query = `
      SELECT 
        id,
        machine_name,
        booking_date,
        time_slot,
        booking_created_at
      FROM usersadmin 
      WHERE user_id = $1 AND machine_name IS NOT NULL
      ORDER BY booking_created_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [userId]);
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Get user bookings from archive error:', error);
    res.status(500).json({
      success: false,
      message: "errors.server_error"
    });
  }
});

// ✅ Foydalanuvchilarni qidirish (usersadmin ARXIVIDAN)
router.get('/users/search', checkAdminToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'errors.search_query_required'
      });
    }

    const query = `
      SELECT 
        id,
        full_name,
        room_number,
        user_id,
        machine_name,
        booking_date,
        time_slot,
        booking_created_at,
        registered_at,
        last_active
      FROM usersadmin 
      WHERE full_name ILIKE $1 OR room_number ILIKE $1
      ORDER BY COALESCE(booking_created_at, registered_at) DESC
      LIMIT 100
    `;
    
    const searchTerm = `%${q}%`;
    const result = await db.query(query, [searchTerm]);
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Search archive data error:', error);
    res.status(500).json({
      success: false,
      message: "errors.server_error"
    });
  }
});

// ✅ Statistika olish (usersadmin ARXIVIDAN)
router.get('/stats', checkAdminToken, async (req, res) => {
  try {
    // Umumiy foydalanuvchilar
    const totalUsers = await db.query('SELECT COUNT(DISTINCT room_number) as count FROM usersadmin');
    
    // Bron qilgan foydalanuvchilar
    const usersWithBookings = await db.query('SELECT COUNT(DISTINCT room_number) as count FROM usersadmin WHERE machine_name IS NOT NULL');
    
    // Jami bronlar soni
    const totalBookings = await db.query('SELECT COUNT(*) as count FROM usersadmin WHERE machine_name IS NOT NULL');
    
    res.json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        usersWithBookings: parseInt(usersWithBookings.rows[0].count),
        totalBookings: parseInt(totalBookings.rows[0].count)
      }
    });
  } catch (error) {
    console.error('❌ Get archive stats error:', error);
    res.status(500).json({
      success: false,
      message: "errors.server_error"
    });
  }
});

// ✅ Foydalanuvchi bo'yicha to'liq ma'lumot olish
router.get('/user/:roomNumber', checkAdminToken, async (req, res) => {
  try {
    const { roomNumber } = req.params;
    
    const query = `
      SELECT 
        id,
        full_name,
        room_number,
        user_id,
        machine_name,
        booking_date,
        time_slot,
        booking_created_at,
        registered_at,
        last_active
      FROM usersadmin 
      WHERE room_number = $1
      ORDER BY COALESCE(booking_created_at, registered_at) DESC
    `;
    
    const result = await db.query(query, [roomNumber]);
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Get user details error:', error);
    res.status(500).json({
      success: false,
      message: "errors.server_error"
    });
  }
});

module.exports = router;