const request = require("supertest");
const app = require("../../../src/app");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    project: {
        findUnique: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    task: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    activityLog: {
        create: jest.fn(),
    },
    notification: {
        create: jest.fn(),
    },
}));

jest.mock("../../../src/utils/validators/task/task.js", () => ({
    validateCreateTask: [],
    validateUpdateTask: [],
}));

const prisma = require("../../../prisma/client/index.js");

describe("Task API", () => {
    const adminToken = jwt.sign(
        { id: 'user-1', role: 'administrator'},
        'test-secret'
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET TASK DASHBOARD STATUS /dashboard/tasks/status", () => {
        it("should return 200 with token credential", async () => {
            prisma.task.groupBy.mockResolvedValue([
                { status: "to_do", _count: { status: 3 } },
                { status: "in_progress", _count: { status: 2 } },
                { status: "done", _count: { status: 5 } }
            ]);
            
            const response = await request(app)
            .get("/dashboard/tasks/status")
            .set("Authorization", `Bearer ${adminToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data[0]).toHaveProperty("status");
            expect(response.body.data[0]).toHaveProperty("count");
        });
        
        it("should return 401 without token", async () => {
            const response = await request(app).get("/dashboard/tasks/status");
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("GET TASK DASHBOARD PRIORITY /dashboard/tasks/priority", () => {
        it("should return 200 with token credential", async () => {
            prisma.task.groupBy.mockResolvedValue([
                { priority: "low", _count: { priority: 2 } },
                { priority: "medium", _count: { priority: 4 } },
                { priority: "high", _count: { priority: 1 } },
            ]);
            
            const response = await request(app)
            .get("/dashboard/tasks/priority")
            .set("Authorization", `Bearer ${adminToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data[0]).toHaveProperty("priority");
            expect(response.body.data[0]).toHaveProperty("count");
        });
        
        it("should return 401 without token", async () => {
            const response = await request(app).get("/dashboard/tasks/priority");
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("GET TASK DASHBOARD WORKLOAD /dashboard/tasks/workload", () => {
        it("should return 200 with token credential", async () => {
            prisma.user.findMany.mockResolvedValue([
                {
                    id: "user-1",
                    name: "John Doe",
                    _count: { assignedTasks: 3 },
                },
                {
                    id: "user-2",
                    name: "Jane Smith",
                    _count: { assignedTasks: 1 },
                },
            ]);
            
            const response = await request(app)
            .get("/dashboard/tasks/workload")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data[0]).toHaveProperty("user_id");
            expect(response.body.data[0]).toHaveProperty("name");
            expect(response.body.data[0]).toHaveProperty("workload");
        });
        
        it("should return 401 without token", async () => {
            const response = await request(app).get("/dashboard/tasks/workload");
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("CREATE TASK /tasks/", () => {
        it("should return 201 for valid credential", async () => {
            prisma.project.findUnique.mockResolvedValue({
                id: "project-1",
                name: "Test Project",
            });

            prisma.user.findUnique.mockResolvedValue({
                id: "user-1",
                name: "John Doe",
            });

            prisma.task.findFirst.mockResolvedValueOnce(null);

            prisma.task.create.mockResolvedValueOnce({
                id: "task-1",
                project_id: "project-1",
                assign_to: "user-1",
                title: "Test Task",
                description: "Test Description",
                priority: "medium",
                status: "to_do",
                due_date: "2023-12-31",
                created_at: new Date(),
                updated_at: new Date(),
            });

            prisma.task.findUnique.mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
                assignedUser: { 
                    id: "user-1", 
                    name: "John Doe" 
                },
                project: {
                    team: {
                        members: [{ user_id: "user-2" }]
                    }
                }
            });

            const response = await request(app)
            .post("/tasks/")
            .set("Authorization", `Bearer ${adminToken}`)

            .send({
                project_id: "project-1",
                assign_to: "user-1",
                title: "Test Task",
                description: "Test Description",
                priority: "medium",
                status: "to_do",
                due_date: "2023-12-31",
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Task created successfully");
            expect(response.body.data).toHaveProperty("id");
            expect(response.body.data).toHaveProperty("title");
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
            .post('/tasks/')

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
        
        it('should return 404 when project not found', async () => {
            prisma.project.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .post('/tasks/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                project_id: "project-9999",
                assign_to: "user-1",
                title: "Test Task",
                description: "Test Description",
                priority: "medium",
                status: "to_do",
                due_date: "2023-12-31",
            });
            
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Project not found.");
        });

        it('should return 404 when user not found', async () => {
            prisma.project.findUnique.mockResolvedValue({
                id: "project-1",
                name: "Test Project",
            });

            prisma.user.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
            .post('/tasks/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                project_id: "project-1",
                assign_to: "user-9999",
                title: "Test Task",
                description: "Test Description",
                priority: "medium",
                status: "to_do",
                due_date: "2023-12-31",
            });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found.");
        });

        it('should return 409 task existing', async () => {
            prisma.project.findUnique.mockResolvedValue({
                id: "project-1",
                name: "Test Project",
            });

            prisma.user.findUnique.mockResolvedValue({
                id: "user-1",
                name: "John Doe",
            });

            prisma.task.findFirst.mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
                project_id: "project-1",
            });

            const response = await request(app)
            .post('/tasks/')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                project_id: "project-1",
                assign_to: "user-1",
                title: "Test Task",
                description: "Test Description",
                priority: "medium",
                status: "to_do",
                due_date: "2023-12-31",
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Task with the same title already exists in the project.");
        });
    });

    describe("GET ALL TASK /tasks/", () => {
        it("should return 200 with token credential", async () => {
            prisma.task.count.mockResolvedValue(2);
            prisma.task.findMany.mockResolvedValue([
                {
                    id: "task-1",
                    project_id: "project-1",
                    assign_to: "user-1",
                    title: "Test Task",
                    description: "Test Description",
                    priority: "medium",
                    status: "to_do",
                    due_date: "2023-12-31",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: "task-2",
                    project_id: "project-2",
                    assign_to: "user-2",
                    title: "Test Task 2",
                    description: "Test Description 2",
                    priority: "medium",
                    status: "to_do",
                    due_date: "2023-12-31",
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            ]);

            const response = await request(app)
            .get('/tasks/')
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Tasks retrieved successfully",);
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("totalData");
            expect(response.body).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .get("/tasks/");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("GET TASK BY ID /tasks/:id", () => {
        it("should return 200 with token credential", async () => {
            prisma.task.findUnique.mockResolvedValue({
                id: "task-1",
                project_id: "project-1",
                assign_to: "user-1",
                title: "Test Task",
                description: "Test Description",
                priority: "medium",
                status: "to_do",
                due_date: "2023-12-31",
                project: { 
                    id: "project-1", 
                    name: "Test Project" 
                },
                assignedUser: { 
                    id: "user-1", 
                    name: "John Doe", 
                    email: "johndoe@example.com"
                },
            });
            
            const response = await request(app)
            .get("/tasks/task-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Task retrieved successfully");
            expect(response.body.data).toHaveProperty("id");
            expect(response.body.data).toHaveProperty("title");
            expect(response.body.data).toHaveProperty("status");
            expect(response.body.data).toHaveProperty("project");
            expect(response.body.data).toHaveProperty("assignedUser");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .get("/tasks/task-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 404 when task not found", async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .get("/tasks/task-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Task not found");
        });
    });

    describe("UPDATE TASK /tasks/:id", () => {
        it("should return 200 with token credential", async () => {
            prisma.task.findUnique
            .mockResolvedValueOnce({
                id: "task-1",
                project_id: "project-1",
                assign_to: "user-1",
                title: "Test Task",
                status: "to_do",
                priority: "medium",
            })
            .mockResolvedValueOnce({
                id: "task-1",
                title: "Test Task",
                assignedUser: { id: "user-1" },
                project: { 
                    team: { 
                        members: [
                            { user_id: "user-2" }
                        ]
                    }
                }
            });

            prisma.task.findFirst.mockResolvedValueOnce(null);

            prisma.task.update.mockResolvedValue({
                id: "task-1",
                title: "Test Task Updated",
                status: "in_progress",
                priority: "high",
                project: { 
                    id: "project-1", 
                    name: "Test Project"
                },
                assignedUser: { 
                    id: "user-1", 
                    name: "John Doe", 
                    email: "johndoe@example.com"
                },
            });
            
            const response = await request(app)
            .patch("/tasks/task-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Test Task Updated",
                status: "in_progress",
                priority: "high",
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Task updated successfully");
            expect(response.body.data).toHaveProperty("title");
            expect(response.body.data).toHaveProperty("status");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .patch("/tasks/task-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 404 when task not found", async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .patch("/tasks/task-9999")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ title: "Test Task Updated" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Task not found.");
        });

        it("should return 409 task existing", async () => {
            prisma.task.findUnique.mockResolvedValueOnce({
                id: "task-1",
                project_id: "project-1",
                title: "Test Task",
                status: "to_do",
                priority: "medium",
            });

            prisma.task.findFirst.mockResolvedValueOnce({
                id: "task-2",
                title: "Test Task Updated",
                project_id: "project-1",
            });

            const response = await request(app)
            .patch("/tasks/task-1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Test Task Updated",
                status: "to_do",
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Task with the same title already exists in the project.");
        });
    });

    describe("DELETE TASK /tasks/:id", () => {
        it("should return 200 with token credential", async () => {
            prisma.task.findUnique.mockResolvedValue({
                id: "task-1",
                title: "Test Task",
                assign_to: "user-1",
                assignedUser: { id: "user-1" },
            });

            prisma.task.delete.mockResolvedValue({});

            const response = await request(app)
            .delete("/tasks/task-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Task deleted successfully");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .delete("/tasks/task-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 404 when task not found", async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            const response = await request(app)
            .delete("/tasks/task-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Task not found.");
        });
    });
});