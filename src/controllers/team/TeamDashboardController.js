const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');

const getTasksByTeam = asyncHandler(async (req, res) => {
    const teams = await prisma.team.findMany({
        select: {
            id: true,
            name: true,
            projects: {
                select: {
                    tasks: {
                        select: {
                            id: true,
                        }
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
            task_count: taskCount
        };
    });

    res.status(200).json({
        success: true,
        data
    });
});

module.exports = { getTasksByTeam };