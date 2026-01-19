const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getTaskStatusStats = asyncHandler(async (req, res) => {
    const stats = await prisma.task.groupBy({
        by: ['status'],
        _count: {
            status: true,
        },
    })

    res.status(200).json({
        success: true,
        data: stats.map(item => ({
            status: item.status,
            count: item._count.status
        }))
    });
});

const getTaskPriorityStats = asyncHandler(async (req, res) => {
    const stats = await prisma.task.groupBy({
        by: ['priority'],
        _count: {
            priority: true,
        },
    })

    res.status(200).json({
        success: true,
        data: stats.map(item => ({
            priority: item.priority,
            count: item._count.priority
        }))
    });
})

const getTaskWorkloadStats = asyncHandler(async (req, res) => {
    const stats = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    assignedTasks: {
                        where: {
                            status: {
                                in: ['todo', 'in_progress'],
                            }
                        }
                    }
                }
            }
        }
    })

    res.status(200).json({
        success: true,
        data: stats.map(user => ({
            user_id: user.id,
            name: user.name,
            workload: user._count.assignedTasks
        }))
    })
})

module.exports = { getTaskStatusStats, getTaskPriorityStats, getTaskWorkloadStats }