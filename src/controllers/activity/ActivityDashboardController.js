const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getActivityCounts = asyncHandler(async (req, res) => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const activities = await prisma.activityLog.findMany({
        where: {
            created_at: {
                gte: sevenDaysAgo
            },
        },
        select: {
            action: true,
            created_at: true,
        },
        orderBy: {
            created_at: 'asc'
        },
    });

    const result = {};

    activities.forEach(activity => {
        const date = activity.created_at.toISOString().split('T')[0];

        if (!result[date]) {
            result[date] = {};
        }

        if (!result[date][activity.action]) {
            result[date][activity.action] = 0;
        }

        result[date][activity.action] ++;
    });

    const data = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(date.getDate() + i);

        const formattedDate = date.toISOString().split('T')[0];
        data.push({
            date: formattedDate,
            ...result[formattedDate]
        });
    }

    res.status(200).json({
        success: true,
        data
    });
});

module.exports = { getActivityCounts };