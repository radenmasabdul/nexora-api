const rateLimit = require('express-rate-limit');

// rate limiter untuk login - lebih ketat
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // hanya 5 percobaan login per 15 menit
    message: {
        success: false,
        message: "Too many login attempts, please try again in 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// rate limiter untuk register
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // hanya 3 registrasi per jam per IP
    message: {
        success: false,
        message: "Too many registration attempts, please try again in 1 hour"
    }
});

module.exports = {
    loginLimiter,
    registerLimiter
};