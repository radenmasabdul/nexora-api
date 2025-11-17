const { body } = require('express-validator');

const validateCreateComment = [
    body('task_id')
        .notEmpty().withMessage('Task ID is required')
        .isUUID().withMessage('Task ID must be a valid UUID'),

    body('user_id')
        .notEmpty().withMessage('User ID is required')
        .isUUID().withMessage('User ID must be a valid UUID'),

    body('content')
        .notEmpty().withMessage('Content is required')
        .isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
];

const validateUpdateComment = [
    body('task_id')
        .optional()
        .isUUID().withMessage('Task ID must be a valid UUID'),

    body('user_id')
        .optional()
        .isUUID().withMessage('User ID must be a valid UUID'),

    body('content')
        .optional()
        .notEmpty().withMessage('Content cannot be empty')
        .isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
        
    body().custom((value, { req }) => {
        if (!req.body.task_id && !req.body.user_id && !req.body.content) {
            throw new Error('At least one field must be provided for update');
        }
        return true;
    })
];

module.exports = { validateCreateComment, validateUpdateComment };