const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');
const { validationResult } = require('express-validator');
const { notifyNewProject, notifyProjectStatusChange, notifyProjectDeletion } = require('../../utils/helpers/notificationHelper');

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
    const validStatusProject = ['active', 'on_hold', 'completed'];

    if(status && !validStatusProject.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value. Allowed statuses: active, on_hold, completed.',
        })
    };

    const existingProject = await prisma.projects.findFirst({
        where: {
            AND: [
                { team_id: team_id },
                { name: name },
            ]
        }
    });

    if (existingProject) {
        return res.status(409).json({
            success: false,
            message: 'Project with the same name already exists in the team.',
        });
    }

    const newProject = await prisma.projects.create({
        data: {
            team: { connect: { id: team_id } },
            name,
            description,
            status,
            deadline,
        },
        include: {
            team: {
                select: { id: true, name: true, description: true }
            },
        },
    });

    // send notification to team members
    await notifyNewProject(newProject.id, req.user?.id || 'System');

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
    };

    const totalData = await prisma.projects.count({ where: whereCondition });

    const projects = await prisma.projects.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: {
            team: {
                select: { id: true, name: true, description: true, status: true }
            },
        },
    });

    const projectsWithNumber = projects.map((project, index) => ({
        no: skip + index + 1,
        ...project,
    }));

    res.status(200).json({
        success: true,
        message: "Projects retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: projectsWithNumber,
    });
});

const getProjectById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await prisma.projects.findUnique({
        where: { id },
        include: {
            team: {
                select: { id: true, name: true, description: true, status: true }
            },
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
    const validStatusProject = ['active', 'on_hold', 'completed'];

    if(status && !validStatusProject.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value. Allowed statuses: active, on_hold, completed.',
        })
    };

    const currentProject = await prisma.projects.findUnique({ where: { id } });
    if (!currentProject) {
        return res.status(404).json({
            success: false,
            message: 'Project not found.',
        });
    };

    const existingProject = await prisma.projects.findFirst({
        where: { 
            AND: [
                { team_id: team_id },
                { name: name },
                { id: { not: id } }
            ]
        }
    });

    if (existingProject && existingProject.id !== id) {
        return res.status(409).json({
            success: false,
            message: 'Project with the same name already exists in the team.',
        });
    }

    const updatedProject = await prisma.projects.update({
        where: { id },
        data: {
            team: { connect: { id: team_id } },
            name,
            description,
            status,
            deadline,
        },
        include: {
            team: {
                select: { id: true, name: true, description: true, status: true }
            },
        },
    });

    // send notification if status changed
    if (status && status !== currentProject.status) {
        await notifyProjectStatusChange(id, status, req.user?.name || 'System');
    }

    res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: updatedProject,
    });
});

const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingProject = await prisma.projects.findUnique({ where: { id } });
    if (!existingProject) {
        return res.status(404).json({
            success: false,
            message: 'Project not found.',
        });
    };

    // send notification before deletion
    await notifyProjectDeletion(existingProject.name, existingProject.team_id, req.user?.name || 'System');

    await prisma.projects.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Project deleted successfully",
    });
});

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject };