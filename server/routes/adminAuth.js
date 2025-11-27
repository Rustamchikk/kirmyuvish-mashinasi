// routes/adminAuth.js - TO'LIQ YANGILANGAN VERSIYA
const express = require('express');
const router = express.Router();
const AdminSession = require('../models/AdminSession');
const db = require('../config/database');
require('dotenv').config();

// ✅ IP olish funktsiyasi
const getClientIP = (req) => {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress || 
           '0.0.0.0';
};

const MAX_ATTEMPTS = 4;
const LOCK_TIME_MS = 4 * 60 * 1000;

// ✅ DOTENV DAN ADMIN CREDENTIALS OLISH
const adminCredentials = {
  [process.env.SUPER_ADMIN_USERNAME]: {
    password: process.env.SUPER_ADMIN_PASSWORD,
    type: 'super'
  },
  [process.env.REGULAR_ADMIN_USERNAME]: {
    password: process.env.REGULAR_ADMIN_PASSWORD,
    type: 'regular'
  }
};

// Login attempts ni database dan olish
const getLoginAttempts = async (username, ipAddress) => {
  try {
    const result = await db.query(
      `SELECT * FROM admin_login_attempts 
       WHERE username = $1 AND ip_address = $2`,
      [username, ipAddress]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Get login attempts error:', error);
    return null;
  }
};

// Login attempts ni yangilash
const updateLoginAttempts = async (username, ipAddress, attemptData) => {
  try {
    const { attemptCount, isLocked, lockedUntil } = attemptData;
    
    const existing = await getLoginAttempts(username, ipAddress);
    
    if (existing) {
      // Update existing record
      await db.query(
        `UPDATE admin_login_attempts 
         SET attempt_count = $1, is_locked = $2, locked_until = $3, 
             last_attempt = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE username = $4 AND ip_address = $5`,
        [attemptCount, isLocked, lockedUntil, username, ipAddress]
      );
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO admin_login_attempts 
         (username, ip_address, attempt_count, is_locked, locked_until) 
         VALUES ($1, $2, $3, $4, $5)`,
        [username, ipAddress, attemptCount, isLocked, lockedUntil]
      );
    }
    
    return true;
  } catch (error) {
    console.error('❌ Update login attempts error:', error);
    return false;
  }
};

// Login attempts ni o'chirish (muvaffaqiyatli login)
const clearLoginAttempts = async (username, ipAddress) => {
  try {
    await db.query(
      'DELETE FROM admin_login_attempts WHERE username = $1 AND ip_address = $2',
      [username, ipAddress]
    );
    return true;
  } catch (error) {
    console.error('❌ Clear login attempts error:', error);
    return false;
  }
};

// ✅ YANGI: HAR QANDAY NOTO'G'RI LOGIN UCHUN LIMIT MIDDLEWARE
const checkLoginLimit = async (req, res, next) => {
  try {
    const { username } = req.body;
    const clientIP = getClientIP(req);
    
    console.log(`🔐 Login limit middleware - User: ${username}, IP: ${clientIP}`);

    // Faqat login so'rovlarini tekshirish
    if (req.method !== 'POST' || !req.path.includes('login') || !username) {
      return next();
    }

    // ✅ HAR QANDAY USERNAME UCHUN TEKSHIRAMIZ (mavjud bo'lmasa ham)
    const attempt = await getLoginAttempts(username, clientIP);

    if (attempt && attempt.is_locked && attempt.locked_until) {
      const lockedUntil = new Date(attempt.locked_until);
      
      if (lockedUntil > new Date()) {
        const remainingTime = Math.ceil((lockedUntil - new Date()) / 1000 / 60);
        console.log(`🚫 Account locked in middleware - User: ${username}, Remaining: ${remainingTime}min`);
        return res.status(429).json({
          success: false,
          message: 'admin.account_locked',
          data: {
            remainingMinutes: remainingTime,
            lockedUntil: lockedUntil.toISOString()
          }
        });
      } else {
        // Blokirovka vaqti tugagan, reset qilamiz
        await updateLoginAttempts(username, clientIP, {
          attemptCount: 0,
          isLocked: false,
          lockedUntil: null
        });
        console.log(`✅ Lock expired in middleware - User: ${username} unlocked`);
      }
    }

    // IP-based limitni tekshirish (soatiga 10 marta)
    const ipLimitResult = await db.query(
      `SELECT COUNT(*) as attempt_count 
       FROM admin_login_attempts 
       WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [clientIP]
    );

    const ipAttemptCount = parseInt(ipLimitResult.rows[0].attempt_count);
    
    if (ipAttemptCount >= 10) {
      console.log(`🚫 IP blocked - IP: ${clientIP}, Attempts: ${ipAttemptCount}`);
      return res.status(429).json({
        success: false,
        message: 'ip_address_blocked',
        data: { remainingTime: '1 hour' }
      });
    }

    next();
  } catch (error) {
    console.error('❌ Login limit check error:', error);
    next();
  }
};

// ✅ YANGI: HAR QANDAY NOTO'G'RI LOGIN UCHUN ADMIN LOGIN
router.post('/login', checkLoginLimit, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = getClientIP(req);
    
    console.log(`🔐 Login attempt - User: ${username}, IP: ${clientIP}`);

    // ✅ HAR QANDAY USERNAME UCHUN LOGIN ATTEMPTS NI OLAMIZ
    const currentAttempt = await getLoginAttempts(username, clientIP);
    const currentCount = currentAttempt ? currentAttempt.attempt_count : 0;
    
    console.log(`📊 Current attempts: ${currentCount} for ${username}`);

    // ✅ HAR QANDAY NOTO'G'RI KIRISH UCHUN (login yoki parol)
    const admin = adminCredentials[username];
    const isInvalidLogin = !admin || admin.password !== password;

    if (isInvalidLogin) {
      const newCount = currentCount + 1;
      console.log(`❌ Invalid login - Attempt ${newCount} for ${username}`);
      
      if (newCount >= MAX_ATTEMPTS) {
        // 4-ta urinishdan keyin blokirovka
        const lockedUntil = new Date(Date.now() + LOCK_TIME_MS);
        
        await updateLoginAttempts(username, clientIP, {
          attemptCount: newCount,
          isLocked: true,
          lockedUntil: lockedUntil
        });
        
        console.log(`🚫 Account locked - User: ${username}, Until: ${lockedUntil}`);
        return res.status(429).json({
          success: false,
          message: 'admin.account_locked_after_attempts',
          data: {
            remainingAttempts: 0,
            lockedMinutes: LOCK_TIME_MS / 60000,
            lockedUntil: lockedUntil.toISOString(),
            messageData: { lockMinutes: LOCK_TIME_MS / 60000 }
          }
        });
      } else {
        // Urinishlar sonini yangilash
        await updateLoginAttempts(username, clientIP, {
          attemptCount: newCount,
          isLocked: false,
          lockedUntil: null
        });

        const remainingAttempts = MAX_ATTEMPTS - newCount;
        console.log(`⚠️ Invalid login - Remaining attempts: ${remainingAttempts}`);
        
        return res.status(401).json({
          success: false,
          message: 'auth.invalidCredentials',
          data: {
            remainingAttempts: remainingAttempts,
            message: 'auth.invalidCredentials'
          }
        });
      }
    }

    // ✅ TO'G'RI LOGIN VA PAROL - Reset va session yaratish
    console.log(`✅ Successful login - User: ${username}`);
    await clearLoginAttempts(username, clientIP);
    
    // Session yaratish
    const session = await AdminSession.createSession(
      username,
      { browser: 'Unknown', os: 'Unknown', device: 'Unknown' },
      clientIP
    );
    
    res.json({
      success: true,
      message: 'admin.login_success',
      adminType: admin.type,
      username: username,
      sessionId: session.id,
      token: 'admin-token-' + Date.now()
    });

  } catch (error) {
    console.error('❌ Login route error:', error);
    res.status(500).json({
      success: false,
      message: 'errors.server_error'
    });
  }
});

