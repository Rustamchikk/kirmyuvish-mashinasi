// controllers/userController.js
const User = require('../models/User')

// Mavjud xonalar ro'yxati
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

exports.register = async (req, res) => {
  try {
    const { full_name, room_number } = req.body

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Ism va familiya kiritilishi shart',
      })
    }

    const nameParts = full_name.trim().split(/\s+/)
    if (nameParts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Iltimos, ism va familiyangizni kiriting',
      })
    }

    if (full_name.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Ism-familiya kamida 5 ta belgidan iborat bo'lishi kerak",
      })
    }

    if (full_name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Ism-familiya 100 ta belgidan oshmasligi kerak',
      })
    }

    if (!room_number || !room_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Xona raqami kiritilishi shart',
      })
    }

    const roomRegex = /^[0-9]{3}$/
    if (!roomRegex.test(room_number.trim())) {
      return res.status(400).json({
        success: false,
        message: "Xona raqami 3 ta raqamdan iborat bo'lishi kerak",
      })
    }

    // Xona mavjudligini tekshirish
    if (!AVAILABLE_ROOMS.includes(room_number.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Bunday raqamli xona mavjud emas. Iltimos yana urunib ko\'ring.',
      })
    }

    const existingUser = await User.findByRoom(room_number.trim())
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Bu xona raqami bilan allaqachon ro'yxatdan o'tilgan",
      })
    }

    const user = await User.create({
      full_name: full_name.trim(),
      room_number: room_number.trim(),
    })

    res.status(201).json({
      success: true,
      message: "Muvaffaqiyatli ro'yxatdan o'tdingiz",
      data: user,
    })
  } catch (error) {
    console.error('User registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
    })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll()
    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
    })
  }
}

// YANGI: Mavjud xonalarni olish
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
    console.error('Get available rooms error:', error)
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
    })
  }
}

// Foydalanuvchini tekshirish
exports.verifyUser = async (req, res) => {
  try {
    const { room_number, full_name } = req.query

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Ism va familiya kiritilishi shart',
      })
    }

    if (!room_number || !room_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Xona raqami kiritilishi shart',
      })
    }

    const roomRegex = /^[0-9]{3}$/
    if (!roomRegex.test(room_number.trim())) {
      return res.status(400).json({
        success: false,
        message: "Xona raqami 3 ta raqamdan iborat bo'lishi kerak",
      })
    }

    // Xona mavjudligini tekshirish
    if (!AVAILABLE_ROOMS.includes(room_number.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Bunday raqamli xona mavjud emas. Iltimos yana urunib ko\'ring.',
      })
    }

    const user = await User.findByRoom(room_number.trim())
    
    if (user && user.full_name === full_name.trim()) {
      return res.json({
        success: true,
        exists: true,
        message: 'Foydalanuvchi mavjud',
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
        message: 'Bu ism va xona raqami bilan ro\'yxatdan o\'tilmagan'
      })
    }
  } catch (error) {
    console.error('Verify user error:', error)
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
    })
  }
}

module.exports = exports