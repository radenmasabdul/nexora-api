require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const router = require("./routes/index");

const app = express();

// rate limiting global (untuk endpoint non-auth)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // lebih longgar untuk endpoint biasa
    message: {
        success: false,
        message: "Too many requests, please try again later"
    },
    skip: (req) => req.path.startsWith('/auth') // skip auth routes karena sudah ada rate limit sendiri
});

app.use(limiter);
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use(router);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

module.exports = app;