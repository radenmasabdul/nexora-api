const { body } = require('express-validator');

const validateCreateProject = [
    body('team_id')
        .notEmpty().withMessage('Team ID is required')
        .isUUID().withMessage('Team ID must be a valid UUID'),

    body('name')
        .notEmpty().withMessage('Project name is required')
        .isLength({ max: 100 }).withMessage('Project name cannot exceed 100 characters'),

    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['planning', 'in_progress', 'completed', 'on_hold'])
        .withMessage('Invalid status value. Allowed values: planning, in_progress, completed, on_hold'),

    body('deadline')
        .notEmpty().withMessage('Deadline is required')
        .isISO8601().withMessage('Deadline must be a valid date'),
];

const validateUpdateProject = [
    body('team_id')
        .notEmpty().withMessage('Team ID is required')
        .isUUID().withMessage('Team ID must be a valid UUID'),

    body('name')
        .notEmpty().withMessage('Project name is required')
        .isLength({ max: 100 }).withMessage('Project name cannot exceed 100 characters'),

    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['planning', 'in_progress', 'completed', 'on_hold'])
        .withMessage('Invalid status value. Allowed values: planning, in_progress, completed, on_hold'),

    body('deadline')
        .notEmpty().withMessage('Deadline is required')
        .isISO8601().withMessage('Deadline must be a valid date'),
];

module.exports = { validateCreateProject, validateUpdateProject };