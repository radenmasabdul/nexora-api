const { body } = require('express-validator');

const validateCreateTeam = [
    body('name')
        .trim()
        .notEmpty().withMessage('Team name is required')
        .isString().withMessage('Team name must be a string')
        .isLength({ max: 100 }).withMessage('Team name must not exceed 100 characters'),

    body('description')
        .optional()
        .trim()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
];

const validateUpdateTeam = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Team name cannot be empty')
        .isString().withMessage('Team name must be a string')
        .isLength({ max: 100 }).withMessage('Team name must not exceed 100 characters'),

    body('description')
        .optional()
        .trim()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
];

module.exports = { validateCreateTeam, validateUpdateTeam };