const request = require("supertest");
const app = require("../../../src/app.js");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    team: {
        findUnique: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
    },
    teamMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    activityLog: {
        create: jest.fn(),
    },
    notification: {
        create: jest.fn(),
    },
}));

jest.mock("../../../src/utils/validators/member/member.js", () => ({
    validateCreateTeamMember: [],
    validateUpdateTeamMember: [],
}));

const prisma = require("../../../prisma/client/index.js");

describe('Member API', () => {
    const adminToken = jwt.sign(
        { id: "user-1", role: "administrator" },
        "test-secret",
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('CREATE MEMBER /members/', () => {
        it('should return 201 for valid credential', async () => {
            prisma.team.findUnique
            .mockResolvedValueOnce({
                id: "team-1",
                name: "Test Team",
            })
            .mockResolvedValueOnce({
                id: "team-1", 
                name: "Test Team"
            });

            prisma.user.findUnique.mockResolvedValueOnce({
                id: "user-1",
                name: "John Doe",
                email: "test@example.com"
            });

            prisma.teamMember.findUnique.mockResolvedValueOnce(null);

            prisma.teamMember.findUnique.mockResolvedValueOnce([
                {
                    id: "team-member-1",
                    team_id: "team-1",
                    user_id: "user-1",
                    role: "developer",
                    team: {
                        id: "team-1",
                        name: "Test Team",
                        description: "A test team"
                    },
                    user: { 
                        id: "user-1",
                        name: "John Doe",
                        email: "johndoe@example.com"
                    },
                },
            ]);

            prisma.teamMember.create.mockResolvedValue({
                team: {
                    id: "team-1",
                    name: "New Team",
                    description: "A new team"
                },
                user: { 
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                },
                role: "developer",
            });

            const response = await request(app)
            .post('/members/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                team_id: "team-1",
                user_id: "user-1",
                role: "developer",
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Member added to team successfully");
            expect(response.body.data).toHaveProperty("team");
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("role");
        });

        it("should return 400 invalid roles", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .post("/members/")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
              name: "John Doe",
              email: "johndoe@example.com",
              password: "Password123!",
              role: "owner",
              avatar: "https://supabase.co/avatar.jpg",
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid role. Allowed: project_owner, team_leader, developer.",);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .post('/members/')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when team not found', async () => {
            prisma.team.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .post('/members/')
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

        it('should return 404 when user not found', async () => {
            prisma.team.findUnique.mockResolvedValue({
                id: "team-1",
                name: "Test Team"
            });
            prisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .post('/members/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                team_id: "team-1",
                user_id: "user-9999",
                role: "developer",
            });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found.");
        });

        it("should return 409 member existing", async () => {
            prisma.team.findUnique.mockResolvedValue({
                id: "team-1",
                name: "Test Team"
            });
            
            prisma.user.findUnique.mockResolvedValue({
                id: "user-1",
                name: "John Doe",
                email: "johndoe@example.com"
            });

            prisma.teamMember.findUnique.mockResolvedValue({
                id: "team-member-1",
                team_id: "team-1",
                user_id: "user-1",
                role: "developer",
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team",
                },
                user: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
            });
            
            const response = await request(app)
            .post("/members/")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                team_id: "team-1",
                user_id: "user-1",
                role: "developer",
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Member already exists in the team.");
        });
    });

    describe('GET ALL MEMBER /members/', () => {
        it('should return 200 with token credential', async () => {
            prisma.teamMember.count.mockResolvedValue(2);
            prisma.teamMember.findMany.mockResolvedValue([
                {
                    no: 1,
                    team_id: 'team-1',
                    user_id: 'user-1',
                    role: 'developer',
                    team: {
                        id: 'team-1',
                        name: 'Test Team',
                        description: 'A test team'
                    },
                    user: {
                        id: 'user-1',
                        name: 'John Doe',
                        email: 'johndoe@example.com'
                    }
                },
                {
                    no: 2,
                    team_id: 'team-2',
                    user_id: 'user-2',
                    role: 'team_leader',
                    team: {
                        id: 'team-2',
                        name: 'Another Team',
                        description: 'Another test team'
                    },
                    user: {
                        id: 'user-2',
                        name: 'Jane Smith',
                        email: 'janesmith@example.com'
                    }
                },
            ]);

            const response = await request(app)
            .get('/members/')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Members retrieved successfully");
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("totalData");
            expect(response.body).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .get('/members/')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe('GET MEMBER BY ID /members/:id', () => {
        it('should be return 200 with token credential', async () => {
            prisma.teamMember.findUnique.mockResolvedValue({
                id: "team-member-1",
                team_id: "team-1",
                user_id: "user-1",
                role: "developer",
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                user: { 
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                },
            },);

            const response = await request(app)
            .get('/members/team-member-1')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Member retrieved successfully");
            expect(response.body.data).toHaveProperty("team");
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("role");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .get('/members/team-member-9999')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when member not found', async () => {
            prisma.teamMember.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .get('/members/team-member-9999')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Member not found");
        });
    });

    describe('UPDATE MEMBER /members/:id', () => {
        it('should be return 200 with token credential', async () => {
            prisma.teamMember.findUnique.mockResolvedValue({
                id: "team-member-1",
                team_id: "team-1",
                user_id: "user-1",
                role: "developer",
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                user: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                },
            });

            prisma.team.findUnique
            .mockResolvedValueOnce({
                id: "team-1",
                name: "Test Team",
            })
            .mockResolvedValueOnce({
                id: "team-1", 
                name: "Test Team"
            });

            prisma.teamMember.update.mockResolvedValue({
                id: "team-member-1",
                team_id: "team-1",
                user_id: "user-1",
                role: "team_leader",
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                user: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                },
            });

            const response = await request(app)
            .patch('/members/team-member-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                role: "team_leader",
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Member updated successfully");
            expect(response.body.data).toHaveProperty("team");
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("role");
        });

        it("should return 400 invalid roles", async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .patch("/members/team-member-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
              role: "owner",
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid role. Allowed: project_owner, team_leader, developer.");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .patch('/members/team-member-1')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when member not found', async () => {
            prisma.teamMember.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .patch('/members/team-member-9999')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: "team_leader" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Member not found.");
        });
    });

    describe('DELETE MEMBER /members/:id', () => {
        it('should return 200 with token credential', async () => {
            prisma.teamMember.findUnique.mockResolvedValue({
                id: "team-member-1",
                team_id: "team-1",
                user_id: "user-1",
                role: "developer",
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                user: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                },
            });

            prisma.teamMember.delete.mockResolvedValue({
                id: "team-member-1",
                team_id: "team-1",
                user_id: "user-1",
                role: "developer",
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team"
                },
                user: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                },
            });

            const response = await request(app)
            .delete('/members/team-member-1')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Member deleted successfully");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .delete('/members/team-member-1')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 404 when member not found', async () => {
            prisma.teamMember.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .delete('/members/team-member-9999')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: "team_leader" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Member not found.");
        });
    });
});