const prisma = require('../../../prisma/client/index.js');
const asyncHandler = require('../../utils/handlers/asyncHandler.js');
const { validationResult } = require('express-validator');
const { notifyNewComment, notifyCommentDeletion } = require('../../utils/helpers/notificationHelper');
const { logActivity } = require('../activity/ActivityLogController.js');

const createComment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }
    
    const { task_id, content } = req.body;
    const user_id = req.user.id;

    const task = await prisma.task.findUnique({
        where: { id: task_id },
        include: { 
            project: { 
                include: { 
                    team: { 
                        include: { members: true } 
                    }
                }
            }
        }
    });
    
    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found"
        });
    }

    const hasAccess =
        task.project.team.members.some(member => member.user_id === user_id) ||
        task.assign_to === user_id ||
        task.created_by === user_id;

    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: "Access denied to this task"
        });
    }

    const newComment = await prisma.comment.create({
        data: {
            user: { connect: { id: user_id } },
            task: { connect: { id: task_id } },
            content,
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
            task: { select: { id: true, title: true, description: true } },
        },
    });

    await notifyNewComment(task_id, user_id);

    await logActivity({
        user_id: req.user.id,
        action: 'comment_added',
        entity_type: 'comment',
        entity_id: newComment.id,
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
    const task_id = req.query.task_id || null;

    const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
    
    const whereCondition = {
        ...(task_id ? { task_id } : {}),
        ...(search ? { content: { contains: sanitizedSearch, mode: 'insensitive' } } : {}),
    };
    
    const [totalData, comments] = await Promise.all([
        prisma.comment.count({ where: whereCondition }),
        prisma.comment.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                task: { select: { id: true, title: true } },
            },
        })
    ]);

    res.status(200).json({
        success: true,
        message: "Comments retrieved successfully",
        currentPage: page,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        data: comments.map((comment, index) => ({ no: skip + index + 1, ...comment })),
    });
});

const getCommentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            task: { select: { id: true, title: true } },
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

const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingComment = await prisma.comment.findUnique({ 
        where: { id },
        include: {
            task: {
                include: {
                    assignedUser: { select: { id: true } }
                }
            }
        }
    });

    if (!existingComment) {
        return res.status(404).json({
            success: false,
            message: 'Comment not found.',
        });
    };

    if (existingComment.user_id !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only delete your own comment.',
        });
    };

    await notifyCommentDeletion(
        existingComment.task_id, 
        existingComment.content, 
        req.user?.id || 'System', 
        existingComment.task.assignedUser?.id
    );

    await logActivity({
        user_id: req.user.id,
        action: 'comment_deleted',
        entity_type: 'comment',
        entity_id: existingComment.id,
    });

    await prisma.comment.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
    });
});

module.exports = { createComment, getAllComment, getCommentById, deleteComment };