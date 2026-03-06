const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');
const { validationResult } = require('express-validator');
const { notifyTeamCreation, notifyTeamDeletion } = require('../../utils/helpers/notificationHelper');
const { logActivity } = require('../activity/ActivityLogController.js');

const createTeam = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const { name, description } = req.body;
    const creatorId = req.user.id;

    const existingTeam = await prisma.team.findUnique({ where: { name } });

    if (existingTeam) {
        return res.status(409).json({
            success: false,
            message: 'Team name already taken.',
        });
    }
    
    const newTeam = await prisma.team.create({
        data: {
            name,
            description,
            createdBy: { connect: { id: creatorId } },
        },
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
        },
    });

    await notifyTeamCreation(newTeam.id, creatorId);

    await logActivity({
        user_id: req.user.id,
        action: 'team_created',
        entity_type: 'team',
        entity_id: newTeam.id,
    });

    res.status(201).json({
        success: true,
        message: "Team created successfully",
        data: newTeam,
    });
});

const getAllTeams = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const whereCondition = search
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [totalData, teams] = await Promise.all([
        prisma.team.count({ where: whereCondition }),
        prisma.team.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { created_at: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                created_at: true,
                updated_at: true,
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { members: true } }
            },
        })
    ]);

    res.status(200).json({
        success: true,
        message: "Teams retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: teams.map((team, index) => ({ no: skip + index + 1, ...team })),
    });
});

const getTeamsById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
        where: { id },
        select:{
            id: true,
            name: true,
            description: true,
            created_at: true,
            updated_at: true,
            createdBy: { select: { id: true, name: true, email: true } },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            }
        },
    });

    if (!team) {
        return res.status(404).json({
            success: false,
            message: "Team not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Get team successfully",
        data: team,
    });
});

const updateTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    };

    const { name, description } = req.body;

    const existingTeam = await prisma.team.findUnique({ where: { id } });

    if (!existingTeam) {
        return res.status(404).json({
            success: false,
            message: 'Team not found.',
        });
    };

    if (name && name !== existingTeam.name) {
        const nameTaken = await prisma.team.findUnique({ where: { name } });
        if (nameTaken) {
            return res.status(409).json({
                success: false,
                message: 'Team name already taken.',
            });
        }
    };

    const updatedTeam = await prisma.team.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
        },
        select:{
            id: true,
            name: true,
            description: true,
            created_at: true,
            updated_at: true,
            createdBy: { select: { id: true, name: true, email: true } },
        },
    });

    await logActivity({
        user_id: req.user.id,
        action: 'team_updated',
        entity_type: 'team',
        entity_id: updatedTeam.id,
    });

    res.status(200).json({
        success: true,
        message: "Team updated successfully",
        data: updatedTeam,
    });
});

const deleteTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingTeam = await prisma.team.findUnique({ where: { id } });
    if (!existingTeam) {
        return res.status(404).json({
            success: false,
            message: 'Team not found.',
        });
    };

    await notifyTeamDeletion(id, req.user?.name || 'System');

    await logActivity({
        user_id: req.user.id,
        action: 'team_deleted',
        entity_type: 'team',
        entity_id: existingTeam.id,
    });

    await prisma.teamMember.deleteMany({ where: { team_id: id } });
    await prisma.team.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Team deleted successfully",
    });
});

const getTeamMembers = asyncHandler(async (req, res) => {
    const { id: teamId } = req.params;

    const members = await prisma.teamMember.findMany({
        where: { team_id: teamId },
        orderBy: { joined_at: 'asc' },
        include: {
            user: {
                select: { id: true, name: true, email: true, avatar_url: true },
            },
        },
    });

    res.status(200).json({
        success: true,
        message: "Team members retrieved successfully",
        data: members,
    });
});

module.exports = { createTeam, getAllTeams, getTeamsById, updateTeam, deleteTeam, getTeamMembers };