// Debug endpoint - login attempts holatini ko'rish
router.get('/debug/attempts', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM admin_login_attempts ORDER BY updated_at DESC'
    );
    
    const attempts = {};
    result.rows.forEach(row => {
      const key = `${row.username}_${row.ip_address}`;
      attempts[key] = {
        count: row.attempt_count,
        lockedUntil: row.locked_until ? new Date(row.locked_until).toLocaleString() : null,
        isLocked: row.is_locked,
        lastAttempt: new Date(row.last_attempt).toLocaleString(),
        remainingMinutes: row.locked_until && row.is_locked 
          ? Math.ceil((new Date(row.locked_until) - new Date()) / 60000)
          : 0
      };
    });

    res.json({
      success: true,
      data: {
        totalAttempts: result.rows.length,
        attempts: attempts
      }
    });
  } catch (error) {
    console.error('❌ Debug attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'errors.server_error'
    });
  }
});

// Reset attempts (debug uchun)
router.post('/debug/reset-attempts', async (req, res) => {
  try {
    const { username } = req.body;
    let result;

    if (username) {
      result = await db.query(
        'DELETE FROM admin_login_attempts WHERE username = $1',
        [username]
      );
    } else {
      result = await db.query('DELETE FROM admin_login_attempts');
    }

    res.json({
      success: true,
      message: 'admin.attempts_reset',
      data: {
        deletedCount: result.rowCount
      }
    });
  } catch (error) {
    console.error('❌ Reset attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'errors.server_error'
    });
  }
});

// Test endpoint - IP ni tekshirish
router.get('/test-ip', (req, res) => {
  const clientIP = getClientIP(req);
  
  res.json({
    success: true,
    data: {
      ip: clientIP,
      headers: {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
      },
      connection: {
        remoteAddress: req.connection?.remoteAddress,
        socketRemoteAddress: req.socket?.remoteAddress
      },
      trustProxy: req.app.get('trust proxy')
    }
  });
});

module.exports = router;