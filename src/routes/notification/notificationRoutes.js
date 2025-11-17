const express = require('express');
const router = express.Router();

const { createNotification, getAllNotifications, getNotificationById, markAsRead, deleteNotification } = require('../../controllers/notification/NotificationController');
const { validateCreateNotification } = require('../../utils/validators/notification/notification');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/all', verifyToken, getAllNotifications);
router.get('/:id', verifyToken, getNotificationById);
router.post('/create', verifyToken, validateCreateNotification, createNotification);
router.patch('/:id/read', verifyToken, markAsRead);
router.delete('/delete/:id', verifyToken, deleteNotification);

module.exports = router;