const express = require('express');
const router = express.Router();

const { createUser, getAllUsers, getUserById, updateUser, deleteUser, getRoleCounts} = require('../../controllers/user/UserController');
const { validateCreateUser, validateUpdateUser } = require('../../utils/validators/user/user');
const verifyToken = require('../../middlewares/auth/auth');
const uploadAvatar = require('../../middlewares/stores/uploadAvatar');

router.get('/all', verifyToken, getAllUsers);
router.get('/:id', verifyToken, getUserById);
router.post('/create', verifyToken, validateCreateUser, createUser);
router.put('/update/:id', uploadAvatar.single("avatar"), verifyToken, validateUpdateUser, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);
router.get('/roles/counts', verifyToken, getRoleCounts);

module.exports = router;