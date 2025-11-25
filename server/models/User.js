// models/User.js - Soddalashtirilgan
const pool = require('../config/database')

class User {
  static async create(userData) {
    const { full_name, room_number } = userData
    
    // ✅ 1. Avval XONA RAQAMI bo'yicha tekshiramiz
    const existingRoomUser = await pool.query(
      'SELECT * FROM users WHERE room_number = $1',
      [room_number]
    )

    if (existingRoomUser.rows.length > 0) {
      // ❌ Xona band - XATO BERAMIZ
      throw new Error('ROOM_ALREADY_REGISTERED')
    }

    // ✅ 2. Yangi user yaratamiz (faqat users jadvaliga)
    const result = await pool.query(
      'INSERT INTO users (full_name, room_number) VALUES ($1, $2) RETURNING *',
      [full_name, room_number]
    )

    // ❌ usersadmin ga YOZILMAYDI - faqat users jadvali
    return result.rows[0]
  }

  // ⚠️ QOLGAN METHODLAR O'ZGARMASIN!
  static async findByRoom(room_number) {
    const result = await pool.query(
      'SELECT * FROM users WHERE room_number = $1',
      [room_number]
    )
    return result.rows[0] || null
  }

  static async findByRoomAndName(room_number, full_name) {
    const result = await pool.query(
      'SELECT * FROM users WHERE room_number = $1 AND full_name = $2',
      [room_number, full_name]
    )
    return result.rows[0] || null
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async getAll() {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    )
    return result.rows
  }

  // ✅ YANGI: last_active_at ni yangilash
  static async updateLastActive(userId) {
    await pool.query(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    )
  }

  // ✅ YANGI: User ni o'chirish
  static async delete(userId) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId])
    return result.rows[0]
  }

  // ✅ YANGI: Barcha userlarni o'chirish
  static async deleteAll() {
    await pool.query('DELETE FROM users')
  }
}

module.exports = User