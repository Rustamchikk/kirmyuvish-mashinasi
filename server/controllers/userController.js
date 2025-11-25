const User = require('../models/User')
const pool = require('../config/database')

const AVAILABLE_ROOMS = (() => {
  const rooms = []
  const ranges = [
    [103, 115], [202, 215], [217, 230], [302, 315], [317, 330],
    [402, 415], [417, 430], [502, 515], [517, 530], [602, 615],
    [617, 630], [702, 715], [717, 730], [802, 815], [817, 830],
    [902, 915], [917, 930]
  ]
  ranges.forEach(([start, end]) => {
    for (let i = start; i <= end; i++) {
      rooms.push(i.toString())
    }
  })
  return rooms
})()

// ✅ LOGIN FUNCTION
exports.login = async (req, res) => {
  try {
    const { room_number, full_name } = req.body

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: "errors.fullname_required" })
    }

    if (!room_number || !room_number.trim()) {
      return res.status(400).json({ success: false, message: "errors.room_required" })
    }

    const user = await User.findByRoomAndName(room_number.trim(), full_name.trim())

    if (user) {
      // ✅ last_active_at ni yangilaymiz
      await User.updateLastActive(user.id)
      
      return res.json({
        success: true,
        message: "success.login_success",
        data: {
          id: user.id,
          full_name: user.full_name,
          room_number: user.room_number
        }
      })
    } else {
      return res.status(401).json({
        success: false,
        message: "errors.invalid_credentials"
      })
    }

  } catch (error) {
    console.error("User login error:", error)
    res.status(500).json({ success: false, message: "errors.server_error" })
  }
}

// ✅ REGISTER FUNCTION - YANGILANGAN (FAQAT BIRINCHI RO'YXATDAN O'TGANDA)
exports.register = async (req, res) => {
  try {
    const { full_name, room_number } = req.body

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: "errors.fullname_required" })
    }

    const nameParts = full_name.trim().split(/\s+/)
    if (nameParts.length < 2) {
      return res.status(400).json({ success: false, message: "errors.fullname_incorrect" })
    }

    if (full_name.trim().length < 5) {
      return res.status(400).json({ success: false, message: "errors.fullname_too_short" })
    }

    if (full_name.trim().length > 100) {
      return res.status(400).json({ success: false, message: "errors.fullname_too_long" })
    }

    if (!room_number || !room_number.trim()) {
      return res.status(400).json({ success: false, message: "errors.room_required" })
    }

    const roomRegex = /^[0-9]{3}$/
    if (!roomRegex.test(room_number.trim())) {
      return res.status(400).json({ success: false, message: "errors.room_format" })
    }

    if (!AVAILABLE_ROOMS.includes(room_number.trim())) {
      return res.status(400).json({ success: false, message: "errors.room_not_exist" })
    }

    try {
      // ✅ 1. Avval User yaratamiz (asosiy users jadvaliga)
      const user = await User.create({
        full_name: full_name.trim(),
        room_number: room_number.trim(),
      })

      // ✅ 2. YANGILANGAN: FAQAT BIRINCHI RO'YXATDAN O'TGANDA usersadmin ga yozish
      try {
        // Avval bu xonada ro'yxatdan o'tgan bormi tekshiramiz
        const existingArchiveQuery = 'SELECT id FROM usersadmin WHERE room_number = $1';
        const existingArchiveResult = await pool.query(existingArchiveQuery, [room_number.trim()]);
        
        if (existingArchiveResult.rows.length === 0) {
          // ✅ FAQAT BIRINCHI RO'YXATDAN O'TGANDA yozamiz
          await pool.query(`
            INSERT INTO usersadmin 
              (user_id, full_name, room_number, registered_at, last_active) 
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [user.id, full_name.trim(), room_number.trim()]);
        } else {
        }
      } catch (archiveError) {
        console.error('❌ Usersadmin ga yozishda xato:', archiveError)
      }

      res.status(201).json({
        success: true,
        message: "success.registered",
        data: user,
      })

    } catch (error) {
      // ✅ ROOM_ALREADY_REGISTERED xatosini handle qilamiz
      if (error.message === 'ROOM_ALREADY_REGISTERED') {
        return res.status(400).json({
          success: false,
          message: "errors.room_already_registered"
        })
      }
      
      // ✅ UNIQUE constraint xatosini handle qilamiz
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: "errors.room_already_registered"
        })
      }

      throw error;
    }

  } catch (error) {
    console.error("User registration error:", error)
    res.status(500).json({ success: false, message: "errors.server_error" })
  }
}

// ... (qolgan funksiyalar o'zgarmaydi)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll()
    res.json({ success: true, data: users })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ success: false, message: "errors.server_error" })
  }
}

exports.getAvailableRooms = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        rooms: AVAILABLE_ROOMS,
        ranges: "103-115, 202-215, 217-230, 302-315, 317-330, 402-415, 417-430, 502-515, 517-530, 602-615, 617-630, 702-715, 717-730, 802-815, 817-830, 902-915, 917-930"
      }
    })
  } catch (error) {
    console.error("Get available rooms error:", error)
    res.status(500).json({ success: false, message: "errors.server_error" })
  }
}

exports.verifyUser = async (req, res) => {
  try {
    const { room_number, full_name } = req.query

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: "errors.fullname_required" })
    }

    if (!room_number || !room_number.trim()) {
      return res.status(400).json({ success: false, message: "errors.room_required" })
    }

    const roomRegex = /^[0-9]{3}$/
    if (!roomRegex.test(room_number.trim())) {
      return res.status(400).json({ success: false, message: "errors.room_format" })
    }

    if (!AVAILABLE_ROOMS.includes(room_number.trim())) {
      return res.status(400).json({ success: false, message: "errors.room_not_exist" })
    }

    const user = await User.findByRoomAndName(room_number.trim(), full_name.trim())

    if (user) {
      // ✅ last_active_at ni yangilaymiz
      await User.updateLastActive(user.id)
      
      return res.json({
        success: true,
        exists: true,
        message: "success.user_found",
        data: {
          id: user.id,
          full_name: user.full_name,
          room_number: user.room_number
        }
      })
    } else {
      return res.json({
        success: true,
        exists: false,
        message: "errors.user_not_registered"
      })
    }

  } catch (error) {
    console.error("Verify user error:", error)
    res.status(500).json({ success: false, message: "errors.server_error" })
  }
}

module.exports = exports