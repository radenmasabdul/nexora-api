const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getProjectProgressStats = asyncHandler(async (req, res) => {
    const projects = await prisma.projects.findMany({
        select: {
            id: true,
            name: true,
            tasks: {
                select: {
                    status: true
                }
            }
        }
    });

    const data = projects.map(project => {
        const totalTasks = project.tasks.length;
        const doneTasks = project.tasks.filter(task => task.status === 'done').length;
        const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

        return {
            project_id: project.id,
            project_name: project.name,
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