const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "test" ? 100 : 5,
    message: {
        success: false,
        message: "Too many login attempts, please try again in 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === "test" ? 100 : 3,
    message: {
        success: false,
        message: "Too many registration attempts, please try again in 1 hour",
    },
});

module.exports = {
    loginLimiter,
    registerLimiter
};