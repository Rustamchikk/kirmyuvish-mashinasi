const pool = require('../config/database')

class User {
	static async create(userData) {
		const { full_name, room_number } = userData
		const result = await pool.query(
			'INSERT INTO users (full_name, room_number) VALUES ($1, $2) RETURNING *',
			[full_name, room_number]
		)
		return result.rows[0]
	}

	static async findByRoom(room_number) {
		const result = await pool.query(
			'SELECT * FROM users WHERE room_number = $1',
			[room_number]
		)
		return result.rows[0]
	}

	static async findById(id) {
		const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
		return result.rows[0]
	}

	static async getAll() {
		const result = await pool.query(
			'SELECT * FROM users ORDER BY created_at DESC'
		)
		return result.rows
	}
}

module.exports = User
