require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const multer = require("multer");
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

const allowedOrigins = [
  'http://localhost:5173',
  'https://nexora-theta-lemon.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(router);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 2MB.',
      });
    }
    
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed.',
    });
  }

  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
  
});

module.exports = app;