const { body } = require('express-validator');

const validateCreateTeam = [
    body('name')
        .trim()
        .notEmpty().withMessage('Team name is required')
        .isLength({ max: 50 }).withMessage('Team name must not exceed 50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Description must not exceed 255 characters'),
];

const validateUpdateTeam = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Team name cannot be empty')
        .isLength({ max: 50 }).withMessage('Team name must not exceed 50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Description must not exceed 255 characters'),
];

module.exports = { validateCreateTeam, validateUpdateTeam };