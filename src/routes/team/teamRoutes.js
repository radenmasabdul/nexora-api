const express = require('express');
const router = express.Router();

const { createTeam, getAllTeams, getTeamsById, updateTeam, deleteTeam, getTeamMembers } = require('../../controllers/team/TeamController')
const { validateCreateTeam, validateUpdateTeam } = require('../../utils/validators/team/team');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/', verifyToken, getAllTeams);
router.get('/:id/members', verifyToken, getTeamMembers);
router.get('/:id', verifyToken, getTeamsById);
router.post('/', verifyToken, validateCreateTeam, createTeam);
router.patch('/:id', verifyToken, validateUpdateTeam, updateTeam);
router.delete('/:id', verifyToken, deleteTeam);

module.exports = router;