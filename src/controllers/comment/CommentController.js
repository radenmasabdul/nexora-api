const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');
const { validationResult } = require('express-validator');

const createComment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }
    
    const { user_id, task_id, content } = req.body;

    const task = await prisma.task.findUnique({
        where: { id: task_id },
        include: { project: { include: { members: true } } }
    });
    
    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found"
        });
    }

    const hasAccess = task.project.members.some(member => member.user_id === user_id);
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: "Access denied to this task"
        });
    }

    const newComment = await prisma.comments.create({
        data: {
            user: { connect: { id: user_id } },
            task: { connect: { id: task_id } },
            content,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
            task: {
                select: { id: true, title: true, description: true }
            },
        },
    });

    res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: newComment,
    });
});

const getAllComment = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
    const whereCondition = search ? { content: { contains: sanitizedSearch, mode: 'insensitive'} } : {};
    
    const totalData = await prisma.comments.count({ where: whereCondition });

    const comments = await prisma.comments.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
            task: {
                select: { id: true, title: true }
            },
        },
    });

    const commentsWithNumber = comments.map((comment, index) => ({
        no: skip + index + 1,
        ...comment,
    }));

    res.status(200).json({
        success: true,
        message: "Comments retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: commentsWithNumber,
    });
});

const getCommentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const comment = await prisma.comments.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, name: true, email: true }},
            task: {
                select: { id: true, title: true }
            },
        },
    });

    if (!comment) {
        return res.status(404).json({
            success: false,
            message: "Comment not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Comment retrieved successfully",
        data: comment,
    });
});

const updateComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    };

    const { user_id, task_id, content } = req.body;

    const existingComment = await prisma.comments.findUnique({ where: { id } });
    if (!existingComment) {
        return res.status(404).json({
            success: false,
            message: 'Comment not found.',
        });
    };

    const updateData = {};
    if (user_id) updateData.user = { connect: { id: user_id } };
    if (task_id) updateData.task = { connect: { id: task_id } };
    if (content) updateData.content = content;

    const updatedComment = await prisma.comments.update({
        where: { id },
        data: updateData,
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
            task: {
                select: { id: true, title: true }
            },
        },
    });

    res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: updatedComment,
    });
});

const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingComment = await prisma.comments.findUnique({ where: { id } });
    if (!existingComment) {
        return res.status(404).json({
            success: false,
            message: 'Comment not found.',
        });
    };

    await prisma.comments.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
    });
});

module.exports = { createComment, getAllComment, getCommentById, updateComment, deleteComment };