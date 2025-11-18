const { createUser, getAllUsers, getUserById, updateUser, deleteUser } = require('../../../src/controllers/user/UserController');
const prisma = require('../../../prisma/client');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../../prisma/client', () => ({
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    }
}));

jest.mock('bcryptjs');
jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));
jest.mock('../../../src/utils/handlers/asyncHandler', () => (fn) => fn);

describe('User Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create user successfully', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!',
                role: 'member'
            };

            req.body = userData;
            
            // Mock validation result
            validationResult.mockReturnValue({ isEmpty: () => true });

            prisma.user.findUnique.mockResolvedValue(null); // Email not exists
            bcrypt.hash.mockResolvedValue('hashedPassword');
            prisma.user.create.mockResolvedValue({
                id: '1',
                ...userData,
                password: 'hashedPassword',
                created_at: new Date(),
                updated_at: new Date()
            });

            await createUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "User created successfully",
                data: expect.objectContaining({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                })
            });
        });

        it('should return error for existing email', async () => {
            req.body = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'Password123!',
                role: 'member'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' });

            await createUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already exists.'
            });
        });
    });

    describe('getAllUsers', () => {
        it('should get all users with pagination', async () => {
            req.query = { page: '1', limit: '10' };

            const mockUsers = [
                { id: '1', name: 'User 1', email: 'user1@example.com', role: 'member' },
                { id: '2', name: 'User 2', email: 'user2@example.com', role: 'admin' }
            ];

            prisma.user.count.mockResolvedValue(2);
            prisma.user.findMany.mockResolvedValue(mockUsers);

            await getAllUsers(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Get all users successfully",
                currentPage: 1,
                totalData: 2,
                totalPages: 1,
                data: expect.arrayContaining([
                    expect.objectContaining({ no: 1, name: 'User 1' }),
                    expect.objectContaining({ no: 2, name: 'User 2' })
                ])
            });
        });
    });

    describe('getUserById', () => {
        it('should get user by id successfully', async () => {
            req.params = { id: '1' };
            
            const mockUser = {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'member'
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            await getUserById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Get user successfully",
                data: mockUser
            });
        });

        it('should return 404 for non-existent user', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.user.findUnique.mockResolvedValue(null);

            await getUserById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "User not found"
            });
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            req.params = { id: '1' };
            req.body = { name: 'Updated Name', role: 'admin' };

            validationResult.mockReturnValue({ isEmpty: () => true });

            const existingUser = { id: '1', name: 'Old Name', email: 'test@example.com' };
            const updatedUser = { ...existingUser, ...req.body, password: 'hashedPassword' };

            prisma.user.findUnique.mockResolvedValue(existingUser);
            prisma.user.update.mockResolvedValue(updatedUser);

            await updateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "User updated successfully",
                data: expect.objectContaining({
                    name: 'Updated Name',
                    role: 'admin'
                })
            });
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            req.params = { id: '1' };

            const existingUser = { id: '1', name: 'Test User' };
            prisma.user.findUnique.mockResolvedValue(existingUser);
            prisma.user.delete.mockResolvedValue(existingUser);

            await deleteUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "User deleted successfully"
            });
        });

        it('should return 404 for non-existent user', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.user.findUnique.mockResolvedValue(null);

            await deleteUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "User not found."
            });
        });
    });
});