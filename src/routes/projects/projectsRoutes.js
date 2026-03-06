const express = require('express');
const router = express.Router();

const { createProject, getAllProjects, getProjectById, updateProject, deleteProject } = require('../../controllers/projects/ProjectsController');
const { validateCreateProject, validateUpdateProject } = require('../../utils/validators/projects/projects');
const verifyToken = require('../../middlewares/auth/auth');

router.get('/', verifyToken, getAllProjects);
router.get('/:id', verifyToken, getProjectById);
router.post('/', verifyToken, validateCreateProject, createProject);
router.patch('/:id', verifyToken, validateUpdateProject, updateProject);
router.delete('/:id', verifyToken, deleteProject);

module.exports = router;