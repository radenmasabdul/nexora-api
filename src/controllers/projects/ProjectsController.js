const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');
const { validationResult } = require('express-validator');

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

    const existingProject = await prisma.project.findUnique({ where: { team_id_name : { team_id, name } } });
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
        },
        include: {
            team: {
                select: { id: true, name: true, description: true }
            },
        },
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

    const whereCondition = search
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const totalData = await prisma.project.count({ where: whereCondition });

    const projects = await prisma.project.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: {
            team: {
                select: { id: true, name: true, description: true }
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

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            team: {
                select: { id: true, name: true, description: true }
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

    const existingProject = await prisma.project.findUnique({ where: { team_id_name : { team_id, name } } });
    if (existingProject && existingProject.id !== id) {
        return res.status(409).json({
            success: false,
            message: 'Project with the same name already exists in the team.',
        });
    }

    const updatedProject = await prisma.project.update({
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
                select: { id: true, name: true, description: true }
            },
        },
    });

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

    await prisma.project.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Project deleted successfully",
    });
});

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject };