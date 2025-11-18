const { createProject, getAllProjects, getProjectById, updateProject, deleteProject } = require('../../../src/controllers/projects/ProjectsController');
const prisma = require('../../../prisma/client');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../../prisma/client', () => ({
    projects: {
        findFirst: jest.fn(),
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
    notifyNewProject: jest.fn(),
    notifyProjectStatusChange: jest.fn(),
    notifyProjectDeletion: jest.fn()
}));

describe('Project Controller', () => {
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

    describe('createProject', () => {
        it('should create project successfully', async () => {
            const projectData = {
                team_id: 'team-1',
                name: 'Test Project',
                description: 'Test Description',
                status: 'planning',
                deadline: '2024-12-31'
            };

            req.body = projectData;
            
            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.projects.findFirst.mockResolvedValue(null); // No duplicate
            prisma.projects.create.mockResolvedValue({
                id: '1',
                ...projectData,
                team: { id: 'team-1', name: 'Test Team', description: 'Test Team Desc' },
                created_at: new Date(),
                updated_at: new Date()
            });

            await createProject(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Project created successfully",
                data: expect.objectContaining({
                    name: projectData.name,
                    team_id: projectData.team_id
                })
            });
        });

        it('should return error for duplicate project name in team', async () => {
            req.body = {
                team_id: 'team-1',
                name: 'Existing Project',
                description: 'Test Description'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });
            prisma.projects.findFirst.mockResolvedValue({ 
                id: '1', 
                name: 'Existing Project',
                team_id: 'team-1'
            });

            await createProject(req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Project with the same name already exists in the team.'
            });
        });
    });

    describe('getAllProjects', () => {
        it('should get all projects with pagination', async () => {
            req.query = { page: '1', limit: '10' };

            const mockProjects = [
                { id: '1', name: 'Project 1', description: 'Description 1', team: { id: 'team-1', name: 'Team 1' } },
                { id: '2', name: 'Project 2', description: 'Description 2', team: { id: 'team-2', name: 'Team 2' } }
            ];

            prisma.projects.count.mockResolvedValue(2);
            prisma.projects.findMany.mockResolvedValue(mockProjects);

            await getAllProjects(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Projects retrieved successfully",
                currentPage: 1,
                totalData: 2,
                totalPages: 1,
                data: expect.arrayContaining([
                    expect.objectContaining({ no: 1, name: 'Project 1' }),
                    expect.objectContaining({ no: 2, name: 'Project 2' })
                ])
            });
        });
    });

    describe('getProjectById', () => {
        it('should get project by id successfully', async () => {
            req.params = { id: '1' };
            
            const mockProject = {
                id: '1',
                name: 'Test Project',
                description: 'Test Description',
                team: { id: 'team-1', name: 'Test Team' }
            };

            prisma.projects.findUnique.mockResolvedValue(mockProject);

            await getProjectById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Project retrieved successfully",
                data: mockProject
            });
        });

        it('should return 404 for non-existent project', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.projects.findUnique.mockResolvedValue(null);

            await getProjectById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Project not found"
            });
        });
    });

    describe('updateProject', () => {
        it('should update project successfully', async () => {
            req.params = { id: '1' };
            req.body = { 
                team_id: 'team-1',
                name: 'Updated Project', 
                description: 'Updated Description',
                status: 'in_progress'
            };

            validationResult.mockReturnValue({ isEmpty: () => true });

            const existingProject = { id: '1', name: 'Old Project', status: 'planning' };
            const updatedProject = { ...existingProject, ...req.body };

            prisma.projects.findFirst.mockResolvedValue(null); // No duplicate
            prisma.projects.findUnique.mockResolvedValue(existingProject);
            prisma.projects.update.mockResolvedValue(updatedProject);

            await updateProject(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Project updated successfully",
                data: expect.objectContaining({
                    name: 'Updated Project',
                    status: 'in_progress'
                })
            });
        });
    });

    describe('deleteProject', () => {
        it('should delete project successfully', async () => {
            req.params = { id: '1' };

            const existingProject = { 
                id: '1', 
                name: 'Test Project',
                team_id: 'team-1'
            };
            
            prisma.projects.findUnique.mockResolvedValue(existingProject);
            prisma.projects.delete.mockResolvedValue(existingProject);

            await deleteProject(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Project deleted successfully"
            });
        });

        it('should return 404 for non-existent project', async () => {
            req.params = { id: 'non-existent' };
            
            prisma.projects.findUnique.mockResolvedValue(null);

            await deleteProject(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Project not found."
            });
        });
    });
});