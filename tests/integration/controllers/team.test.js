const request = require('supertest');
const app = require('../../../src/app.js');
const jwt = require('jsonwebtoken');

jest.mock("../../../prisma/client/index.js", () => ({
    team: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    teamMember: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
    },
    activityLog: {
        create: jest.fn(),
    },
    notification: {
        create: jest.fn(),
    },
    user: {
        findMany: jest.fn(),
    },
}));

jest.mock("../../../src/utils/validators/team/team.js", () => ({
    validateCreateTeam: [],
    validateUpdateTeam: [],
}));

const prisma = require("../../../prisma/client/index.js");

describe('Team API', () => {
    const adminToken = jwt.sign(
        { id: 'user-1', role: 'administrator'},
        'test-secret'
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET TEAM DASHBOARD /dashboard/teams', () => {
        it('should return 200 with token credential', async () => {
            prisma.team.findMany.mockResolvedValue([
                {
                    id: "team-1",
                    name: "Test Team",
                    _count: { members: 2 },
                    projects: [
                        {
                            id: "project-1",
                            tasks: [
                                { id: "task-1" },
                                { id: "task-2" }
                            ],
                        },
                    ],
                },
            ]);

            const response = await request(app)
            .get('/dashboard/teams')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .get("/dashboard/teams");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe('CREATE TEAM MEMBER /teams/', () => {
        it('should return 201 for valid credential', async () => {
            prisma.team.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 'team-1',
                    name: 'New Team',
                    createdBy: { name: 'John Doe' }
                });
            
            prisma.team.create.mockResolvedValue({
              name: "New Team",
              description: "A new team",
              createdBy: {
                id: "user-1",
                name: "John Doe",
                email: "johndoe@example.com",
              },
            });

            prisma.user.findMany.mockResolvedValue([]);

            const response = await request(app)
              .post("/teams/")
              .set("Authorization", `Bearer ${adminToken}`)
              .send({
                name: "New Team",
                description: "A new team",
              });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Team created successfully");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("description");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .post('/teams/')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 409 team existing', async () => {
            prisma.team.findUnique.mockResolvedValue({
                id: "team-1",
                name: "A new team",
            });

            const response = await request(app)
            .post('/teams/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                id: "team-1",
                name: "A new team",
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Team name already taken.");
        });
    });

    describe('GET ALL TEAM /teams/', () => {
        it('should return 200 with token credential', async () => {
            prisma.team.count.mockResolvedValue(2);
            prisma.team.findMany.mockResolvedValue([
                {
                    no: 1,
                    id: "team-1",
                    name: "Team Alpha",
                    description: "First team",
                    created_at: new Date(),
                    update_at: new Date(),
                    createdBy: {
                        id: "user-1",
                        name: "John Doe",
                        email: "johndoe@example.com",
                    },
                    _count: { members: 5 },
                },
                {
                    no: 2,
                    id: "team-2",
                    name: "Team Beta",
                    description: "Second team",
                    created_at: new Date(),
                    update_at: new Date(),
                    createdBy: {
                        id: "user-2",
                        name: "Jane Smith",
                        email: "janesmith@example.com",
                    },
                    _count: { members: 3 },
                },
            ]);

            const response = await request(app)
            .get('/teams/')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Teams retrieved successfully");
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("totalData");
            expect(response.body).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .get('/teams/')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("GET TEAM MEMBER /teams/:id/members", () => {
      it("should return 200 with valid team id and token credential", async () => {
        prisma.teamMember.findMany.mockResolvedValue([
          {
            id: "team-member-1",
            team_id: "team-1",
            user_id: "user-1",
            joined_at: new Date(),
            user: {
              id: "user-1",
              name: "John Doe",
              email: "johndoe@example.com",
              avatar_url: "https://supabase.co/avatar.jpg",
            },
          },
        ]);

        const response = await request(app)
          .get("/teams/team-1/members")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
          "Team members retrieved successfully",
        );
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it("should return 401 without token", async () => {
        const response = await request(app).get("/teams/team-1/members");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Unauthenticated.");
      });
    });

    describe('GET TEAM BY ID /teams/:id', () => {
        it('should be return 200 with token credential', async () => {
            prisma.team.findUnique.mockResolvedValue({
                id: 'team-1',
                name: 'Team Alpha',
                description: 'First team',
                created_at: new Date(),
                updated_at: new Date(),
                createdBy: {
                    id: 'user-1',
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                },
                _count: { members: 5 },
            });

            const response = await request(app)
            .get('/teams/team-1')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Get team successfully");
            expect(response.body.data).toHaveProperty("id");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("description");
            expect(response.body.data).toHaveProperty("created_at");
            expect(response.body.data).toHaveProperty("updated_at");
            expect(response.body.data).toHaveProperty("createdBy");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .get('/teams/team-9999')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when team not found', async () => {
            prisma.team.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .get('/teams/team-9999')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Team not found");
        });
    });

    describe('UPDATE TEAM /teams/:id', () => {
        it('should be return 200 with token credential', async () => {
            prisma.team.findUnique
                .mockResolvedValueOnce({
                    id: 'team-1',
                    name: 'Team Alpha',
                    description: 'First Team',
                })
                .mockResolvedValueOnce(null)
            
            prisma.team.update.mockResolvedValue({
                id: 'team-1',
                name: 'Team Alpha Updated',
                description: 'First Team Updated',
                created_at: new Date(),
                updated_at: new Date(),
                createdBy: {
                    id: 'user-1',
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                },
            });

            const response = await request(app)
            .patch('/teams/team-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Team Alpha Updated',
                description: 'First Team Updated',
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Team updated successfully");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("description");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .get('/teams/team-1')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when team not found', async () => {
            prisma.team.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .patch('/teams/team-9999')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Team Alpha', description: 'test' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Team not found.");
        });

        it('should return 409 team existing', async () => {
            prisma.team.findUnique.mockResolvedValue({
                id: 'team-1',
                name: 'Team Alpha',
                description: 'First Team',
            });

            const response = await request(app)
            .patch('/teams/team-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Team Alpha Updated',
                description: 'First Team Updated',
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Team name already taken.");
        });
    });

    describe('DELETE TEAM /teams/:id', () => {
        it('should return 200 with token credential', async () => {
            prisma.team.findUnique
            .mockResolvedValueOnce({
                id: "team-1",
                name: "Team Alpha",
            })
            .mockResolvedValueOnce({
                id: "team-1",
                name: "Team Alpha",
                members: [
                    { user_id: 'user-2' },
                    { user_id: 'user-3' },
                ],
            });

            prisma.teamMember.deleteMany.mockResolvedValue({});
            prisma.team.delete.mockResolvedValue({});

            const response = await request(app)
            .delete('/teams/team-1')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Team deleted successfully");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .delete('/teams/team-1')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when team not found', async () => {
            prisma.team.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .delete('/teams/team-9999')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Team Alpha', description: 'test' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Team not found.");
        });
    });
});