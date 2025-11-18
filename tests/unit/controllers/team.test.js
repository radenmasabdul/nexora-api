const { createTeam, getAllTeams, getTeamsById, updateTeam, deleteTeam } = require('../../../src/controllers/team/TeamController');
const prisma = require('../../../prisma/client');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../../prisma/client', () => ({
    team: {
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
    notifyTeamCreation: jest.fn()
}));

describe('Team Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 'test-user-id' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('createTeam', () => {
        it('should create team successfully', async () => {
            const teamData = {
                name: 'Test Team',
                description: 'Test Description'
            };

            req.body = teamData;
            
            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.team.findUnique.mockResolvedValue(null); // Name not taken
            prisma.team.create.mockResolvedValue({
                id: '1',
                ...teamData,
                createdBy: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
                created_at: new Date(),
                updated_at: new Date()
            });

            await createTeam(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Team created successfully",
                data: expect.objectContaining({
                    name: teamData.name,
                    description: teamData.description
                })
            });
        });

        it('should return error for existing team name', async () => {
            req.body = {
                name: 'Existing Team',
                description: 'Test Description'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.team.findUnique.mockResolvedValue({ id: '1', name: 'Existing Team' });

            await createTeam(req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Team name already taken.'
            });
        });
    });

    describe('getAllTeams', () => {
        it('should get all teams with pagination', async () => {
            req.query = { page: '1', limit: '10' };

            const mockTeams = [
                { id: '1', name: 'Team 1', description: 'Description 1' },
                { id: '2', name: 'Team 2', description: 'Description 2' }
            ];

            prisma.team.count.mockResolvedValue(2);
            prisma.team.findMany.mockResolvedValue(mockTeams);

            await getAllTeams(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Teams retrieved successfully",
                currentPage: 1,
                totalData: 2,
                totalPages: 1,
                data: expect.arrayContaining([
                    expect.objectContaining({ no: 1, name: 'Team 1' }),
                    expect.objectContaining({ no: 2, name: 'Team 2' })
                ])
            });
        });
    });

    describe('getTeamsById', () => {
        it('should get team by id successfully', async () => {
            req.params = { id: '1' };
            
            const mockTeam = {
                id: '1',
                name: 'Test Team',
                description: 'Test Description'
            };

            prisma.team.findUnique.mockResolvedValue(mockTeam);

            await getTeamsById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Get team successfully",
                data: mockTeam
            });
        });

        it('should return 404 for non-existent team', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.team.findUnique.mockResolvedValue(null);

            await getTeamsById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Team not found"
            });
        });
    });

    describe('updateTeam', () => {
        it('should update team successfully', async () => {
            req.params = { id: '1' };
            req.body = { name: 'Updated Team', description: 'Updated Description' };

            validationResult.mockReturnValue({ isEmpty: () => true });

            const existingTeam = { id: '1', name: 'Old Team', description: 'Old Description' };
            const updatedTeam = { ...existingTeam, ...req.body };

            // Mock findUnique calls - first for existence check, second for name check
            prisma.team.findUnique
                .mockResolvedValueOnce(existingTeam) // First call: check if team exists
                .mockResolvedValueOnce(null); // Second call: check if new name is taken
            prisma.team.update.mockResolvedValue(updatedTeam);

            await updateTeam(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Team updated successfully",
                data: expect.objectContaining({
                    name: 'Updated Team',
                    description: 'Updated Description'
                })
            });
        });
    });

    describe('deleteTeam', () => {
        it('should delete team successfully', async () => {
            req.params = { id: '1' };

            const existingTeam = { id: '1', name: 'Test Team' };
            prisma.team.findUnique.mockResolvedValue(existingTeam);
            prisma.team.delete.mockResolvedValue(existingTeam);

            await deleteTeam(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Team deleted successfully"
            });
        });

        it('should return 404 for non-existent team', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.team.findUnique.mockResolvedValue(null);

            await deleteTeam(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Team not found."
            });
        });
    });
});