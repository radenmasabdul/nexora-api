const express = require('express');
const router = express.Router();

const { login, logout, register } = require('../../controllers/auth/AuthController');
const { validateRegister, validateLogin } = require('../../utils/validators/auth/auth');
const { loginLimiter, registerLimiter } = require('../../middlewares/auth/rateLimiter');
const verifyToken = require('../../middlewares/auth/auth');

router.post("/register", registerLimiter, validateRegister, register);
router.post("/login", loginLimiter, validateLogin, login);
router.post("/logout", verifyToken, logout);

module.exports = router;