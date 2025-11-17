const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler');
const { validationResult } = require('express-validator');

const createTask = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const { project_id, assign_to, title, description, priority, status, due_date } = req.body;

    const project = await prisma.projects.findUnique({ where: { id: project_id } });
    if (!project) {
        return res.status(404).json({
            success: false,
            message: 'Project not found.',
        });
    }

    const user = await prisma.user.findUnique({ where: { id: assign_to } });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found.',
        });
    }

    const existingTask = await prisma.task.findFirst({
        where: {
            project_id,
            title,
        }
    });

    if (existingTask) {
        return res.status(409).json({
            success: false,
            message: 'Task with the same title already exists in the project.',
        });
    }

    const newTask = await prisma.task.create({
        data: {
            project_id,
            assign_to,
            title,
            description,
            priority,
            status,
            due_date: new Date(due_date),
        },
        include: {
            project: {
                select: { id: true, name: true }
            },
            assignedUser: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: newTask,
    });
});

const getAllTask = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const whereCondition = search
        ? {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const totalData = await prisma.task.count({ where: whereCondition });

    const tasks = await prisma.task.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            project: {
                select: { id: true, name: true }
            },
            assignedUser: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    const tasksWithNumber = tasks.map((task, index) => ({
        no: skip + index + 1,
        ...task,
    }));

    res.status(200).json({
        success: true,
        message: "Tasks retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: tasksWithNumber,
    });
});

const getTaskById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            project: {
                select: { id: true, name: true }
            },
            assignedUser: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Task retrieved successfully",
        data: task,
    });
});

const updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    const currentTask = await prisma.task.findUnique({ where: { id } });
    if (!currentTask) {
        return res.status(404).json({
            success: false,
            message: 'Task not found.',
        });
    }

    const { project_id, assign_to, title, description, priority, status, due_date } = req.body;

    if (project_id) {
        const project = await prisma.projects.findUnique({ where: { id: project_id } });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found.',
            });
        }
    }

    if (assign_to) {
        const user = await prisma.user.findUnique({ where: { id: assign_to } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }
    }

    if (title) {
        const checkProjectId = project_id || currentTask.project_id;
        const existingTask = await prisma.task.findFirst({
            where: {
                project_id: checkProjectId,
                title,
                NOT: { id },
            }
        });

        if (existingTask) {
            return res.status(409).json({
                success: false,
                message: 'Task with the same title already exists in the project.',
            });
        }
    }

    const updateData = {};
    if (project_id) updateData.project_id = project_id;
    if (assign_to) updateData.assign_to = assign_to;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (due_date) updateData.due_date = new Date(due_date);

    const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
            project: {
                select: { id: true, name: true }
            },
            assignedUser: {
                select: { id: true, name: true, email: true }
            },
        },
    });

    res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
    });
});

const deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
        return res.status(404).json({
            success: false,
            message: 'Task not found.',
        });
    }

    await prisma.task.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Task deleted successfully",
    });
});

module.exports = { createTask, getAllTask, getTaskById, updateTask, deleteTask };