const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const prisma = require('../../../prisma/client');
const asyncHandler = require('../../utils/handlers/asyncHandler');

const register = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const hashPassword = await bcrypt.hash(req.body.password, 10);

    const user = await prisma.user.create({
        data: {
            name: req.body.name,
            email: req.body.email,
            password: hashPassword,
            role: req.body.role || 'ADMIN',
        },
    });

    const { password, ...userWithoutPassword } = user;

    res.status(201).json({
        success: true,
        message: "Register successfully",
        data: userWithoutPassword,
    });
});

module.exports = { register };