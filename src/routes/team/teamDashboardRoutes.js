const express = require('express');
const router = express.Router();

const { getTasksByTeam } = require('../../controllers/team/TeamDashboardController');
const verifyToken = require('../../middlewares/auth/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard endpoints
 */

/**
 * @swagger
 * /dashboard/teams:
 *   get:
 *     summary: Get statistik task per team
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
 *         description: Team stats retrieved successfully
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
 *                       team_id:
 *                         type: string
 *                         example: clxyz123
 *                       team_name:
 *                         type: string
 *                         example: Team Alpha
 *                       member_count:
 *                         type: integer
 *                         example: 5
 *                       project_count:
 *                         type: integer
 *                         example: 3
 *                       task_count:
 *                         type: integer
 *                         example: 20
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
router.get('/', verifyToken, getTasksByTeam);

module.exports = router;