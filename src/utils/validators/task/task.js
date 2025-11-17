const { body } = require('express-validator');

const validateCreateTask = [
    body('project_id')
        .notEmpty().withMessage('Project ID is required')
        .isUUID().withMessage('Project ID must be a valid UUID'),

    body('assign_to')
        .notEmpty().withMessage('Assign To is required')
        .isUUID().withMessage('Assign To must be a valid UUID'),
    
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),

    body('description')
        .optional()
        .isString().withMessage('Description must be a string'),

    body('priority')
        .notEmpty().withMessage('Priority is required')
        .isIn(['low', 'medium', 'high']).withMessage('Priority must be one of: low, medium, high'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be one of: todo, in_progress, done'),

    body('due_date')
        .notEmpty().withMessage('Due Date is required')
        .isISO8601().withMessage('Due Date must be a valid date'),
];

const validateUpdateTask = [
    body('project_id')
        .optional()
        .isUUID().withMessage('Project ID must be a valid UUID'),

    body('assign_to')
        .optional()
        .isUUID().withMessage('Assign To must be a valid UUID'),

    body('title')
        .optional()
        .isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),

    body('description')
        .optional()
        .isString().withMessage('Description must be a string'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high']).withMessage('Priority must be one of: low, medium, high'),

    body('status')
        .optional()
        .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be one of: todo, in_progress, done'),

    body('due_date')
        .optional()
        .isISO8601().withMessage('Due Date must be a valid date'),
];

module.exports = { validateCreateTask, validateUpdateTask };