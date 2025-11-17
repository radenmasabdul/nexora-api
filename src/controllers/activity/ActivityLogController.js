const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');
const { validationResult } = require('express-validator');

const createActivityLog = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }

    const { user_id, action, entity_id, entity_type } = req.body;

    const activityLog = await prisma.activityLog.create({
        data: {
            user_id,
            action,
            entity_id,
            entity_type,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    res.status(201).json({
        success: true,
        message: "Activity log created successfully",
        data: activityLog,
    });
});

const getAllActivityLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, user_id, entity_type } = req.query;
    
    const where = {};
    if (user_id) where.user_id = user_id;
    if (entity_type) where.entity_type = entity_type;

    const activityLogs = await prisma.activityLog.findMany({
        where,
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
    });

    const total = await prisma.activityLog.count({ where });

    res.json({
        success: true,
        data: activityLogs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

const getActivityLogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const activityLog = await prisma.activityLog.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    if (!activityLog) {
        return res.status(404).json({
            success: false,
            message: "Activity log not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Activity log retrieved successfully",
        data: activityLog,
    });
});

const deleteActivityLog = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const activityLog = await prisma.activityLog.findUnique({
        where: { id }
    });

    if (!activityLog) {
        return res.status(404).json({
            success: false,
            message: 'Activity log not found'
        });
    }

    await prisma.activityLog.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: 'Activity log deleted successfully'
    });
});

module.exports = { getAllActivityLogs, getActivityLogById, createActivityLog, deleteActivityLog };