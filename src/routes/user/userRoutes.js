const express = require('express');
const router = express.Router();

const { createUser, getAllUsers, getUserById, updateUser, deleteUser } = require('../../controllers/user/UserController');
const { validateCreateUser, validateUpdateUser } = require('../../utils/validators/user/user');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/all', verifyToken, getAllUsers);
router.get('/:id', verifyToken, getUserById);
router.post('/create', verifyToken, validateCreateUser, createUser);
router.put('/update/:id', verifyToken, validateUpdateUser, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);

module.exports = router;