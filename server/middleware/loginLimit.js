// middleware/loginLimit.js
const db = require('../config/database');

const checkLoginLimit = async (req, res, next) => {
  try {
    const { username } = req.body;
    const clientIP = req.ip;

    // Admin user ni topish
    const adminResult = await db.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    if (adminResult.rows.length === 0) {
      return next(); // User topilmasa, basic auth ga utkazamiz
    }

    const admin = adminResult.rows[0];

    // Bloklanganligini tekshirish
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
            lockedUntil: admin.locked_until
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

    next();
  } catch (error) {
    console.error('Login limit check error:', error);
    next();
  }
};

module.exports = checkLoginLimit;