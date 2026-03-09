const request = require("supertest");
const app = require("../../../src/app");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    task: {
        findUnique: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
    },
    comment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
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

jest.mock("../../../src/utils/validators/comments/comments.js", () => ({
    validateCreateComment: [],
}));

const prisma = require("../../../prisma/client/index.js");

describe("Comment API", () => {
    const adminToken = jwt.sign(
        { id: "user-1", role: "administrator" },
        "test-secret",
    );
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("CREATE COMMENT /comments/", () => {
        it("should return 201 for valid credential", async () => {
            prisma.task.findUnique
            .mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
                assign_to: "user-1",
                created_by: "user-1",
                project: {
                    team: {
                        members: [
                            { user_id: "user-1" }
                        ],
                    },
                },
            })
            .mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
                assignedUser: { 
                    id: "user-1", 
                    name: "John Doe"
                },
                project: {
                    team: {
                        members: [
                            { user_id: "user-1" }
                        ],
                    },
                },
            });
            
            prisma.user.findUnique.mockResolvedValueOnce({
                id: "user-1",
                name: "John Doe",
            });

            prisma.comment.create.mockResolvedValue({
                id: "comment-1",
                content: "Test Comment",
                user: { 
                    id: "user-1", 
                    name: "John Doe", 
                    email: "johndoe@example.com"
                },
                task: {
                    id: "task-1",
                    title: "Test Task",
                    description: "Test Description",
                },
            });

            const response = await request(app)
            .post("/comments/")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                task_id: "task-1",
                content: "Test Comment",
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Comment added successfully");
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("task");
            expect(response.body.data).toHaveProperty("content");
        });
        
        it("should return 401 without token", async () => {
            const response = await request(app)
            .post("/comments/");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 403 access denied", async () => {
            prisma.task.findUnique.mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
                assign_to: "user-999",
                created_by: "user-999",
                project: { team: { members: []}}
            });
        
            const response = await request(app)
            .post("/comments/")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                task_id: "task-1",
                content: "Test Comment",
            });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Access denied to this task");
        });

        it("should return 404 when task not found", async () => {
            prisma.task.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .post("/comments/")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                task_id: "task-9999",
                content: "Test Comment",
            });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Task not found");
        });
    });

    describe("GET ALL COMMENT /comments/", () => {
        it("should return 200 with token credential", async () => {
            prisma.comment.count.mockResolvedValue(2);
            prisma.comment.findMany.mockResolvedValue([
                {
                    id: "comment-1",
                    content: "Test Comment",
                    user: {
                        id: "user-1",
                        name: "John Doe",
                        email: "johndoe@example.com",
                    },
                    task: { 
                        id: "task-1",
                        title: "Test Task"
                    },
                },
                {
                    id: "comment-2",
                    content: "Test Comment 2",
                    user: {
                        id: "user-2",
                        name: "Jane Smith",
                        email: "janesmith@example.com",
                    },
                    task: { 
                        id: "task-1",
                        title: "Test Task"
                    },
                },
            ]);
            
            const response = await request(app)
            .get("/comments/")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Comments retrieved successfully");
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("totalData");
            expect(response.body).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        
        it("should return 401 without token", async () => {
            const response = await request(app).get("/comments/");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("GET COMMENT BY ID /comments/:id", () => {
        it("should return 200 with token credential", async () => {
            prisma.comment.findUnique.mockResolvedValue({
                id: "comment-1",
                content: "Test Comment",
                user: { 
                    id: "user-1", 
                    name: "John Doe", 
                    email: "johndoe@example.com"
                },
                task: { 
                    id: "task-1", 
                    title: "Test Task"
                },
            });
            
            const response = await request(app)
            .get("/comments/comment-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Comment retrieved successfully");
            expect(response.body.data).toHaveProperty("content");
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("task");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .get("/comments/comment-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 404 when comment not found", async () => {
            prisma.comment.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .get("/comments/comment-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Comment not found");
        });
    });

    describe("DELETE COMMENT /comments/:id", () => {
        it("should return 200 with token credential", async () => {
            prisma.comment.findUnique
            .mockResolvedValueOnce({
                id: "comment-1",
                content: "Test Comment",
                user_id: "user-1",
                task_id: "task-1",
                task: {
                    assignedUser: { 
                        id: "user-2" 
                    },
                },
            });

            prisma.task.findUnique.mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
            });

            prisma.user.findUnique.mockResolvedValueOnce({
                id: "user-1",
                name: "John Doe",
            });
            
            prisma.comment.delete.mockResolvedValue({});
            
            const response = await request(app)
            .delete("/comments/comment-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Comment deleted successfully");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .delete("/comments/comment-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 403 access denied", async () => {
            prisma.comment.findUnique.mockResolvedValueOnce({
                id: "comment-1",
                content: "Test Comment",
                user_id: "user-999",
                task_id: "task-1",
                task: {
                    assignedUser: { 
                        id: "user-2"
                    },
                },
            });

            const response = await request(app)
            .delete("/comments/comment-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Access denied. You can only delete your own comment.");
        });

        it("should return 404 when comment not found", async () => {
            prisma.comment.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .delete("/comments/comment-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Comment not found.");
        });
    });
});