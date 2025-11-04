const pool = require('../config/database')

class Machine {
	static async getAll() {
		const result = await pool.query('SELECT * FROM machines ORDER BY id')
		return result.rows
	}

	static async getById(id) {
		const result = await pool.query('SELECT * FROM machines WHERE id = $1', [
			id,
		])
		return result.rows[0]
	}

	static async updateStatus(id, is_active) {
		const result = await pool.query(
			'UPDATE machines SET is_active = $1 WHERE id = $2 RETURNING *',
			[is_active, id]
		)
		return result.rows[0]
	}

	// YANGI: Mashina qo'shish
	static async create(name) {
		const result = await pool.query(
			'INSERT INTO machines (name) VALUES ($1) RETURNING *',
			[name]
		)
		return result.rows[0]
	}

	// YANGI: Mashina o'chirish
	static async delete(id) {
		const result = await pool.query(
			'DELETE FROM machines WHERE id = $1 RETURNING *',
			[id]
		)
		return result.rows[0]
	}
}

module.exports = Machine
