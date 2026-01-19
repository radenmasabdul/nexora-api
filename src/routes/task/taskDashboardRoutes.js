const express = require('express');
const router = express.Router();

const { getTaskStatusStats, getTaskPriorityStats, getTaskWorkloadStats } = require('../../controllers/task/taskDashboardController');

router.get('/status', getTaskStatusStats);
router.get('/priority', getTaskPriorityStats);
router.get('/workload', getTaskWorkloadStats);

module.exports = router;