// controllers/adminAuth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const MAX_ATTEMPTS = 4;
const LOCK_TIME_MINUTES = 4;

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip;
    // 1. Admin user ni topish
    const adminResult = await db.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    if (adminResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'admin.invalid_credentials',
        remainingAttempts: null
      });
    }

    const admin = adminResult.rows[0];

    // 2. Bloklanganligini tekshirish
    if (admin.is_locked && admin.locked_until) {
      const now = new Date();
      const lockedUntil = new Date(admin.locked_until);

      if (now < lockedUntil) {
        const remainingMinutes = Math.ceil((lockedUntil - now) / 60000);
        
        return res.status(429).json({
          success: false,
          message: 'admin.account_locked',
          data: {
            remainingMinutes,
            lockedUntil: admin.locked_until,
            messageData: { lockMinutes: remainingMinutes }
          }
        });
      } else {
        // Blokirovka vaqti tugagan, reset qilamiz
        await db.query(
          `UPDATE admin_users 
           SET login_attempts = 0, is_locked = false, locked_until = NULL 
           WHERE id = $1`,
          [admin.id]
        );
      }
    }

    // 3. Parolni tekshirish
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      // Noto'g'ri parol - urinishlar sonini oshiramiz
      const newAttempts = admin.login_attempts + 1;
      let updateQuery = '';
      let queryParams = [];

      if (newAttempts >= MAX_ATTEMPTS) {
        // 4-ta urinishdan keyin blokirovka
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_TIME_MINUTES);

        updateQuery = `
          UPDATE admin_users 
          SET login_attempts = $1, last_attempt = CURRENT_TIMESTAMP, 
              is_locked = true, locked_until = $2 
          WHERE id = $3
        `;
        queryParams = [newAttempts, lockedUntil, admin.id];
        await db.query(updateQuery, queryParams);

        return res.status(429).json({
          success: false,
          message: 'admin.account_locked_after_attempts',
          data: {
            remainingAttempts: 0,
            lockedMinutes: LOCK_TIME_MINUTES,
            lockedUntil: lockedUntil,
            messageData: { lockMinutes: LOCK_TIME_MINUTES }
          }
        });

      } else {
        // Urinishlar sonini yangilaymiz
        updateQuery = `
          UPDATE admin_users 
          SET login_attempts = $1, last_attempt = CURRENT_TIMESTAMP 
          WHERE id = $2
        `;
        queryParams = [newAttempts, admin.id];

        await db.query(updateQuery, queryParams);

        const remainingAttempts = MAX_ATTEMPTS - newAttempts;
        return res.status(401).json({
          success: false,
          message: 'auth.invalidCredentials',
          data: {
            remainingAttempts
          }
        });
      }
    }

    // 4. TO'G'RI PAROL - Reset va token yaratish
    await db.query(
      `UPDATE admin_users 
       SET login_attempts = 0, last_attempt = NULL, 
           is_locked = false, locked_until = NULL,
           last_login = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [admin.id]
    );

    // Token yaratish
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        adminType: admin.admin_type,
        username: admin.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      token,
      adminType: admin.admin_type
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'errors.server_error'
    });
  }
};

module.exports = { adminLogin };