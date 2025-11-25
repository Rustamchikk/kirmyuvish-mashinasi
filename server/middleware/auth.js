const jwt = require("jsonwebtoken");

exports.requireAdmin = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "error.admin_required"
      });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ruxsat super admin yoki oddiy admin bo‘lsa beriladi
    req.admin = {
      username: decoded.username,
      adminType: decoded.adminType,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "error.invalid_admin_credentials"
    });
  }
};
