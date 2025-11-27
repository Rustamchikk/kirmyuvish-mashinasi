// middleware/loginLimit.js
const db = require('../config/database');

// Haqiqiy IP manzilni olish funktsiyasi
const getClientIP = (req) => {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           '0.0.0.0';
};

const checkLoginLimit = async (req, res, next) => {
    try {
        const { username } = req.body;
        
        // Faqat login so'rovlarini tekshirish
        if (req.method !== 'POST' || !req.path.includes('login') || !username) {
            return next();
        }

        const clientIP = getClientIP(req);
        console.log(`🔐 Login limit check - Username: ${username}, IP: ${clientIP}`);

        // ✅ FAQAT admin_login_attempts jadvali bilan ishlaymiz
        // Login attempts ni olish
        const attemptResult = await db.query(
            `SELECT * FROM admin_login_attempts 
             WHERE username = $1 AND ip_address = $2`,
            [username, clientIP]
        );

        const currentAttempt = attemptResult.rows[0];

        // 🔥 IP-based limitni tekshirish (soatiga 10 marta)
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

        // Bloklanganligini tekshirish (faqat admin_login_attempts orqali)
        if (currentAttempt && currentAttempt.is_locked && currentAttempt.locked_until) {
            const lockedUntil = new Date(currentAttempt.locked_until);
            const now = new Date();

            if (now < lockedUntil) {
                const remainingMinutes = Math.ceil((lockedUntil - now) / 60000);
                
                console.log(`🔒 Account locked - User: ${username}, Remaining: ${remainingMinutes}min`);
                return res.status(429).json({
                    success: false,
                    message: 'admin.account_locked',
                    data: {
                        remainingMinutes,
                        lockedUntil: currentAttempt.locked_until
                    }
                });
            } else {
                // Blokirovka vaqti tugagan, reset qilamiz
                await db.query(
                    `UPDATE admin_login_attempts 
                     SET attempt_count = 0, is_locked = false, locked_until = NULL 
                     WHERE username = $1 AND ip_address = $2`,
                    [username, clientIP]
                );
                console.log(`✅ Lock expired - User: ${username} unlocked`);
            }
        }

        next();
    } catch (error) {
        console.error('❌ Login limit check error:', error);
        next();
    }
};

module.exports = checkLoginLimit;