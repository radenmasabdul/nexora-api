const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');

const login = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
        }
    })

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined');
        return res.status(500).json({
            success: false,
            message: "Server configuration error",
        });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "12h",
    });

    const decoded = jwt.decode(token);
    const { password: _, ...userWithoutPassword } = user;
    
    console.log(`User ${user.email} logged in successfully`);

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            user: userWithoutPassword,
            token,
            expiresAt: decoded.exp,
        }
    });
});

module.exports = { login };