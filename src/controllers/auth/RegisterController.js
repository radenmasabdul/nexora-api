const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const prisma = require('../../../prisma/client/index.js');
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

    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });
    
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "User with this email already exists",
        });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashPassword,
            role: role || 'ADMIN',
        },
    });
    
    console.log(`New user registered: ${email}`);

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: userWithoutPassword,
    });
});

module.exports = { register };