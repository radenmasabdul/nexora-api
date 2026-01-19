const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getActivityCounts = asyncHandler(async (req, res) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const activities = await prisma.activity.findMany({
        where: {
            createdAt: {
                gte: sevenDaysAgo
            },
        },
        select: {
            type: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'asc'
        },
    });

    const result = {};

    activities.forEach(activity => {
        const date = activity.createdAt.toISOString().split('T')[0];

        if (!result[date]) {
            result[date] = {};
        }

        if (!result[date][activity.type]) {
            result[date][activity.type] = 0;
        }

        result[date][activity.type] ++;
    });

    const data = Object.keys(result).map(date => ({
        date,
        ...result[date]
    }));

    res.status(200).json({
        success: true,
        data
    });
});

module.exports = { getActivityCounts };