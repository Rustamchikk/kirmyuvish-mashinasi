const express = require('express');
const router = express.Router();
const AdminSession = require('../models/AdminSession');

// Helper functions
function getBrowser(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOS(userAgent) {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getDevice(userAgent) {
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}

// Admin credentials
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

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const deviceInfo = {
      userAgent: userAgent,
      browser: getBrowser(userAgent),
      os: getOS(userAgent),
      device: getDevice(userAgent)
    };

    // Admin mavjudligini tekshirish
    const admin = adminCredentials[username];
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'errors.invalid_credentials'
      });
    }

    // Parol xato
    if (admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'errors.invalid_credentials'
      });
    }

    // Session yaratish
    const session = await AdminSession.createSession(
      username,
      deviceInfo,
      clientIP
    );

    res.json({
      success: true,
      message: 'success.admin_login',
      adminType: admin.type,
      username: username,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'errors.server_error'
    });
  }
});

module.exports = router;
