const express = require('express');
const router = express.Router();

const { createTask, getAllTask, getTaskById, updateTask, deleteTask } = require('../../controllers/task/TaskController');
const { validateCreateTask, validateUpdateTask } = require('../../utils/validators/task/task');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/', verifyToken, getAllTask);
router.get('/:id', verifyToken, getTaskById);
router.post('/', verifyToken, validateCreateTask, createTask);
router.patch('/:id', verifyToken, validateUpdateTask, updateTask);
router.delete('/:id', verifyToken, deleteTask);

module.exports = router;