const prisma = require('../../../prisma/client');
const asyncHandler = require('../../utils/handlers/asyncHandler');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const createUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const { name, email, password, role, avatar_url } = req.body;
    const validRoles = ['admin', 'manager', 'member'];

    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role value. Allowed roles: admin, manager, member.',
        });
    };

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'Email already exists.',
        });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashPassword,
            role,
            avatar_url: avatar_url || null,
        },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
        success: true,
        message: "User created successfully",
        data: userWithoutPassword,
    });
});

const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || null;

    const whereCondition = {
        ...(
            search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}
        ),
        ...(role ? { role } : {}),
    };

    const totalData = await prisma.user.count({ where: whereCondition });

    const users = await prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar_url: true,
            created_at: true,
            updated_at: true,
        },
    });

    const userWithNumber = users.map((user, index) => ({
        no: skip + index + 1,
        ...user,
    }));

    res.status(200).json({
        success: true,
        message: "Get all users successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: userWithNumber,
    });
});

const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar_url: true,
            created_at: true,
            updated_at: true,
        },
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Get user successfully",
        data: user,
    });
});

const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    };

    const { name, email, password, role, avatar_url } = req.body;
    const validRoles = ['admin', 'manager', 'member'];

    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role value. Allowed roles: admin, manager, member.',
        });
    };

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
        return res.status(404).json({
            success: false,
            message: 'User not found.',
        });
    };

    if (email && email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email } });

        if (emailTaken) {
            return res.status(409).json({
                success: false,
                message: 'Email already in use by another user.',
            });
        }
    };

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            name,
            email,
            role,
            avatar_url: avatar_url || null,
            ...(hashedPassword && { password: hashedPassword }),
        },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: userWithoutPassword,
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
        return res.status(404).json({
            success: false,
            message: "User not found.",
        });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

const getRoleCounts = asyncHandler(async (req, res) => {
    const roleCounts = await prisma.user.groupBy({
        by: ['role'],
        _count: {
            role: true
        },
        orderBy: {
            role: 'asc'
        }
    });

    const formatted = roleCounts.reduce((acc,item) => {
        acc[item.role] = item._count.role;
        return acc;
    }, {})

    res.status(200).json({
        success: true,
        message: "Get role counts successfully",
        data: formatted,
    });
})

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, getRoleCounts };