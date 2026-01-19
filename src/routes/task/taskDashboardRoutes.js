const express = require('express');
const router = express.Router();

const { getTaskStatusStats, getTaskPriorityStats, getTaskWorkloadStats } = require('../../controllers/task/TaskDashboardController');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/status', verifyToken, getTaskStatusStats);
router.get('/priority', verifyToken, getTaskPriorityStats);
router.get('/workload', verifyToken, getTaskWorkloadStats);

module.exports = router;