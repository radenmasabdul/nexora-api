const { body } = require('express-validator');

const validateCreateComment = [
    body('task_id')
        .notEmpty().withMessage('Task ID is required')
        .isUUID().withMessage('Task ID must be a valid UUID'),

    body('content')
        .notEmpty().withMessage('Content is required')
        .isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
];

module.exports = { validateCreateComment };