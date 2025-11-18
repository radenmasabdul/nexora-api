const { createTask, getAllTask, getTaskById, updateTask, deleteTask } = require('../../../src/controllers/task/TaskController');
const prisma = require('../../../prisma/client');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../../prisma/client', () => ({
    task: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    projects: {
        findUnique: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
    }
}));

jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));

jest.mock('../../../src/utils/handlers/asyncHandler', () => (fn) => fn);

jest.mock('../../../src/utils/helpers/notificationHelper', () => ({
    notifyTaskAssignment: jest.fn(),
    notifyTaskStatusChange: jest.fn(),
    notifyTaskDeletion: jest.fn()
}));

describe('Task Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 'test-user-id', name: 'Test User' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('createTask', () => {
        it('should create task successfully', async () => {
            const taskData = {
                project_id: 'project-1',
                assign_to: 'user-1',
                title: 'Test Task',
                description: 'Test Description',
                priority: 'medium',
                status: 'todo',
                due_date: '2024-12-31'
            };

            req.body = taskData;
            
            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.projects.findUnique.mockResolvedValue({ id: 'project-1', name: 'Test Project' });
            prisma.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Test User' });
            prisma.task.findFirst.mockResolvedValue(null); // No duplicate
            prisma.task.create.mockResolvedValue({
                id: '1',
                ...taskData,
                project: { id: 'project-1', name: 'Test Project' },
                assignedUser: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
                created_at: new Date(),
                updated_at: new Date()
            });

            await createTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Task created successfully",
                data: expect.objectContaining({
                    title: taskData.title,
                    project_id: taskData.project_id
                })
            });
        });

        it('should return error for non-existent project', async () => {
            req.body = {
                project_id: 'non-existent-project',
                assign_to: 'user-1',
                title: 'Test Task'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.projects.findUnique.mockResolvedValue(null);

            await createTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Project not found.'
            });
        });

        it('should return error for duplicate task title in project', async () => {
            req.body = {
                project_id: 'project-1',
                assign_to: 'user-1',
                title: 'Existing Task'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.projects.findUnique.mockResolvedValue({ id: 'project-1' });
            prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma.task.findFirst.mockResolvedValue({ 
                id: '1', 
                title: 'Existing Task',
                project_id: 'project-1'
            });

            await createTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Task with the same title already exists in the project.'
            });
        });
    });

    describe('getAllTask', () => {
        it('should get all tasks with pagination', async () => {
            req.query = { page: '1', limit: '10' };

            const mockTasks = [
                { 
                    id: '1', 
                    title: 'Task 1', 
                    description: 'Description 1',
                    project: { id: 'project-1', name: 'Project 1' },
                    assignedUser: { id: 'user-1', name: 'User 1', email: 'user1@example.com' }
                },
                { 
                    id: '2', 
                    title: 'Task 2', 
                    description: 'Description 2',
                    project: { id: 'project-2', name: 'Project 2' },
                    assignedUser: { id: 'user-2', name: 'User 2', email: 'user2@example.com' }
                }
            ];

            prisma.task.count.mockResolvedValue(2);
            prisma.task.findMany.mockResolvedValue(mockTasks);

            await getAllTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Tasks retrieved successfully",
                currentPage: 1,
                totalData: 2,
                totalPages: 1,
                data: expect.arrayContaining([
                    expect.objectContaining({ no: 1, title: 'Task 1' }),
                    expect.objectContaining({ no: 2, title: 'Task 2' })
                ])
            });
        });
    });

    describe('getTaskById', () => {
        it('should get task by id successfully', async () => {
            req.params = { id: '1' };
            
            const mockTask = {
                id: '1',
                title: 'Test Task',
                description: 'Test Description',
                project: { id: 'project-1', name: 'Test Project' },
                assignedUser: { id: 'user-1', name: 'Test User', email: 'test@example.com' }
            };

            prisma.task.findUnique.mockResolvedValue(mockTask);

            await getTaskById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Task retrieved successfully",
                data: mockTask
            });
        });

        it('should return 404 for non-existent task', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.task.findUnique.mockResolvedValue(null);

            await getTaskById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Task not found"
            });
        });
    });

    describe('updateTask', () => {
        it('should update task successfully', async () => {
            req.params = { id: '1' };
            req.body = { 
                project_id: 'project-1',
                assign_to: 'user-1',
                title: 'Updated Task', 
                description: 'Updated Description',
                priority: 'high',
                status: 'in_progress'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });

            const existingTask = { 
                id: '1', 
                title: 'Old Task', 
                status: 'todo',
                project_id: 'project-1',
                assign_to: 'user-1'
            };
            const updatedTask = { ...existingTask, ...req.body };

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.projects.findUnique.mockResolvedValue({ id: 'project-1' });
            prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma.task.findFirst.mockResolvedValue(null); // No duplicate
            prisma.task.update.mockResolvedValue(updatedTask);

            await updateTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Task updated successfully",
                data: expect.objectContaining({
                    title: 'Updated Task',
                    priority: 'high'
                })
            });
        });
    });

    describe('deleteTask', () => {
        it('should delete task successfully', async () => {
            req.params = { id: '1' };

            const existingTask = { 
                id: '1', 
                title: 'Test Task',
                assign_to: 'user-1',
                assignedUser: { id: 'user-1' }
            };
            
            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.delete.mockResolvedValue(existingTask);

            await deleteTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Task deleted successfully"
            });
        });

        it('should return 404 for non-existent task', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.task.findUnique.mockResolvedValue(null);

            await deleteTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Task not found."
            });
        });
    });
});