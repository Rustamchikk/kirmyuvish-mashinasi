const pool = require('../config/database')

class AdminUsers {
  // ✅ YANGILANGAN: UNIQUE constraint yo'qligi uchun oddiy INSERT
  static async addToArchive(full_name, room_number, user_id = null) {
    try {
      const result = await pool.query(
        `INSERT INTO usersadmin (user_id, full_name, room_number, registered_at, last_active) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [user_id, full_name, room_number]
      )
      return result.rows[0]
    } catch (error) {
      console.error('❌ Usersadmin ga yozishda xato:', error)
      throw error
    }
  }

  // ✅ Barcha foydalanuvchilarni olish (usersadmin jadvalidan)
  static async getAllUsers() {
    const result = await pool.query(
      `SELECT * FROM usersadmin 
       ORDER BY COALESCE(booking_created_at, registered_at) DESC`
    )
    return result.rows
  }

  // ✅ Foydalanuvchilarni qidirish
  static async searchUsers(searchTerm) {
    const result = await pool.query(
      `SELECT * FROM usersadmin 
       WHERE full_name ILIKE $1 OR room_number ILIKE $1 
       ORDER BY COALESCE(booking_created_at, registered_at) DESC
       LIMIT 100`,
      [`%${searchTerm}%`]
    )
    return result.rows
  }

  // ✅ Foydalanuvchi statistikasi
  static async getUserStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT room_number) as total_users,
        COUNT(*) as total_records,
        COUNT(CASE WHEN machine_name IS NOT NULL THEN 1 END) as total_bookings
      FROM usersadmin 
    `)
    return result.rows[0]
  }

  // ✅ Jadvaldagi barcha xonalarni olish
  static async getAllRooms() {
    const result = await pool.query(
      'SELECT DISTINCT room_number FROM usersadmin ORDER BY room_number'
    )
    return result.rows.map(row => row.room_number)
  }

  // ✅ Oxirgi 7 kunlik ro'yxatdan o'tganlar
  static async getRecentRegistrations() {
    const result = await pool.query(`
      SELECT * FROM usersadmin 
      WHERE registered_at > NOW() - INTERVAL '7 days'
      ORDER BY registered_at DESC
    `)
    return result.rows
  }

  // ✅ YANGI: Foydalanuvchi bronlarini olish
  static async getUserBookings(userId) {
    const result = await pool.query(
      `SELECT * FROM usersadmin 
       WHERE user_id = $1 AND machine_name IS NOT NULL
       ORDER BY booking_created_at DESC
       LIMIT 50`,
      [userId]
    )
    return result.rows
  }

  // ✅ YANGI: Faqat bron qilgan foydalanuvchilarni olish
  static async getUsersWithBookings() {
    const result = await pool.query(`
      SELECT DISTINCT ON (room_number) *
      FROM usersadmin 
      WHERE machine_name IS NOT NULL
      ORDER BY room_number, booking_created_at DESC
    `)
    return result.rows
  }
}

module.exports = AdminUsers