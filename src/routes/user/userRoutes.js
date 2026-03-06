const express = require('express');
const router = express.Router();

const { createUser, getAllUsers, getUserById, updateUser, deleteUser, getRoleCounts} = require('../../controllers/user/UserController');
const { validateCreateUser, validateUpdateUser } = require('../../utils/validators/user/user');
const verifyToken = require('../../middlewares/auth/auth');
const roleMiddleware = require('../../middlewares/role/role');
const uploadAvatar = require('../../middlewares/stores/uploadAvatar');

router.get('/', verifyToken, getAllUsers);
router.get('/roles/counts', verifyToken, getRoleCounts);
router.get('/:id', verifyToken, getUserById);
router.post('/', verifyToken, roleMiddleware(['administrator', 'manager_division']), validateCreateUser, createUser);
router.patch('/:id', verifyToken, uploadAvatar.single("avatar"), validateUpdateUser, updateUser);
router.delete('/:id', verifyToken, roleMiddleware(['administrator', 'manager_division']), deleteUser);

module.exports = router;