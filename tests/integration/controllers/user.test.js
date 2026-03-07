const request = require('supertest');
const app = require('../../../src/app.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock("../../../prisma/client/index.js", () => ({
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
}));

jest.mock("../../../src/utils/validators/user/user.js", () => ({
    validateCreateUser: [],
    validateUpdateUser: [],
}));

jest.mock("../../../src/utils/lib/supabase.js", () => ({
    storage: {
        from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            remove: jest.fn().mockResolvedValue({}),
            getPublicUrl: jest.fn().mockReturnValue({
                data: { publicUrl: "https://supabase.co/avatar.jpg" },
            }),
        }),
    },
}));

const prisma = require('../../../prisma/client/index.js');

let hashedPassword;

beforeAll(async () => {
    hashedPassword = await bcrypt.hash('Password123!', 10);
});

describe('User API', () => {
    const adminToken = jwt.sign(
        { id: 'user-1', role: 'administrator'},
        'test-secret'
    );

    const staffToken = jwt.sign(
        { id: 'user-3', role: 'staff'},
        'test-secret'
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET ROLE COUNTS /users/roles/counts', () => {
        it('should return 200 with token credential', async () => {
            prisma.user.groupBy.mockResolvedValue([
                { role: 'administrator', _count: { role: 1 } },
                { role: 'manager_division', _count: { role: 1 } },
                { role: 'project_owner', _count: { role: 1 } },
                { role: 'staff', _count: { role: 1 } },
            ]);

            const response = await request(app)
            .get('/users/roles/counts')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Get role counts successfully');
            expect(response.body.data).toHaveProperty('administrator');
            expect(response.body.data).toHaveProperty('manager_division');
            expect(response.body.data).toHaveProperty('project_owner');
            expect(response.body.data).toHaveProperty('staff');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/users/roles/counts');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe('POST USERS /users/', () => {
        it('should return 201 for valid credential', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: hashedPassword,
                role: 'staff',
                avatar_url: 'https://supabase.co/avatar.jpg',
            })

            const response = await request(app)
            .post('/users/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: "Password123!",
                role: 'staff',
                avatar_url: 'https://supabase.co/avatar.jpg',
            });
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("User created successfully");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("email");
            expect(response.body.data).not.toHaveProperty("password");
            expect(response.body.data).toHaveProperty("role");
            expect(response.body.data).toHaveProperty("avatar_url");
        });

        it('should return 400 invalid roles', async () => {
          prisma.user.findUnique.mockResolvedValue(null);

          const response = await request(app)
          .post("/users/")
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: "John Doe",
            email: "johndoe@example.com",
            password: "Password123!",
            role: "owner",
            avatar: "https://supabase.co/avatar.jpg",
          });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe("Invalid role value. Allowed roles: administrator, manager_division, project_owner, staff.");
        });

        it('should return 401 without token', async () => {
          const response = await request(app)
          .post("/users/");

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 403 wrong role', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .post('/users/')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: "Password123!",
                role: 'wrong_role',
                avatar: 'https://supabase.co/avatar.jpg',
            });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Forbidden. Insufficient role.");
        });

        it('should return 409 email already exist', async () => {
            prisma.user.findUnique.mockResolvedValue({
                name: "John Doe",
                email: "johndoe@example.com",
                password: "Password123!",
                role: "staff",
                avatar: "https://supabase.co/avatar.jpg",
            });

            const response = await request(app)
            .post('/users/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: "Password123!",
                role: 'staff',
                avatar: 'https://supabase.co/avatar.jpg',
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Email already exists.");
        });
    });

    describe('GET ALL USERS /users/', () => {
        it('should return 200 with token credential', async () => {
            prisma.user.count.mockResolvedValue(2);
            prisma.user.findMany.mockResolvedValue([
                {
                    no: 1,
                    id: 'user-1',
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    role: 'staff',
                    avatar_url: 'https://supabase.co/avatar.jpg',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    no: 2,
                    id: 'user-2',
                    name: 'Jane Doe',
                    email: 'janedoe@example.com',
                    role: 'manager_division',
                    avatar_url: 'https://supabase.co/avatar.jpg',
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            ]);

            const response = await request(app)
            .get('/users/')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Get all users successfully");
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("totalData");
            expect(response.body).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return 401 without token", async () => {
          const response = await request(app)
          .get("/users/");

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe('GET USERS BY ID /users/:id', () => {
        it('should be return 200 with token credential', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                name: 'John Doe',
                email: 'johndoe@example.com',
                role: 'staff',
                avatar_url: 'https://supabase.co/avatar.jpg',
                created_at: new Date(),
                updated_at: new Date(),
            });

            const response = await request(app)
            .get('/users/user-1')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Get user successfully");
            expect(response.body.data).toHaveProperty("id");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("email");
            expect(response.body.data).toHaveProperty("role");
            expect(response.body.data).toHaveProperty("avatar_url");
            expect(response.body.data).toHaveProperty("created_at");
            expect(response.body.data).toHaveProperty("updated_at");
        });

        it('should return 404 user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .get('/users/user-999')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found");
        });

        it("should return 401 without token", async () => {
          const response = await request(app)
          .get("/users/user-1");

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe('UPDATE USER /users/:id', () => {
        it('should be return 200 with token credential', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: hashedPassword,
                role: 'staff',
                avatar_url: 'https://supabase.co/avatar.jpg',
                created_at: new Date(),
                updated_at: new Date(),
            });
            prisma.user.update.mockResolvedValue({
                id: 'user-1',
                name: 'John Doe Update',
                email: 'johndoe@example.com',
                password: "Password123!",
                role: 'staff',
                avatar_url: 'https://supabase.co/avatar.jpg',
                created_at: new Date(),
                updated_at: new Date(),
            });

            const response = await request(app)
            .patch("/users/user-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "John Doe Update",
                email: "johndoe@example.com",
                password: "Password123!",
                role: "staff",
                avatar_url: "https://supabase.co/avatar.jpg",
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("User updated successfully");
            expect(response.body.data).toHaveProperty("id");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("email");
            expect(response.body.data).toHaveProperty("role");
            expect(response.body.data).toHaveProperty("avatar_url");
            expect(response.body.data).toHaveProperty("created_at");
            expect(response.body.data).toHaveProperty("updated_at");
        });

        it('should return 400 invalid roles', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .patch("/users/user-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "John Doe Update",
                email: "johndoe@example.com",
                password: "Password123!",
                role: "owner",
                avatar_url: "https://supabase.co/avatar.jpg",
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid role value. Allowed roles: administrator, manager_division, project_owner, staff.");
        });

        it('should return 404 user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null); 
            
            const response = await request(app)
            .patch('/users/user-9999')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'John Doe' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found.");
        });

        it('should return 409 email already exist', async () => {
            prisma.user.findUnique
                .mockResolvedValueOnce({
                    id: 'user-1',
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    password: hashedPassword,
                    role: 'staff',
                    avatar_url: 'https://supabase.co/avatar.jpg',
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .mockResolvedValueOnce({
                    id: 'user-2',
                    name: 'Jane Doe',
                    email: 'janedoe@example.com',
                    password: hashedPassword,
                    role: 'staff',
                    avatar_url: 'https://supabase.co/avatar.jpg',
                    created_at: new Date(),
                    updated_at: new Date(),
                })

            const response = await request(app)
            .patch('/users/user-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'John Doe',
                email: 'janedoe@example.com',
                password: "Password123!",
                role: 'staff',
                avatar: 'https://supabase.co/avatar.jpg',
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Email already in use by another user.");
        });

        it('should return 401 without token', async () => {
          const response = await request(app)
          .patch("/users/user-1");

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe('DELETE USER /users/:id', () => {
        it('should be return 200 with token credential', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: hashedPassword,
                role: 'staff',
                avatar_url: 'https://supabase.co/avatar.jpg',
                created_at: new Date(),
                updated_at: new Date(),
            })
            prisma.user.delete.mockResolvedValue({
                id: 'user-1',
                name: 'John Doe',
                email: 'johndoe@example.com',
                role: 'staff',
                avatar_url: 'https://supabase.co/avatar.jpg',
                created_at: new Date(),
                updated_at: new Date(),
            });

            const response = await request(app)
            .delete('/users/user-1')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("User deleted successfully");
        });

        it('should return 404 user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null); 
            
            const response = await request(app)
            .delete('/users/user-9999')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'John Doe' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found.");
        });

        it('should return 401 without token', async () => {
          const response = await request(app)
          .delete("/users/user-1");

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 403 wrong role', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .delete('/users/user-1')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: "Password123!",
                role: 'wrong_role',
                avatar: 'https://supabase.co/avatar.jpg',
            });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Forbidden. Insufficient role.");
        });
    });
});