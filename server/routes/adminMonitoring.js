const express = require('express');
const router = express.Router();
const AdminSession = require('../models/AdminSession');

// Helper functions for device detection
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

// Get all active sessions
router.get('/sessions', async (req, res) => {
  try {
    const { username } = req.query;
    const sessions = await AdminSession.getActiveSessions(username);
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Session monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get session statistics
router.get('/session-stats', async (req, res) => {
  try {
    const { username } = req.query;
    const stats = await AdminSession.getSessionStats(username || 'all');
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Session stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// End specific session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await AdminSession.endSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// End all sessions for a user
router.delete('/sessions', async (req, res) => {
  try {
    const username = req.query.username || req.body.username;

    await AdminSession.endAllSessions(username);

    res.json({
      success: true,
      message: 'All sessions ended successfully'
    });
  } catch (error) {
    console.error('End all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// ✅ TO'G'RI: Faqat router ni export qilish
module.exports = router;