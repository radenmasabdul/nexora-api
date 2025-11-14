const express = require('express');
const router = express.Router();

const { createMember, getAllMembers, getMemberById, updateMember, deleteMember } = require('../../controllers/member/MemberController');
const { validateCreateTeamMember, validateUpdateTeamMember } = require('../../utils/validators/member/member');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/all', verifyToken, getAllMembers);
router.get('/:id', verifyToken, getMemberById);
router.post('/create', verifyToken, validateCreateTeamMember, createMember);
router.put('/update/:id', verifyToken, validateUpdateTeamMember, updateMember);
router.delete('/delete/:id', verifyToken, deleteMember);

module.exports = router;