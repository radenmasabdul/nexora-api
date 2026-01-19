const express = require('express');
const router = express.Router();

const { getActivityCounts } = require('../../controllers/activity/ActivityDashboardController');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/counts', verifyToken, getActivityCounts);

module.exports = router;