const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');
const { validationResult } = require('express-validator');
const { notifyTeamJoin, notifyRoleChange, notifyMemberRemoval } = require('../../utils/helpers/notificationHelper');
const { logActivity } = require('../activity/ActivityLogController.js');

const createMember = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }
    
    const { team_id, user_id, role } = req.body;

    const validRoles = ['project_owner', 'team_leader', 'developer'];

    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role. Allowed: project_owner, team_leader, developer.',
        });
    }

    const team = await prisma.team.findUnique({ where: { id: team_id } });

    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found.',
        });
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found.',
        });
    }

    const existingMember = await prisma.teamMember.findUnique({ 
        where: { team_id_user_id: { team_id, user_id } }
    });

    if (existingMember) {
        return res.status(409).json({
            success: false,
            message: 'Member already exists in the team.',
        });
    }

    const newMember = await prisma.teamMember.create({
        data: {
            team: { connect: { id: team_id } },
            user: { connect: { id: user_id } },
            role,
        },
        include: {
            team: { select: { id: true, name: true, description: true } },
            user: { select: { id: true, name: true, email: true } },
        },
    });

    await notifyTeamJoin(team_id, user_id);

    await logActivity({
        user_id: req.user.id,
        action: 'team_joined',
        entity_type: 'team',
        entity_id: team_id,
    });

    res.status(201).json({
        success: true,
        message: "Member added to team successfully",
        data: newMember,
    });
});

const getAllMembers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const team_id = req.query.team_id || null;

    const whereCondition = {
        ...(team_id ? { team_id } : {}),
        ...(search ? {
            user: { name: { contains: search, mode: 'insensitive' } }
        } : {}),
    };

    const [totalData, members] = await Promise.all([
        prisma.teamMember.count({ where: whereCondition }),
        prisma.teamMember.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { joined_at: 'asc' },
            include: {
                team: { select: { id: true, name: true, description: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        })
    ]);

    res.status(200).json({
        success: true,
        message: "Members retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: members.map((member, index) => ({ no: skip + index + 1, ...member })),
    });
});

const getMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await prisma.teamMember.findUnique({
        where: { id },
        include: {
            team: { select: { id: true, name: true, description: true } },
            user: { select: { id: true, name: true, email: true } },
        },
    });

    if (!member) {
        return res.status(404).json({
            success: false,
            message: "Member not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Member retrieved successfully",
        data: member,
    });
});

const updateMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    };

    const { role } = req.body;

    const validRoles = ['project_owner', 'team_leader', 'developer'];

    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role. Allowed: project_owner, team_leader, developer.',
        });
    }

    const existingMember = await prisma.teamMember.findUnique({ where: { id } });

    if (!existingMember) {
        return res.status(404).json({
            success: false,
            message: 'Member not found.',
        });
    };

    const updatedMember = await prisma.teamMember.update({
        where: { id },
        data: { role },
        include: {
            team: { select: { id: true, name: true, description: true } },
            user: { select: { id: true, name: true, email: true } },
        },
    });

    if (role && role !== existingMember.role) {
        await notifyRoleChange(
            existingMember.team_id,
            existingMember.user_id,
            role,
            req.user?.name || 'System'
        );
    }

    await logActivity({
        user_id: req.user.id,
        action: 'team_updated',
        entity_type: 'team',
        entity_id: existingMember.team_id,
    });

    res.status(200).json({
        success: true,
        message: "Member updated successfully",
        data: updatedMember,
    });
});

const deleteMember = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingMember = await prisma.teamMember.findUnique({ where: { id } });

    if (!existingMember) {
        return res.status(404).json({
            success: false,
            message: 'Member not found.',
        });
    };

    await notifyMemberRemoval(
        existingMember.team_id,
        existingMember.user_id,
        req.user?.name || 'System'
    );

    await logActivity({
        user_id: req.user.id,
        action: 'team_left',
        entity_type: 'team',
        entity_id: existingMember.team_id,
    });

    await prisma.teamMember.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Member deleted successfully",
    });
});

module.exports = { createMember, getAllMembers, getMemberById, updateMember, deleteMember };