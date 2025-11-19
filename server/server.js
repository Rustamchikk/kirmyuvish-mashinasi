const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// PostgreSQL connect
const db = require("./config/database");

// Models
const Booking = require("./models/Booking");
const WeeklyLimit = require("./models/WeeklyLimit");

const app = express();

// ====== SECURITY ======
app.use(
    cors({
        origin: [
            "https://kirmyuvish-mashinasi.vercel.app", // Frontend
            "http://localhost:3000" // Local
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);
app.options("*", cors());

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

app.use(express.json());

// ====== RATE LIMIT ======
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW_MINUTES || 1) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// ====== ROUTES ======
try {
    app.use("/api/users", require("./routes/users"));
    app.use("/api/bookings", require("./routes/bookings"));
    app.use("/api/machines", require("./routes/machines"));
    app.use("/api/admin/auth", require("./routes/adminAuth"));
    app.use("/api/admin/monitoring", require("./routes/adminMonitoring"));
    app.use("/api/admin", require("./routes/adminUsers"));
} catch (err) {
    console.error("Route import error:", err);
    process.exit(1);
}

// ====== HEALTH CHECK ======
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

// ====== 404 ======
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        requestedUrl: req.originalUrl
    });
});

// ❗❗❗ VERCEL VERSION: EXPORT QILAMIZ (listen yo‘q)
module.exports = app;
