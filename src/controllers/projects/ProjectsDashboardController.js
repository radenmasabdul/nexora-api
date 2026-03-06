const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getProjectProgressStats = asyncHandler(async (req, res) => {
    const team_id = req.query.team_id || null; 

    const projects = await prisma.project.findMany({
        where: team_id ? { team_id } : {},
        select: {
            id: true,
            name: true,
            status: true,
            deadline: true,
            tasks: {
                select: { status: true }
            }
        }
    });

    const data = projects.map(project => {
        const totalTasks = project.tasks.length;
        const doneTasks = project.tasks.filter(task => task.status === 'done').length;
        const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
        const isOverdue = project.deadline 
            ? new Date(project.deadline) < new Date() && project.status !== 'completed'
            : false;

        return {
            project_id: project.id,
            project_name: project.name,
            project_status: project.status,
            deadline: project.deadline,
            is_overdue: isOverdue,
            total_tasks: totalTasks,
            done_tasks: doneTasks,
            progress
        };
    });

    res.status(200).json({
        success: true,
        data,
    });
});

module.exports = { getProjectProgressStats };