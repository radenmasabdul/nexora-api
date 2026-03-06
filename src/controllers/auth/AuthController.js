const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'Email already exists.',
        });
    }

    const validRoles = ['administrator', 'manager_division', 'project_owner', 'staff'];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role value. Allowed: administrator, manager_division, project_owner, staff.',
        });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashPassword,
            role: role || 'staff',
        },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
        success: true,
        message: "Register successfully",
        data: userWithoutPassword,
    });
});

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
            role: true,
            avatar_url: true,
        }
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({
            success: false,
            message: "Invalid password",
        });
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
    );

    const decoded = jwt.decode(token);
    const { password: _, ...userWithoutPassword } = user;

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 12 * 60 * 60 * 1000
    });

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

const logout = asyncHandler(async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
});

module.exports = { register, login, logout };