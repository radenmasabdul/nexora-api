const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getActivityCounts = asyncHandler(async (req, res) => {
    const range = req.query.range || 'week';

    const today = new Date();
    let startDate = new Date();
    let endDate = null;
    const periods = [];

    switch (range) {
        case 'day':
            startDate = new Date(today);
            periods.push(startDate.toISOString().split('T')[0]);
            break;
        case 'week':
            startDate.setDate(today.getDate() - 6);

            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                periods.push(date.toISOString().split('T')[0]);
            }
            break;
        case 'month':
            startDate.setDate(today.getDate() - 29);

            for (let i = 0; i < 30; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                periods.push(date.toISOString().split('T')[0]);
            }
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59);

            for (let i = 0; i < 12; i++) {
                periods.push(`${today.getFullYear()}-${String(i + 1).padStart(2, '0')}`);
            }
            break;
        default:
            return res.status(400).json({ error: 'Invalid range parameter' });
    }

    const activities = await prisma.activityLog.findMany({
        where: {
            created_at: {
                gte: startDate,
                ...(range === 'year' && { lte: endDate })
            }
        },
        select: {
            action: true,
            created_at: true
        }
    });

    const result = {};
    
    activities.forEach(activity => {
        const dateObj = new Date(activity.created_at);
        
        let key;
        
        if (range === 'year') {
            key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = dateObj.toISOString().split('T')[0];
        }

        if (!result[key]) result[key] = { total: 0 };
        if (!result[key][activity.action]) result[key][activity.action] = 0;

        result[key][activity.action]++;
        result[key].total++;
    });

    const data = periods.map(p => ({
        period: p,
        ...(result[p] || { total: 0 })
    }));

    res.status(200).json({
        success: true,
        data
    });
});

module.exports = { getActivityCounts };
