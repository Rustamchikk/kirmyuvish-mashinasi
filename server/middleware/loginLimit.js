const db = require('../config/database');

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
        
        if (req.method !== 'POST' || !req.path.includes('login') || !username) {
            return next();
        }

        const clientIP = getClientIP(req);

        const attemptResult = await db.query(
            `SELECT * FROM admin_login_attempts 
             WHERE username = $1 AND ip_address = $2`,
            [username, clientIP]
        );

        const currentAttempt = attemptResult.rows[0];

        const ipLimitResult = await db.query(
            `SELECT COUNT(*) as attempt_count 
             FROM admin_login_attempts 
             WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
            [clientIP]
        );

        const ipAttemptCount = parseInt(ipLimitResult.rows[0].attempt_count);
        
        if (ipAttemptCount >= 10) {
            return res.status(429).json({
                success: false,
                message: 'ip_address_blocked',
                data: { remainingTime: '1 hour' }
            });
        }

        if (currentAttempt && currentAttempt.is_locked && currentAttempt.locked_until) {
            const lockedUntil = new Date(currentAttempt.locked_until);
            const now = new Date();

            if (now < lockedUntil) {
                const remainingMinutes = Math.ceil((lockedUntil - now) / 60000);
                
                return res.status(429).json({
                    success: false,
                    message: 'admin.account_locked',
                    data: {
                        remainingMinutes,
                        lockedUntil: currentAttempt.locked_until
                    }
                });
            } else {
                await db.query(
                    `UPDATE admin_login_attempts 
                     SET attempt_count = 0, is_locked = false, locked_until = NULL 
                     WHERE username = $1 AND ip_address = $2`,
                    [username, clientIP]
                );
            }
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = checkLoginLimit;