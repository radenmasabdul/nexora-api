const request = require("supertest");
const app = require("../../../src/app");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    user: {
        findMany: jest.fn(),
        count: jest.fn()
    },
    team: {
        findMany: jest.fn(),
        count: jest.fn()
    },
    project: {
        findMany: jest.fn(),
        count: jest.fn()
    },
    task: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn()
    },
    comment: {
        findMany: jest.fn(),
        count: jest.fn()
    },
    notification: {
        findMany: jest.fn(),
        count: jest.fn() },
    activityLog: {
        findMany: jest.fn(),
        count: jest.fn()
    },
}));

const prisma = require("../../../prisma/client/index.js");

const RESPONSE_TIME_LIMIT = 500;

describe("Performance Test", () => {
    const adminToken = jwt.sign(
        { id: "user-1", role: "administrator" },
        "test-secret"
    );

    afterEach(() => jest.clearAllMocks());

    describe("Response Time", () => {
        it("GET /users/ should respond within time limit", async () => {
            prisma.user.count.mockResolvedValue(1);
            prisma.user.findMany.mockResolvedValue([]);

            const start = Date.now();
            const response = await request(app)
            .get("/users/")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });

        it("GET /teams/ should respond within time limit", async () => {
            prisma.team.count.mockResolvedValue(1);
            prisma.team.findMany.mockResolvedValue([]);

            const start = Date.now();
            const response = await request(app)
            .get("/teams/")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });

        it("GET /projects/ should respond within time limit", async () => {
            prisma.project.count.mockResolvedValue(1);
            prisma.project.findMany.mockResolvedValue([]);

            const start = Date.now();
            const response = await request(app)
            .get("/projects/")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });

        it("GET /tasks/ should respond within time limit", async () => {
            prisma.task.count.mockResolvedValue(1);
            prisma.task.findMany.mockResolvedValue([]);

            const start = Date.now();
            const response = await request(app)
            .get("/tasks/")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });

        it("GET /comments/ should respond within time limit", async () => {
            prisma.comment.count.mockResolvedValue(1);
            prisma.comment.findMany.mockResolvedValue([]);

            const start = Date.now();
            const response = await request(app)
            .get("/comments/")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });

        it("GET /notifications/ should respond within time limit", async () => {
            prisma.notification.count.mockResolvedValue(1);
            prisma.notification.findMany.mockResolvedValue([]);

            const start = Date.now();
            const response = await request(app)
            .get("/notifications/")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });

        it("GET /activities/ should respond within time limit", async () => {
            prisma.activityLog.count.mockResolvedValue(1);
            prisma.activityLog.findMany.mockResolvedValue([]);

            const start = Date.now();
            const response = await request(app)
            .get("/activities/")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });
    });

    describe("Concurrent Requests", () => {
        it("should handle multiple requests simultaneously", async () => {
            prisma.team.count.mockResolvedValue(1);
            prisma.team.findMany.mockResolvedValue([]);

            const requests = Array(5).fill(null).map(() =>
                request(app)
                .get("/teams/")
                .set("Authorization", `Bearer ${adminToken}`)
            );

            const start = Date.now();
            const responses = await Promise.all(requests);
            const duration = Date.now() - start;

            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT * 2);
        });

        it("should handle multiple different endpoints simultaneously", async () => {
            prisma.team.count.mockResolvedValue(1);
            prisma.team.findMany.mockResolvedValue([]);
            prisma.project.count.mockResolvedValue(1);
            prisma.project.findMany.mockResolvedValue([]);
            prisma.task.count.mockResolvedValue(1);
            prisma.task.findMany.mockResolvedValue([]);

            const start = Date.now();
            const [teamsRes, projectsRes, tasksRes] = await Promise.all([
                request(app).get("/teams/").set("Authorization", `Bearer ${adminToken}`),
                request(app).get("/projects/").set("Authorization", `Bearer ${adminToken}`),
                request(app).get("/tasks/").set("Authorization", `Bearer ${adminToken}`),
            ]);
            const duration = Date.now() - start;

            expect(teamsRes.status).toBe(200);
            expect(projectsRes.status).toBe(200);
            expect(tasksRes.status).toBe(200);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT * 2);
        });
    });

    describe("Pagination Performance", () => {
        it("should handle large page size efficiently", async () => {
            prisma.task.count.mockResolvedValue(100);
            prisma.task.findMany.mockResolvedValue(
                Array(50).fill(null).map((_, i) => ({
                    id: `task-${i}`,
                    title: `Task ${i}`,
                    status: "to_do",
                    priority: "medium",
                }))
            );

            const start = Date.now();
            const response = await request(app)
            .get("/tasks/?page=1&limit=50")
            .set("Authorization", `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(50);
            expect(duration).toBeLessThan(RESPONSE_TIME_LIMIT);
        });
    });
});