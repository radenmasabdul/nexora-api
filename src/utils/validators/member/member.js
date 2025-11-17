const { body } = require('express-validator');

const validateCreateTeamMember = [
    body('team_id')
        .notEmpty().withMessage('Team ID is required')
        .isUUID().withMessage('Team ID must be a valid UUID'),

    body('user_id')
        .notEmpty().withMessage('User ID is required')
        .isUUID().withMessage('User ID must be a valid UUID'),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['owner', 'lead', 'member'])
        .withMessage('Invalid role value. Allowed roles: owner, lead, member.'),
]

const validateUpdateTeamMember = [
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['owner', 'lead', 'member'])
        .withMessage('Invalid role value. Allowed roles: owner, lead, member.'), 
]

module.exports = { validateCreateTeamMember, validateUpdateTeamMember };