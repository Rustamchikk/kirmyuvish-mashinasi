const User = require('../models/User')

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
