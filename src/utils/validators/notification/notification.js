const { body } = require('express-validator');

const validateCreateNotification = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  body('is_read')
    .optional()
    .isBoolean()
    .withMessage('is_read must be a boolean value')
];

module.exports = { validateCreateNotification };