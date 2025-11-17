const express = require('express');
const router = express.Router();

const { createComment, getAllComment, getCommentById, updateComment, deleteComment } = require('../../controllers/comment/CommentController');
const { validateCreateComment, validateUpdateComment } = require('../../utils/validators/comments/comments');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/all', verifyToken, getAllComment);
router.get('/:id', verifyToken, getCommentById);
router.post('/create', verifyToken, validateCreateComment, createComment);
router.put('/update/:id', verifyToken, validateUpdateComment, updateComment);
router.delete('/delete/:id', verifyToken, deleteComment);

module.exports = router;