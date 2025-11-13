const { body } = require('express-validator');

const validateCreateUser = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 25 }).withMessage('Name must not exceed 25 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is invalid'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[\W_]/).withMessage('Password must contain at least one special character'),

    body('role')
        .optional()
        .isIn(['admin', 'manager', 'member'])
        .withMessage('Invalid role value. Allowed roles: admin, manager, member.'),
];

const validateUpdateUser = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ max: 25 }).withMessage('Name must not exceed 25 characters'),

    body('email')
        .optional()
        .trim()
        .notEmpty().withMessage('Email cannot be empty')
        .isEmail().withMessage('Email is invalid'),

    body('password')
        .optional()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[\W_]/).withMessage('Password must contain at least one special character'),

    body('role')
        .optional()
        .isIn(['admin', 'manager', 'member'])
        .withMessage('Invalid role value. Allowed roles: admin, manager, member.'),
];

module.exports = { validateCreateUser, validateUpdateUser };