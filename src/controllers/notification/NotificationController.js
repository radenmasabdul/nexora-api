const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');
const { validationResult } = require('express-validator');

const createNotification = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const { user_id, message, is_read } = req.body;

    const newNotification = await prisma.notification.create({
        data: {
            user_id,
            message,
            is_read,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: newNotification,
    });
});

const getAllNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const whereCondition = search ? { message: { contains: search, mode: 'insensitive'} } : {};

    const totalData = await prisma.notification.count({ where: whereCondition });

    const notifications = await prisma.notification.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    const notificationWithNumber = notifications.map((notification, index) => ({
        ...notification,
        number: skip + index + 1,
    }));

    res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: notificationWithNumber,
    });
});

const getNotificationById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: "Notification not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Notification retrieved successfully",
        data: notification,
    });
});

const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
        where: { id }
    });

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: 'Notification not found'
        });
    }

    const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { is_read: true },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    res.json({
        success: true,
        message: 'Notification marked as read',
        data: updatedNotification
    });
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingNotification = await prisma.notification.findUnique({ where: { id } });
    if (!existingNotification) {
        return res.status(404).json({
            success: false,
            message: 'Notification not found.',
        });
    }

    await prisma.notification.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
    });
});

module.exports = { createNotification, getAllNotifications, getNotificationById, markAsRead, deleteNotification };