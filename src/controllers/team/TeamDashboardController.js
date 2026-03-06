const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getTasksByTeam = asyncHandler(async (req, res) => {
    const team_id = req.query.team_id || null;

    const teams = await prisma.team.findMany({
        where: team_id ? { id: team_id } : {},
        select: {
            id: true,
            name: true,
            _count: {
                select: { members: true }
            },
            projects: {
                select: {
                    id: true,
                    tasks: {
                        select: { id: true }
                    }
                }
            }
        }
    });

    const data = teams.map(team => {
        const taskCount = team.projects.reduce((acc, project) => {
            return acc + project.tasks.length;
        }, 0);

        return {
            team_id: team.id,
            team_name: team.name,
            member_count: team._count.members,
            project_count: team.projects.length,
            task_count: taskCount
        };
    });

    res.status(200).json({
        success: true,
        data
    });
});

module.exports = { getTasksByTeam };