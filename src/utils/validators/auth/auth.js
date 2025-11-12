const { body } = require('express-validator');
const prisma = require('../../../../prisma/client');

const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long')
        .isLength({ max: 25 }).withMessage('Name must be at most 25 characters long'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .custom(async (email) => {
            const user = await prisma.user.findUnique({ where: { email } });

            if (user) {
                throw new Error('Email already in use');
            }

            return true;
        }),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[\W_]/).withMessage('Password must contain at least one special character'),
    body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'manager', 'member']).withMessage('Role must be either admin, manager, or member'),
]

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
]

module.exports = { validateRegister, validateLogin };