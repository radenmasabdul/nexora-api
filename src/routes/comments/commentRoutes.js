const express = require('express');
const router = express.Router();

const { createComment, getAllComment, getCommentById, deleteComment } = require('../../controllers/comment/CommentController');
const { validateCreateComment } = require('../../utils/validators/comments/comments');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/', verifyToken, getAllComment);
router.get('/:id', verifyToken, getCommentById);
router.post('/', verifyToken, validateCreateComment, createComment);
router.delete('/:id', verifyToken, deleteComment);

module.exports = router;