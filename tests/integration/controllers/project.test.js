const request = require("supertest");
const app = require("../../../src/app");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    team: {
        findUnique: jest.fn(),
    },
    project: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    teamMember: {
        findMany: jest.fn(),
    },
    activityLog: {
        create: jest.fn(),
    },
    notification: {
        create: jest.fn(),
    },
}));

jest.mock("../../../src/utils/validators/projects/projects.js", () => ({
    validateCreateProject: [],
    validateUpdateProject: [],
}));

const prisma = require("../../../prisma/client/index.js");

describe('Project API', () => {
    const adminToken = jwt.sign(
        { id: 'user-1', role: 'administrator'},
        'test-secret'
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET PROJECT DASHBOARD /dashboard/projects/progress', () => {
        it('should return 200 with token credential', async () => {
            prisma.project.findMany.mockResolvedValue([
                {
                    id: 'project-1',
                    name: 'Test Project',
                    status: 'planning',
                    deadline: null,
                    tasks: [
                        { status: 'done' },
                        { status: 'in_progress' },
                    ]
                }
            ]);

            const res = await request(app)
            .get('/dashboard/projects/progress')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data[0]).toHaveProperty("project_id");
            expect(res.body.data[0]).toHaveProperty("project_name");
            expect(res.body.data[0]).toHaveProperty("progress");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .get('/dashboard/projects/progress');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Unauthenticated.');
        });
    });

    describe('CREATE PROJECT /projects/', () => {
        it('should return 201 for valid credential', async () => {
            prisma.team.findUnique.mockResolvedValue({
                id: 'team-1',
                name: 'Test Team',
            });

            prisma.project.findFirst.mockResolvedValueOnce(null);

            prisma.project.create.mockResolvedValueOnce({
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                name: 'Project New',
                descriptiom: 'Project New',
                status: 'planning',
                deadline: new Date(),
                created_by: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                }
            });

            prisma.project.findUnique.mockResolvedValueOnce({
                id: "project-1",
                name: "Project New",
                team: {
                    members: [{ user_id: "user-2" }],
                    createdBy: { name: "John Doe" },
                },
            });

            const response = await request(app)
            .post('/projects/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                team_id: 'team-1',
                name: 'Project New',
                description: 'Project New',
                status: 'planning',
                deadline: new Date(),
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project created successfully');
            expect(response.body.data).toHaveProperty("team");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("status");
        });

        it('should return 400 invalid status', async () => {
            prisma.project.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .post("/projects/")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                team_id: 'team-1',
                name: 'Project New',
                description: 'Project New',
                status: 'new',
                deadline: new Date(),
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid status value. Allowed statuses: planning, in_progress, on_hold, completed.');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .post('/projects/')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when team not found', async () => {
            prisma.team.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .post('/projects/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                team_id: "team-9999",
                user_id: "user-9999",
                role: "developer",
            });
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Team not found.");
        });

        it("should return 409 project existing", async () => {
            prisma.team.findUnique.mockResolvedValue({
                id: "team-1",
                name: "Test Team"
            });
            
            prisma.project.findFirst.mockResolvedValueOnce({
                id: "project-1",
                name: "Project New"
            });
            
            const response = await request(app)
            .post("/projects/")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                team_id: "team-1",
                name: "Project New",
                description: "Project New",
                status: "planning",
                deadline: new Date(),
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Project with the same name already exists in the team.");
        });
    });

    describe('GET ALL PROJECT /projects/', () => {
        it("should return 200 with token credential", async () => {
            prisma.project.count.mockResolvedValue(2);
            prisma.project.findMany.mockResolvedValue([
                {
                    team: {
                        id: "team-1",
                        name: "Test Team",
                        description: "A test team"
                    },
                    name: 'Project New',
                    descriptiom: 'Project New',
                    status: 'planning',
                    deadline: new Date(),
                    created_by: {
                        id: "user-1",
                        name: "John Doe",
                        email: "johndoe@example.com"
                    }
                },
                {
                    team: {
                        id: "team-2",
                        name: "Test Team 2",
                        description: "A test team 2"
                    },
                    name: 'Project New 2',
                    descriptiom: 'Project New 2',
                    status: 'planning',
                    deadline: new Date(),
                    created_by: {
                        id: "user-2",
                        name: "John Doe 2",
                        email: "johndoe2@example.com"
                    }
                }
            ]);

            const response = await request(app)
            .get('/projects/')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Projects retrieved successfully",);
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("totalData");
            expect(response.body).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .post("/projects/");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe('GET PROJECT BY ID /projects/:id', () => {
        it("should be return 200 with token credential", async () => {
            prisma.project.findUnique.mockResolvedValue({
                id: "project-1",
                name: 'Project New',
                descriptiom: 'Project New',
                status: 'planning',
                deadline: new Date(),
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                created_by: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                }
            });

            const response = await request(app)
            .get('/projects/project-1')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Project retrieved successfully");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("status");
            expect(response.body.data).toHaveProperty("deadline");
            expect(response.body.data).toHaveProperty("team");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .get("/projects/project-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 404 when project not found", async () => {
            prisma.project.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .get("/projects/project-1")
            .set("Authorization", `Bearer ${adminToken}`);
          
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Project not found");
        });
    });

    describe('UPDATE PROJECT /projects/:id', () => {
        it("should be return 200 with token credential", async () => {
            prisma.project.findUnique
            .mockResolvedValueOnce({
                id: "project-1",
                name: "Project New",
                status: "planning",
                team_id: "team-1"
            })
            .mockResolvedValueOnce({
                id: "project-1",
                name: "Project New",
                team: {
                    members: [{ user_id: "user-2" }],
                }
            });

            prisma.project.findFirst.mockResolvedValueOnce(null);

            prisma.project.update.mockResolvedValue({
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                name: 'Project New Update',
                descriptiom: 'Project New Update',
                status: 'planning',
                deadline: new Date(),
                created_by: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                }
            });

            const response = await request(app)
            .patch('/projects/project-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                team_id: 'team-1',
                name: 'Project New Update',
                description: 'Project New Update',
                status: 'in_progress',
                deadline: new Date(),
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project updated successfully');
            expect(response.body.data).toHaveProperty("team");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("status");
        });

        it('should return 400 invalid status', async () => {           
            const response = await request(app)
            .patch("/projects/project-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                status: 'new',
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid status value. Allowed statuses: planning, in_progress, on_hold, completed.');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .patch('/projects/project-1')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 404 when project not found", async () => {
            prisma.project.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .patch("/projects/project-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ 
                name: 'Project New', 
                status: 'planning'
            });
          
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Project not found.");
        });

        it("should return 409 project existing", async () => {
            prisma.project.findUnique.mockResolvedValueOnce({
                id: "project-1",
                name: "Project Old",
                status: "planning",
            });

            prisma.project.findFirst.mockResolvedValueOnce({
                id: "project-2",
                name: "Project New",
            });
            
            const response = await request(app)
            .patch("/projects/project-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                team_id: "team-1",
                name: "Project New",
                description: "Project New",
                status: "planning",
                deadline: new Date(),
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Project with the same name already exists in the team.");
        });
    });

    describe('DELETE PROJECT /project/:id', () => {
        it("should return 200 with token credential", async () => {
            prisma.project.findUnique.mockResolvedValueOnce({
                id: "project-1",
                name: "Project New",
                team_id: "team-1",
                status: "planning"
            });
            
            prisma.team.findUnique.mockResolvedValueOnce({
                id: "team-1",
                name: "Test Team",
                members: [{ user_id: "user-2" }]
            });
            
            prisma.project.delete.mockResolvedValue({});
            
            const response = await request(app)
            .delete("/projects/project-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Project deleted successfully");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .delete('/projects/project-1')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 404 when project not found", async () => {
            prisma.project.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .delete("/projects/project-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ 
                name: 'Project New', 
                status: 'planning'
            });
          
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Project not found.");
        });
    });
});