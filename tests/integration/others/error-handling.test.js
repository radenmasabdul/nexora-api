const request = require("supertest");
const app = require("../../../src/app");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    user: { findUnique: jest.fn() },
    team: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn()
    },
    project: { findUnique: jest.fn() },
    task: { findUnique: jest.fn() },
    comment: { findUnique: jest.fn() },
    notification: { findUnique: jest.fn() },
    activityLog: { create: jest.fn() },
}));

const prisma = require("../../../prisma/client/index.js");

describe("Error Handling", () => {
    const adminToken = jwt.sign(
        { id: "user-1", role: "administrator" },
        "test-secret"
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("404 Not Found", () => {
        it("should return 404 for unknown route", async () => {
            const response = await request(app)
            .get("/unknown-route");

            expect(response.status).toBe(404);
        });

        it("should return 404 when team not found", async () => {
            prisma.team.findUnique.mockResolvedValueOnce(null);

            const response = await request(app)
            .get("/teams/team-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Team not found");
        });

        it("should return 404 when project not found", async () => {
            prisma.project.findUnique.mockResolvedValueOnce(null);

            const response = await request(app)
            .get("/projects/project-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Project not found");
        });

        it("should return 404 when task not found", async () => {
            prisma.task.findUnique.mockResolvedValueOnce(null);

            const response = await request(app)
            .get("/tasks/task-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Task not found");
        });

        it("should return 404 when comment not found", async () => {
            prisma.comment.findUnique.mockResolvedValueOnce(null);

            const response = await request(app)
            .get("/comments/comment-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Comment not found");
        });

        it("should return 404 when notification not found", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce(null);

            const response = await request(app)
            .get("/notifications/notif-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Notification not found");
        });
    });

    describe("401 Unauthenticated", () => {
        it("should return 401 when no token on teams", async () => {
            const response = await request(app).get("/teams/");
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 401 when no token on projects", async () => {
            const response = await request(app).get("/projects/");
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 401 when no token on tasks", async () => {
            const response = await request(app).get("/tasks/");
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 401 with invalid token", async () => {
            const response = await request(app)
            .get("/teams/")
            .set("Authorization", "Bearer invalidtoken123");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid token.");
        });
    });

    describe("403 Forbidden", () => {
        it("should return 403 when staff access admin only route", async () => {
            const staffToken = jwt.sign(
                { id: "user-2", role: "staff" },
                "test-secret"
            );

            const response = await request(app)
            .delete("/users/user-9999")
            .set("Authorization", `Bearer ${staffToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Forbidden. Insufficient role.");
        });
    });

    describe("500 Internal Server Error", () => {
        it("should return 500 when database throws error", async () => {
            prisma.team.findMany.mockRejectedValueOnce(
                new Error("Database connection failed")
            );

            const response = await request(app)
            .get("/teams/")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });
});