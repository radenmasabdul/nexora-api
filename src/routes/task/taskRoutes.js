const express = require('express');
const router = express.Router();

const { createTask, getAllTask, getTaskById, updateTask, deleteTask } = require('../../controllers/task/TaskController');
const { validateCreateTask, validateUpdateTask } = require('../../utils/validators/task/task');
const verifyToken = require('../../middlewares/auth/auth');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task endpoints
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all task
 *     tags: [Tasks]
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
 *         description: Search by title or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [to_do, in_progress, review, done]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                   example: Tasks retrieved successfully
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
 *                       title:
 *                         type: string
 *                         example: Task title
 *                       description:
 *                         type: string
 *                         example: Task description
 *                       priority:
 *                         type: string
 *                         example: high
 *                       status:
 *                         type: string
 *                         example: to_do
 *                       due_date:
 *                         type: string
 *                         format: date-time
 *                       project:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: clxyz123
 *                           name:
 *                             type: string
 *                             example: Project Alpha
 *                       assignedUser:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: clxyz456
 *                           name:
 *                             type: string
 *                             example: John Doe
 *                           email:
 *                             type: string
 *                             example: john@example.com
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
router.get('/', verifyToken, getAllTask);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID task
 *     responses:
 *       200:
 *         description: Task retrieved successfully
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
 *                   example: Task retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clxyz123
 *                     title:
 *                       type: string
 *                       example: Task title
 *                     description:
 *                       type: string
 *                       example: Task description
 *                     priority:
 *                       type: string
 *                       example: high
 *                     status:
 *                       type: string
 *                       example: to_do
 *                     due_date:
 *                       type: string
 *                       format: date-time
 *                     project:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz123
 *                         name:
 *                           type: string
 *                           example: Project Alpha
 *                     assignedUser:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz456
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
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
 *         description: Task not found
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
 *                   example: Task not found
 */
router.get('/:id', verifyToken, getTaskById);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - title
 *               - priority
 *               - status
 *               - due_date
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 example: clxyz123
 *               assign_to:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: clxyz456
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Task title
 *               description:
 *                 type: string
 *                 example: Task description
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: high
 *               status:
 *                 type: string
 *                 enum: [to_do, in_progress, review, done]
 *                 example: to_do
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Task created successfully
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
 *                   example: Task created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clxyz123
 *                     title:
 *                       type: string
 *                       example: Task title
 *                     priority:
 *                       type: string
 *                       example: high
 *                     status:
 *                       type: string
 *                       example: to_do
 *                     due_date:
 *                       type: string
 *                       format: date-time
 *                     project:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz123
 *                         name:
 *                           type: string
 *                           example: Project Alpha
 *                     assignedUser:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz456
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
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
 *         description: Task with the same title already exists
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
 *                   example: Task with the same title already exists in the project
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
router.post('/', verifyToken, validateCreateTask, createTask);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 example: clxyz123
 *               assign_to:
 *                 type: string
 *                 format: uuid
 *                 example: clxyz456
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Updated task title
 *               description:
 *                 type: string
 *                 example: Updated description
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *               status:
 *                 type: string
 *                 enum: [to_do, in_progress, review, done]
 *                 example: in_progress
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Task updated successfully
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
 *                   example: Task updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clxyz123
 *                     title:
 *                       type: string
 *                       example: Updated task title
 *                     priority:
 *                       type: string
 *                       example: medium
 *                     status:
 *                       type: string
 *                       example: in_progress
 *                     due_date:
 *                       type: string
 *                       format: date-time
 *                     project:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz123
 *                         name:
 *                           type: string
 *                           example: Project Alpha
 *                     assignedUser:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: clxyz456
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
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
 *         description: Task not found
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
 *                   example: Task not found
 *       409:
 *         description: Task with the same title already exists
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
 *                   example: Task with the same title already exists in the project
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
router.patch('/:id', verifyToken, validateUpdateTask, updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID task
 *     responses:
 *       200:
 *         description: Task deleted successfully
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
 *                   example: Task deleted successfully
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
 *         description: Task not found
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
 *                   example: Task not found
 */
router.delete('/:id', verifyToken, deleteTask);

module.exports = router;