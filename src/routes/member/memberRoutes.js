const express = require('express');
const router = express.Router();

const { createMember, getAllMembers, getMemberById, updateMember, deleteMember } = require('../../controllers/member/MemberController');
const { validateCreateTeamMember, validateUpdateTeamMember } = require('../../utils/validators/member/member');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/', verifyToken, getAllMembers);
router.get('/:id', verifyToken, getMemberById);
router.post('/', verifyToken, validateCreateTeamMember, createMember);
router.patch('/:id', verifyToken, validateUpdateTeamMember, updateMember);
router.delete('/:id', verifyToken, deleteMember);

module.exports = router;