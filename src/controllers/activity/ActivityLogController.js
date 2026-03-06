const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');

const getAllActivityLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const user_id = req.query.user_id || null;
    const entity_type = req.query.entity_type || null;

    const whereCondition = {
        ...(user_id ? { user_id } : {}),
        ...(entity_type ? { entity_type } : {}),
    };

    const [totalData, activityLogs] = await Promise.all([
        prisma.activityLog.count({ where: whereCondition }),
        prisma.activityLog.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
        })
    ]);

    const activityLogsWithNumber = activityLogs.map((log, index) => ({
        no: skip + index + 1,
        ...log,
    }));

    res.status(200).json({
        success: true,
        message: "Activity logs retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: activityLogsWithNumber,
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

const logActivity = async ({ user_id, action, entity_type, entity_id }) => {
    return await prisma.activityLog.create({
        data: { user_id, action, entity_type, entity_id }
    });
};

module.exports = { getAllActivityLogs, getActivityLogById, logActivity };