const express = require('express');
const router = express.Router();

const { getActivityCounts } = require('../../controllers/activity/ActivityDashboardController');
const verifyToken = require('../../middlewares/auth/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard endpoints
 */

/**
 * @swagger
 * /dashboard/activities/counts:
 *   get:
 *     summary: Get the number of activities per period
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: week
 *         description: Time range for displaying activity data
 *     responses:
 *       200:
 *         description: Activity counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                         example: "2026-03-12"
 *                       total:
 *                         type: integer
 *                         example: 10
 *                       CREATE:
 *                         type: integer
 *                         example: 5
 *                       UPDATE:
 *                         type: integer
 *                         example: 3
 *                       DELETE:
 *                         type: integer
 *                         example: 2
 *       400:
 *         description: Invalid range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid range. Allowed: day, week, month, year"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.get('/counts', verifyToken, getActivityCounts);

module.exports = router;