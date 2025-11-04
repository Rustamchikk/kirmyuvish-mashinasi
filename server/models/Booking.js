const pool = require('../config/database')

class Booking {
	static async create(bookingData) {
		const { user_id, machine_id, booking_date, time_slot } = bookingData

		// Bron mavjudligini tekshirish
		const existingBooking = await pool.query(
			'SELECT * FROM bookings WHERE machine_id = $1 AND booking_date = $2 AND time_slot = $3',
			[machine_id, booking_date, time_slot]
		)

		if (existingBooking.rows.length > 0) {
			throw new Error("Bu vaqt oralig'ida mashina band")
		}

		const result = await pool.query(
			`INSERT INTO bookings (user_id, machine_id, booking_date, time_slot) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
			[user_id, machine_id, booking_date, time_slot]
		)
		return result.rows[0]
	}

	static async getUserBookings(user_id) {
		const result = await pool.query(
			`SELECT b.*, m.name as machine_name, u.full_name, u.room_number 
       FROM bookings b 
       JOIN machines m ON b.machine_id = m.id 
       JOIN users u ON b.user_id = u.id 
       WHERE b.user_id = $1 
       ORDER BY b.booking_date DESC, b.time_slot`,
			[user_id]
		)
		return result.rows
	}

	static async getAllBookings(date = null) {
		let query = `
      SELECT b.*, m.name as machine_name, u.full_name, u.room_number 
      FROM bookings b 
      JOIN machines m ON b.machine_id = m.id 
      JOIN users u ON b.user_id = u.id 
    `

		let params = []
		if (date) {
			query += ' WHERE b.booking_date = $1'
			params.push(date)
		}

		query += ' ORDER BY b.booking_date, b.time_slot, m.id'

		const result = await pool.query(query, params)
		return result.rows
	}

	static async delete(id) {
		const result = await pool.query(
			'DELETE FROM bookings WHERE id = $1 RETURNING *',
			[id]
		)
		return result.rows[0]
	}
}

module.exports = Booking
