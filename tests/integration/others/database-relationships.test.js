const request = require("supertest");
const app = require("../../../src/app");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    user: { findUnique: jest.fn() },
    team: { findUnique: jest.fn() },
    teamMember: { findUnique: jest.fn(), findMany: jest.fn() },
    project: { findUnique: jest.fn() },
    task: { findUnique: jest.fn() },
    comment: { findUnique: jest.fn() },
    notification: { findUnique: jest.fn() },
    activityLog: { findUnique: jest.fn() },
}));

const prisma = require("../../../prisma/client/index.js");

describe("Database Relationship", () => {
    const adminToken = jwt.sign(
        { id: "user-1", role: "administrator" },
        "test-secret"
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("User -> Team relationship", () => {
        it("should return team with createdBy user", async () => {
            prisma.team.findUnique.mockResolvedValueOnce({
                id: "team-1",
                name: "Test Team",
                createdBy: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
                members: [],
            });

            const response = await request(app)
            .get("/teams/team-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("createdBy");
            expect(response.body.data.createdBy).toHaveProperty("id");
            expect(response.body.data.createdBy).toHaveProperty("name");
            expect(response.body.data.createdBy).toHaveProperty("email");
        });
    });

    describe("Team -> Member relationship", () => {
        it("should return members with user data", async () => {
            prisma.teamMember.findMany.mockResolvedValueOnce([
                {
                    id: "member-1",
                    team_id: "team-1",
                    user_id: "user-1",
                    role: "developer",
                    user: {
                        id: "user-1",
                        name: "John Doe",
                        email: "johndoe@example.com",
                        avatar_url: null,
                    },
                },
            ]);

            const response = await request(app)
            .get("/teams/team-1/members")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data[0]).toHaveProperty("user");
            expect(response.body.data[0].user).toHaveProperty("id");
            expect(response.body.data[0].user).toHaveProperty("name");
            expect(response.body.data[0].user).toHaveProperty("email");
        });
    });

    describe("Project -> Team relationship", () => {
        it("should return project with team data", async () => {
            prisma.project.findUnique.mockResolvedValueOnce({
                id: "project-1",
                name: "Test Project",
                status: "planning",
                deadline: null,
                team: {
                    id: "team-1",
                    name: "Test Team",
                    description: "A test team",
                },
            });

            const response = await request(app)
            .get("/projects/project-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("team");
            expect(response.body.data.team).toHaveProperty("id");
            expect(response.body.data.team).toHaveProperty("name");
        });
    });

    describe("Task -> Project relationship", () => {
        it("should return task with project and assignedUser", async () => {
            prisma.task.findUnique.mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
                status: "to_do",
                priority: "medium",
                project: {
                    id: "project-1",
                    name: "Test Project",
                },
                assignedUser: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
            });

            const response = await request(app)
            .get("/tasks/task-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("project");
            expect(response.body.data).toHaveProperty("assignedUser");
            expect(response.body.data.project).toHaveProperty("id");
            expect(response.body.data.assignedUser).toHaveProperty("id");
        });
    });

    describe("Comment -> Task relationship", () => {
        it("should return comment with task and user", async () => {
            prisma.comment.findUnique.mockResolvedValueOnce({
                id: "comment-1",
                content: "Test Comment",
                user: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
                task: {
                    id: "task-1",
                    title: "Test Task",
                },
            });

            const response = await request(app)
            .get("/comments/comment-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("task");
            expect(response.body.data.task).toHaveProperty("id");
            expect(response.body.data.task).toHaveProperty("title");
        });
    });

    describe("Notification → User relationship", () => {
        it("should return notification with user data", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-1",
                message: "Test notification",
                is_read: false,
                user: {
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
            });

            const response = await request(app)
            .get("/notifications/notif-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data.user).toHaveProperty("id");
            expect(response.body.data.user).toHaveProperty("name");
            expect(response.body.data.user).toHaveProperty("email");
        });
    });    
});