const express = require('express');
const router = express.Router();

const { register } = require('../../controllers/auth/RegisterController');
const { login } = require('../../controllers/auth/LoginController');
const { validateRegister, validateLogin } = require('../../utils/validators/auth/auth');

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

module.exports = router;