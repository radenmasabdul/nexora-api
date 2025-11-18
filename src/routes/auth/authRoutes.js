const express = require('express');
const router = express.Router();

const { register } = require('../../controllers/auth/RegisterController');
const { login } = require('../../controllers/auth/LoginController');
const { logout } = require('../../controllers/auth/LogoutController');
const { validateRegister, validateLogin } = require('../../utils/validators/auth/auth');
const { loginLimiter, registerLimiter } = require('../../middlewares/auth/rateLimiter');

router.post("/register", registerLimiter, validateRegister, register);
router.post("/login", loginLimiter, validateLogin, login);
router.post("/logout", logout);

module.exports = router;