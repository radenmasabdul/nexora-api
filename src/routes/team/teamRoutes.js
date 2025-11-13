const express = require('express');
const router = express.Router();

const { createTeam, getAllTeams, getTeamById, updateTeam, deleteTeam } = require('../../controllers/team/TeamController');
const { validateCreateTeam, validateUpdateTeam } = require('../../utils/validators/team/team');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/all', verifyToken, getAllTeams);
router.get('/:id', verifyToken, getTeamById);
router.post('/create', verifyToken, validateCreateTeam, createTeam);
router.put('/update/:id', verifyToken, validateUpdateTeam, updateTeam);
router.delete('/delete/:id', verifyToken, deleteTeam);

module.exports = router;