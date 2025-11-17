// models/AdminSession.js
const db = require('../config/database');

class AdminSession {
  static async createSession(adminUsername, deviceInfo, ipAddress) {
    const query = `
      INSERT INTO admin_sessions 
      (admin_username, device_info, ip_address, login_time, is_active) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    const values = [
      adminUsername,
      JSON.stringify(deviceInfo),
      ipAddress,
      new Date(),
      true
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

 static async getActiveSessions(adminUsername = null) {
  let query = `SELECT * FROM admin_sessions`;
  const values = [];

  if (adminUsername) {
    query += ' WHERE admin_username = $1';
    values.push(adminUsername);
  }

  query += ' ORDER BY login_time DESC';

  const result = await db.query(query, values);
  return result.rows;
}


  static async endSession(sessionId) {
  const query = `
    DELETE FROM admin_sessions
    WHERE id = $1
  `;
  
  await db.query(query, [sessionId]);
}

  static async endAllSessions(adminUsername) {
  const query = `
    DELETE FROM admin_sessions
    WHERE admin_username = $1
  `;

  await db.query(query, [adminUsername]);
}


  static async getSessionStats(adminUsername) {
    const query = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
        COUNT(DISTINCT ip_address) as unique_devices,
        MAX(login_time) as last_login
      FROM admin_sessions 
      WHERE admin_username = $1 
      AND login_time > NOW() - INTERVAL '7 days'
    `;
    
    const result = await db.query(query, [adminUsername]);
    return result.rows[0];
  }
}

module.exports = AdminSession;