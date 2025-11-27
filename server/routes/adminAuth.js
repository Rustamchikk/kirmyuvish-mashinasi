// routes/adminAuth.js - FAQAT IP GA QARAB LIMIT
const express = require('express');
const router = express.Router();
const AdminSession = require('../models/AdminSession');
const db = require('../config/database');
require('dotenv').config();

const getClientIP = (req) => {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress || 
           '0.0.0.0';
};

const MAX_ATTEMPTS = 4;
const LOCK_TIME_MS = 4 * 60 * 1000;

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

// ✅ YANGI: FAQAT IP GA QARAB LOGIN ATTEMPTS NI OLISH
const getIPLoginAttempts = async (ipAddress) => {
  try {
    const result = await db.query(
      `SELECT * FROM admin_login_attempts 
       WHERE ip_address = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [ipAddress]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Get IP login attempts error:', error);
    return null;
  }
};

// ✅ YANGI: FAQAT IP GA QARAB LOGIN ATTEMPTS NI YANGILASH
const updateIPLoginAttempts = async (ipAddress, attemptData) => {
  try {
    const { attemptCount, isLocked, lockedUntil, username } = attemptData;
    
    const existing = await getIPLoginAttempts(ipAddress);
    
    if (existing) {
      // Update existing record
      await db.query(
        `UPDATE admin_login_attempts 
         SET attempt_count = $1, is_locked = $2, locked_until = $3, 
             last_attempt = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
             username = $4
         WHERE ip_address = $5`,
        [attemptCount, isLocked, lockedUntil, username || 'unknown', ipAddress]
      );
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO admin_login_attempts 
         (username, ip_address, attempt_count, is_locked, locked_until) 
         VALUES ($1, $2, $3, $4, $5)`,
        [username || 'unknown', ipAddress, attemptCount, isLocked, lockedUntil]
      );
    }
    
    return true;
  } catch (error) {
    console.error('❌ Update IP login attempts error:', error);
    return false;
  }
};

// ✅ YANGI: FAQAT IP GA QARAB LOGIN ATTEMPTS NI O'CHIRISH
const clearIPLoginAttempts = async (ipAddress) => {
  try {
    await db.query(
      'DELETE FROM admin_login_attempts WHERE ip_address = $1',
      [ipAddress]
    );
    return true;
  } catch (error) {
    console.error('❌ Clear IP login attempts error:', error);
    return false;
  }
};

// ✅ YANGI: FAQAT IP GA QARAB LIMIT MIDDLEWARE
const checkLoginLimit = async (req, res, next) => {
  try {
    const { username } = req.body;
    const clientIP = getClientIP(req);
    
    console.log(`🔐 Login limit middleware - IP: ${clientIP}, User: ${username}`);

    // Faqat login so'rovlarini tekshirish
    if (req.method !== 'POST' || !req.path.includes('login') || !username) {
      return next();
    }

    // ✅ FAQAT IP GA QARAB TEKSHIRAMIZ
    const attempt = await getIPLoginAttempts(clientIP);

    if (attempt && attempt.is_locked && attempt.locked_until) {
      const lockedUntil = new Date(attempt.locked_until);
      
      if (lockedUntil > new Date()) {
        const remainingTime = Math.ceil((lockedUntil - new Date()) / 1000 / 60);
        console.log(`🚫 IP LOCKED - IP: ${clientIP}, Remaining: ${remainingTime}min`);
        return res.status(429).json({
          success: false,
          message: 'ip_address_blocked',
          data: {
            remainingMinutes: remainingTime,
            lockedUntil: lockedUntil.toISOString()
          }
        });
      } else {
        // Blokirovka vaqti tugagan, reset qilamiz
        await updateIPLoginAttempts(clientIP, {
          attemptCount: 0,
          isLocked: false,
          lockedUntil: null,
          username: 'unknown'
        });
        console.log(`✅ IP UNLOCKED - IP: ${clientIP}`);
      }
    }

    next();
  } catch (error) {
    console.error('❌ Login limit check error:', error);
    next();
  }
};

// ✅ YANGI: FAQAT IP GA QARAB ADMIN LOGIN
router.post('/login', checkLoginLimit, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = getClientIP(req);
    
    console.log(`🔐 Login attempt - IP: ${clientIP}, User: ${username}`);

    // ✅ FAQAT IP GA QARAB LOGIN ATTEMPTS NI OLAMIZ
    const currentAttempt = await getIPLoginAttempts(clientIP);
    const currentCount = currentAttempt ? currentAttempt.attempt_count : 0;
    
    console.log(`📊 IP Attempts: ${currentCount} for IP: ${clientIP}`);

    // ✅ HAR QANDAY NOTO'G'RI KIRISH UCHUN (login yoki parol)
    const admin = adminCredentials[username];
    const isInvalidLogin = !admin || admin.password !== password;

    if (isInvalidLogin) {
      const newCount = currentCount + 1;
      console.log(`❌ INVALID LOGIN - IP: ${clientIP}, Attempt: ${newCount}`);
      
      if (newCount >= MAX_ATTEMPTS) {
        // 4-ta urinishdan keyin blokirovka
        const lockedUntil = new Date(Date.now() + LOCK_TIME_MS);
        
        await updateIPLoginAttempts(clientIP, {
          attemptCount: newCount,
          isLocked: true,
          lockedUntil: lockedUntil,
          username: username
        });
        
        console.log(`🚫 IP BLOCKED - IP: ${clientIP}, Until: ${lockedUntil}`);
        return res.status(429).json({
          success: false,
          message: 'ip_address_blocked',
          data: {
            remainingAttempts: 0,
            lockedMinutes: LOCK_TIME_MS / 60000,
            lockedUntil: lockedUntil.toISOString()
          }
        });
      } else {
        // Urinishlar sonini yangilash
        await updateIPLoginAttempts(clientIP, {
          attemptCount: newCount,
          isLocked: false,
          lockedUntil: null,
          username: username
        });

        const remainingAttempts = MAX_ATTEMPTS - newCount;
        console.log(`⚠️ INVALID LOGIN - IP: ${clientIP}, Remaining: ${remainingAttempts}`);
        
        return res.status(401).json({
          success: false,
          message: 'auth.invalidCredentials',
          data: {
            remainingAttempts: remainingAttempts
          }
        });
      }
    }

    // ✅ TO'G'RI LOGIN VA PAROL - Reset va session yaratish
    console.log(`✅ SUCCESSFUL LOGIN - IP: ${clientIP}, User: ${username}`);
    await clearIPLoginAttempts(clientIP);
    
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
      const key = `${row.ip_address}`;
      attempts[key] = {
        username: row.username,
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
    const { ip } = req.body;
    let result;

    if (ip) {
      result = await db.query(
        'DELETE FROM admin_login_attempts WHERE ip_address = $1',
        [ip]
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