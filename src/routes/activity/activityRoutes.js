const express = require('express');
const router = express.Router();

const { getAllActivityLogs, getActivityLogById, createActivityLog, deleteActivityLog} = require('../../controllers/activity/ActivityLogController');
const { validateCreateActivity } = require('../../utils/validators/activity/activity');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/all', verifyToken, getAllActivityLogs);
router.get('/:id', verifyToken, getActivityLogById);
router.post('/create', verifyToken, validateCreateActivity, createActivityLog);
router.delete('/delete/:id', verifyToken, deleteActivityLog);

module.exports = router;