const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getAllNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const whereCondition = {
        user_id: req.user.id,
        ...(search ? { message: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [totalData, notifications] = await Promise.all([
        prisma.notification.count({ where: whereCondition }),
        prisma.notification.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        })
    ]);

    res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: notifications.map((n, index) => ({ no: skip + index + 1, ...n })),
    });
});

const getNotificationById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });

    if (!notification) {
        return res.status(404).json({ 
            success: false, 
            message: "Notification not found" 
        });
    }

    if (notification.user_id !== req.user.id) {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied" 
        });
    }

    res.status(200).json({ 
        success: true, 
        message: "Notification retrieved successfully",
        data: notification 
    });
});

const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
        return res.status(404).json({ 
            success: false, 
            message: 'Notification not found' 
        });
    }

    if (notification.user_id !== req.user.id) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied' 
        });
    }

    if (notification.is_read) {
        return res.json({
            success: true,
            message: 'Notification already marked as read',
            data: notification,
        });
    }

    const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { is_read: true },
        include: { 
            user: { select: { id: true, name: true, email: true } } 
        }
    });

    res.json({ 
        success: true, 
        message: 'Notification marked as read', 
        data: updatedNotification 
    });
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
        where: { 
            user_id: req.user.id, 
            is_read: false
        },
        data: { is_read: true },
    });

    res.json({ 
        success: true, 
        message: 'All notifications marked as read' 
    });
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
        return res.status(404).json({ 
            success: false, 
            message: 'Notification not found' 
        });
    }

    if (notification.user_id !== req.user.id) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied' 
        });
    }

    await prisma.notification.delete({ where: { id } });

    res.status(200).json({ 
        success: true, 
        message: "Notification deleted successfully" 
    });
});

const createNotification = async ({ user_id, message }) => {
    return await prisma.notification.create({
        data: { user_id, message, is_read: false }
    });
};

module.exports = {
    getAllNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
};