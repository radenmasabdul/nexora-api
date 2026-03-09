const request = require('supertest');
const app = require('../../../src/app.js');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");

jest.mock("../../../prisma/client/index.js", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  },
}));

jest.mock("../../../src/utils/validators/auth/auth.js", () => ({
  validateRegister: [],
  validateLogin: [],
}));

const prisma = require('../../../prisma/client/index.js');

let hashedPassword;

beforeAll(async () => {
  hashedPassword = await bcrypt.hash("Password123!", 10);
});

describe('Auth API', () => {
    const staffToken = jwt.sign(
        { id: "user-1", role: "staff" },
        "test-secret",
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should return 201 for valid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                name: "test user staff",
                email: "staff-test@mail.com",
                password: hashedPassword,
                role: "staff",
            });

            const response = await request(app)
            .post("/auth/register")
            .send({
                name: "test user staff",
                email: "staff-test@mail.com",
                password: "Password123!",
                role: "staff",
            });
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Register successfully");
            expect(response.body.data).toHaveProperty("name");
            expect(response.body.data).toHaveProperty("email");
        })

        it('should return 409 Email Already Exist', async () => {
            prisma.user.findUnique.mockResolvedValue({
                name: "test user staff",
                email: "staff-test@mail.com",
                password: hashedPassword,
                role: "staff",
            });

            const response = await request(app).post("/auth/register").send({
                name: "test user staff",
                email: "staff-test@mail.com",
                password: "Password123!",
                role: "staff",
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Email already exists.");
        })

        it('should return 400 Invalid Roles', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app).post("/auth/register").send({
                name: "test user staff",
                email: "staff-test@mail.com",
                password: "Password123!",
                role: "owner",
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(
              "Invalid role value. Allowed: administrator, manager_division, project_owner, staff.",
            );
        })
    })

    describe('POST /auth/login', () => {
        it('should return 200 for valid credentials', async () => {
            prisma.user.findFirst.mockResolvedValue({
                email: "staff-test@mail.com",
                password: hashedPassword,
            });

            const response = await request(app)
            .post("/auth/login")
            .send({
                email: "staff-test@mail.com",
                password: "Password123!",
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Login successful");
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("token");
            expect(response.body.data).toHaveProperty("expiresAt");
        })

        it('should return 404 for User Not Found', async () => {
            prisma.user.findFirst.mockResolvedValue(null);

            const response = await request(app)
            .post("/auth/login")
            .send({
                email: "owner-test@mail.com",
                password: hashedPassword,
            });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found");
        })

        it('should return 401 for Wrong Password', async () => {
            prisma.user.findFirst.mockResolvedValue({
                email: "staff-test@mail.com",
                password: hashedPassword,
            });

            const response = await request(app)
            .post("/auth/login")
            .send({
                email: "staff-test@mail.com",
                password: "wrongpassword",
            });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid password");
        })
    });

    describe('POST /auth/logout', () => {
        it('should return 200 with token', async () => {
            const response = await request(app)
            .post("/auth/logout")
            .set("Authorization", `Bearer ${staffToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Logout successful");
        })

        it('should return 401 without token', async () => {
            const response = await request(app)
            .post("/auth/logout");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        })
    });
});