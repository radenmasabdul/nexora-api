const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');
const { validationResult } = require('express-validator');
const { notifyNewProject, notifyProjectStatusChange, notifyProjectDeletion } = require('../../utils/helpers/notificationHelper');
const { logActivity } = require('../activity/ActivityLogController.js');

const createProject = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const { team_id, name, description, status, deadline } = req.body;
    const validStatusProject = ['planning', 'in_progress', 'on_hold', 'completed'];

    if(status && !validStatusProject.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value. Allowed statuses: planning, in_progress, on_hold, completed.',
        })
    };

    const team = await prisma.team.findUnique({ where: { id: team_id } });

    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found.',
        });
    }

    const existingProject = await prisma.project.findFirst({
        where: {
            AND: [{ team_id: team_id },{ name: name }]
        }
    });

    if (existingProject) {
        return res.status(409).json({
            success: false,
            message: 'Project with the same name already exists in the team.',
        });
    }

    const newProject = await prisma.project.create({
        data: {
            team: { connect: { id: team_id } },
            name,
            description,
            status,
            deadline,
            created_by: req.user.id,
        },
        include: {
            team: { select: { id: true, name: true, description: true } },
        },
    });

    await notifyNewProject(newProject.id, req.user?.id || 'System');

    await logActivity({
        user_id: req.user.id,
        action: 'project_created',
        entity_type: 'project',
        entity_id: newProject.id,
    });

    res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: newProject,
    });
});

const getAllProjects = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || null;
    const team_id = req.query.team_id || null;

    const whereCondition = {
        ...(
            search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}
        ),
        ...(status ? { status } : {}),
        ...(team_id ? { team_id } : {}),
    };

    const [totalData, projects] = await Promise.all([
        prisma.project.count({ where: whereCondition }),
        prisma.project.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { created_at: 'asc' },
            include: {
                team: { select: { id: true, name: true, description: true } },
            },
        })
    ]);

    res.status(200).json({
        success: true,
        message: "Projects retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: projects.map((project, index) => ({ no: skip + index + 1, ...project })),
    });
});

const getProjectById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            team: { select: { id: true, name: true, description: true } },
        },
    });

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Project retrieved successfully",
        data: project,
    });
});

const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    };

    const { team_id, name, description, status, deadline } = req.body;
    const validStatusProject = ['planning', 'in_progress', 'on_hold', 'completed'];

    if(status && !validStatusProject.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value. Allowed statuses: planning, in_progress, on_hold, completed.',
        })
    };

    const currentProject = await prisma.project.findUnique({ where: { id } });

    if (!currentProject) {
        return res.status(404).json({
            success: false,
            message: 'Project not found.',
        });
    };

    if (team_id && name) {
        const existingProject = await prisma.project.findFirst({
            where: {
                AND: [
                    { team_id },
                    { name },
                    { id: { not: id } }
                ]
            }
        });
        if (existingProject) {
            return res.status(409).json({
                success: false,
                message: 'Project with the same name already exists in the team.',
            });
        }
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: {
            ...(team_id && { team: { connect: { id: team_id } } }),
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(status && { status }),
            ...(deadline && { deadline }),
        },
        include: {
            team: { select: { id: true, name: true, description: true } },
        },
    });

    if (status && status !== currentProject.status) {
        await notifyProjectStatusChange(id, status, req.user?.name || 'System');

        await logActivity({
            user_id: req.user.id,
            action: 'status_updated',
            entity_type: 'project',
            entity_id: id,
        });
    } else {
        await logActivity({
            user_id: req.user.id,
            action: 'project_updated',
            entity_type: 'project',
            entity_id: id,
        });
    }

    res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: updatedProject,
    });
});

const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    
    if (!existingProject) {
        return res.status(404).json({
            success: false,
            message: 'Project not found.',
        });
    };

    await notifyProjectDeletion(existingProject.name, existingProject.team_id, req.user?.name || 'System');

    await logActivity({
        user_id: req.user.id,
        action: 'project_deleted',
        entity_type: 'project',
        entity_id: existingProject.id,
    });

    await prisma.project.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Project deleted successfully",
    });
});

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject };