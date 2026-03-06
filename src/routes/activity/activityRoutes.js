const express = require('express');
const router = express.Router();

const { getAllActivityLogs, getActivityLogById } = require('../../controllers/activity/ActivityLogController');
const verifyToken = require('../../middlewares/auth/auth');
const roleMiddleware = require('../../middlewares/role/role');

router.get('/', verifyToken, roleMiddleware(['administrator', 'manager_division']), getAllActivityLogs);
router.get('/:id', verifyToken, roleMiddleware(['administrator', 'manager_division']), getActivityLogById);

module.exports = router;