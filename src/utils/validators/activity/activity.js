const { body } = require('express-validator');

const validateCreateActivity = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isLength({ min: 1, max: 225 })
    .withMessage('Action must be between 1 and 225 characters'),
  
  body('entity_type')
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn(['task', 'project', 'team', 'comment', 'user'])
    .withMessage('Entity type must be one of: task, project, team, comment, user'),
  
  body('entity_id')
    .notEmpty()
    .withMessage('Entity ID is required')
    .isUUID()
    .withMessage('Entity ID must be a valid UUID')
];

module.exports = { validateCreateActivity };