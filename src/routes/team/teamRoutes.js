const express = require('express');
const router = express.Router();

const { createTeam, getAllTeams, getTeamsById, updateTeam, deleteTeam, getTeamMembers } = require('../../controllers/team/TeamController')
const { validateCreateTeam, validateUpdateTeam } = require('../../utils/validators/team/team');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/all', verifyToken, getAllTeams);
router.get('/:id', verifyToken, getTeamsById);
router.get('/:id/members', verifyToken, getTeamMembers);
router.post('/create', verifyToken, validateCreateTeam, createTeam);
router.put('/update/:id', verifyToken, validateUpdateTeam, updateTeam);
router.delete('/delete/:id', verifyToken, deleteTeam);

module.exports = router;