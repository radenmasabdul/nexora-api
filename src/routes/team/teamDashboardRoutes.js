const express = require('express');
const router = express.Router();

const { getTasksByTeam } = require('../../controllers/team/TeamDashboardController');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/teams', verifyToken, getTasksByTeam);

module.exports = router;