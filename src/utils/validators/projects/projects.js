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
        .isIn(['planning', 'in_progress', 'on_hold', 'completed'])
        .withMessage('Invalid status value. Allowed values: planning, in_progress, on_hold, completed'),

    body('deadline')
        .notEmpty().withMessage('Deadline is required')
        .isISO8601().withMessage('Deadline must be a valid date'),
];

const validateUpdateProject = [
    body('team_id')
        .optional()
        .isUUID().withMessage('Team ID must be a valid UUID'),

    body('name')
        .optional()
        .isLength({ max: 100 }).withMessage('Project name cannot exceed 100 characters'),

    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

    body('status')
        .optional()
        .isIn(['planning', 'in_progress', 'on_hold', 'completed'])
        .withMessage('Invalid status value. Allowed values: planning, in_progress, on_hold, completed'),

    body('deadline')
        .optional()
        .isISO8601().withMessage('Deadline must be a valid date'),

    body().custom((value, { req }) => {
        const { team_id, name, description, status, deadline } = req.body;
        if (!team_id && !name && !description && !status && !deadline) {
            throw new Error('At least one field must be provided for update');
        }
        return true;
    }),
];

module.exports = { validateCreateProject, validateUpdateProject };