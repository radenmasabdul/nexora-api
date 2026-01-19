const express = require('express');
const router = express.Router();

const { getProjectProgressStats } = require('../../controllers/projects/ProjectsDashboardController');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/progress', verifyToken, getProjectProgressStats);

module.exports = router;