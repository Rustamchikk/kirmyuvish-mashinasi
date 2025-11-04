const pool = require('../config/database')

class WeeklyLimit {
	static async getOrCreate(user_id, week_start) {
		let result = await pool.query(
			'SELECT * FROM weekly_limits WHERE user_id = $1 AND week_start = $2',
			[user_id, week_start]
		)

		if (result.rows.length === 0) {
			result = await pool.query(
				'INSERT INTO weekly_limits (user_id, week_start, bookings_count) VALUES ($1, $2, 0) RETURNING *',
				[user_id, week_start]
			)
		}

		return result.rows[0]
	}

	static async increment(user_id, week_start) {
		const result = await pool.query(
			`UPDATE weekly_limits 
       SET bookings_count = bookings_count + 1 
       WHERE user_id = $1 AND week_start = $2 
       RETURNING *`,
			[user_id, week_start]
		)
		return result.rows[0]
	}

	static async resetWeeklyLimits() {
		await pool.query('DELETE FROM weekly_limits')
		console.log('Weekly limits reset')
	}
}

module.exports = WeeklyLimit
