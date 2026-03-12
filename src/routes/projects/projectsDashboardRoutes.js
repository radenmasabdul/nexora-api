const express = require('express');
const router = express.Router();

const { getProjectProgressStats } = require('../../controllers/projects/ProjectsDashboardController');
const verifyToken = require('../../middlewares/auth/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard endpoints
 */

/**
 * @swagger
 * /dashboard/projects/progress:
 *   get:
 *     summary: Get progress statistics for all projects
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *     responses:
 *       200:
 *         description: Project progress stats retrieved successfully
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
 *                       project_id:
 *                         type: string
 *                         example: clxyz123
 *                       project_name:
 *                         type: string
 *                         example: Project Alpha
 *                       project_status:
 *                         type: string
 *                         example: in_progress
 *                       deadline:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       is_overdue:
 *                         type: boolean
 *                         example: false
 *                       total_tasks:
 *                         type: integer
 *                         example: 10
 *                       done_tasks:
 *                         type: integer
 *                         example: 5
 *                       progress:
 *                         type: integer
 *                         example: 50
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
router.get('/progress', verifyToken, getProjectProgressStats);

module.exports = router;