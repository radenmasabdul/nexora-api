const express = require('express');
const router = express.Router();

const { createProject, getAllProjects, getProjectById, updateProject, deleteProject } = require('../../controllers/projects/ProjectsController');
const { validateCreateProject, validateUpdateProject } = require('../../utils/validators/projects/projects');
const verifyToken = require('../../middlewares/auth/auth');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project endpoints
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page you want to display
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Amount of data per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed]
 *         description: Filter by status
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Projects retrieved successfully
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalData:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       no:
 *                         type: integer
 *                         example: 1
 *                       id:
 *                         type: string
 *                         example: clxyz123
 *                       name:
 *                         type: string
 *                         example: Project Alpha
 *                       description:
 *                         type: string
 *                         example: Project description
 *                       status:
 *                         type: string
 *                         example: planning
 *                       deadline:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       team:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: clxyz123
 *                           name:
 *                             type: string
 *                             example: Team Alpha
 *                           description:
 *                             type: string
 *                             example: Team description
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
router.get('/', verifyToken, getAllProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID project
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clxyz123
 *                     name:
 *                       type: string
 *                       example: Project Alpha
 *                     description:
 *                       type: string
 *                       example: Project description
 *                     status:
 *                       type: string
 *                       example: planning
 *                     deadline:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     team:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz123
 *                         name:
 *                           type: string
 *                           example: Team Alpha
 *                         description:
 *                           type: string
 *                           example: Team description
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
 *       404:
 *         description: Project not found
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
 *                   example: Project not found
 */
router.get('/:id', verifyToken, getProjectById);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_id
 *               - name
 *               - status
 *               - deadline
 *             properties:
 *               team_id:
 *                 type: string
 *                 format: uuid
 *                 example: clxyz123
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Project Alpha
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Project description
 *               status:
 *                 type: string
 *                 enum: [planning, in_progress, on_hold, completed]
 *                 example: planning
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clxyz123
 *                     name:
 *                       type: string
 *                       example: Project Alpha
 *                     description:
 *                       type: string
 *                       example: Project description
 *                     status:
 *                       type: string
 *                       example: planning
 *                     deadline:
 *                       type: string
 *                       format: date-time
 *                     team:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz123
 *                         name:
 *                           type: string
 *                           example: Team Alpha
 *                         description:
 *                           type: string
 *                           example: Team description
 *       400:
 *         description: Invalid status value
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
 *                   example: "Invalid status value. Allowed statuses: planning, in_progress, on_hold, completed"
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
 *       404:
 *         description: Team not found
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
 *                   example: Team not found
 *       409:
 *         description: Project with the same name already exists
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
 *                   example: Project with the same name already exists in the team.
 *       422:
 *         description: Validation error
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
 *                   example: Validation error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.post('/', verifyToken, validateCreateProject, createProject);

/**
 * @swagger
 * /projects/{id}:
 *   patch:
 *     summary: Update project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               team_id:
 *                 type: string
 *                 format: uuid
 *                 example: clxyz123
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Project Alpha Updated
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated description
 *               status:
 *                 type: string
 *                 enum: [planning, in_progress, on_hold, completed]
 *                 example: in_progress
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clxyz123
 *                     name:
 *                       type: string
 *                       example: Project Alpha Updated
 *                     status:
 *                       type: string
 *                       example: in_progress
 *                     deadline:
 *                       type: string
 *                       format: date-time
 *                     team:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz123
 *                         name:
 *                           type: string
 *                           example: Team Alpha
 *                         description:
 *                           type: string
 *                           example: Team description
 *       400:
 *         description: Invalid status value
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
 *                   example: "Invalid status value. Allowed statuses: planning, in_progress, on_hold, completed"
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
 *       404:
 *         description: Project not found
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
 *                   example: Project not found
 *       409:
 *         description: Project with the same name already exists
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
 *                   example: Project with the same name already exists in the team
 *       422:
 *         description: Validation error
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
 *                   example: Validation error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.patch('/:id', verifyToken, validateUpdateProject, updateProject);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID project
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully
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
 *       404:
 *         description: Project not found
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
 *                   example: Project not found
 */
router.delete('/:id', verifyToken, deleteProject);

module.exports = router;