const express = require('express');
const router = express.Router();

const { getAllNotifications, getNotificationById, markAsRead, markAllAsRead, deleteNotification } = require('../../controllers/notification/NotificationController');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/', verifyToken, getAllNotifications);
router.get('/:id', verifyToken, getNotificationById);
router.patch('/read-all', verifyToken, markAllAsRead);
router.patch('/:id/read', verifyToken, markAsRead);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;