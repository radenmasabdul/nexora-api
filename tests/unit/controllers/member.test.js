const { createMember, getAllMembers, getMemberById, updateMember, deleteMember } = require('../../../src/controllers/member/MemberController');
const prisma = require('../../../prisma/client');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../../prisma/client', () => ({
    teamMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    }
}));

jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));

jest.mock('../../../src/utils/handlers/asyncHandler', () => (fn) => fn);

jest.mock('../../../src/utils/helpers/notificationHelper', () => ({
    notifyTeamJoin: jest.fn(),
    notifyRoleChange: jest.fn(),
    notifyMemberRemoval: jest.fn()
}));

describe('Member Controller', () => {
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

    describe('createMember', () => {
        it('should add member to team successfully', async () => {
            const memberData = {
                team_id: 'team-1',
                user_id: 'user-1',
                role: 'member'
            };

            req.body = memberData;
            
            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.teamMember.findUnique.mockResolvedValue(null); // No existing member
            prisma.teamMember.create.mockResolvedValue({
                id: '1',
                ...memberData,
                team: { id: 'team-1', name: 'Test Team', description: 'Test Team Desc' },
                user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
                joined_at: new Date()
            });

            await createMember(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Member added to team successfully",
                data: expect.objectContaining({
                    team_id: memberData.team_id,
                    user_id: memberData.user_id,
                    role: memberData.role
                })
            });
        });

        it('should return error for existing member', async () => {
            req.body = {
                team_id: 'team-1',
                user_id: 'user-1',
                role: 'member'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.teamMember.findUnique.mockResolvedValue({ 
                id: '1', 
                team_id: 'team-1',
                user_id: 'user-1'
            });

            await createMember(req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Member already exists in the team.'
            });
        });
    });

    describe('getAllMembers', () => {
        it('should get all members with pagination', async () => {
            req.query = { page: '1', limit: '10' };

            const mockMembers = [
                { 
                    id: '1', 
                    role: 'member',
                    team: { id: 'team-1', name: 'Team 1', description: 'Team 1 Desc' },
                    user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' }
                },
                { 
                    id: '2', 
                    role: 'manager',
                    team: { id: 'team-2', name: 'Team 2', description: 'Team 2 Desc' },
                    user: { id: 'user-2', name: 'User 2', email: 'user2@example.com' }
                }
            ];

            prisma.teamMember.count.mockResolvedValue(2);
            prisma.teamMember.findMany.mockResolvedValue(mockMembers);

            await getAllMembers(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Members retrieved successfully",
                currentPage: 1,
                totalData: 2,
                totalPages: 1,
                data: expect.arrayContaining([
                    expect.objectContaining({ no: 1, role: 'member' }),
                    expect.objectContaining({ no: 2, role: 'manager' })
                ])
            });
        });
    });

    describe('getMemberById', () => {
        it('should get member by id successfully', async () => {
            req.params = { id: '1' };
            
            const mockMember = {
                id: '1',
                role: 'member',
                team: { id: 'team-1', name: 'Test Team', description: 'Test Team Desc' },
                user: { id: 'user-1', name: 'Test User', email: 'test@example.com' }
            };

            prisma.teamMember.findUnique.mockResolvedValue(mockMember);

            await getMemberById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Member retrieved successfully",
                data: mockMember
            });
        });

        it('should return 404 for non-existent member', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.teamMember.findUnique.mockResolvedValue(null);

            await getMemberById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Member not found"
            });
        });
    });

    describe('updateMember', () => {
        it('should update member role successfully', async () => {
            req.params = { id: '1' };
            req.body = { role: 'manager' };

            validationResult.mockReturnValue({ isEmpty: () => true });

            const existingMember = { 
                id: '1', 
                role: 'member',
                team_id: 'team-1',
                user_id: 'user-1'
            };
            const updatedMember = { 
                ...existingMember, 
                role: 'manager',
                team: { id: 'team-1', name: 'Test Team' },
                user: { id: 'user-1', name: 'Test User', email: 'test@example.com' }
            };

            prisma.teamMember.findUnique.mockResolvedValue(existingMember);
            prisma.teamMember.update.mockResolvedValue(updatedMember);

            await updateMember(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Member updated successfully",
                data: expect.objectContaining({
                    role: 'manager'
                })
            });
        });
    });

    describe('deleteMember', () => {
        it('should remove member from team successfully', async () => {
            req.params = { id: '1' };

            const existingMember = { 
                id: '1', 
                team_id: 'team-1',
                user_id: 'user-1',
                role: 'member'
            };
            
            prisma.teamMember.findUnique.mockResolvedValue(existingMember);
            prisma.teamMember.delete.mockResolvedValue(existingMember);

            await deleteMember(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Member deleted successfully"
            });
        });

        it('should return 404 for non-existent member', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.teamMember.findUnique.mockResolvedValue(null);

            await deleteMember(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Member not found."
            });
        });
    });
});