const request = require("supertest");
const app = require("../../../src/app");
const jwt = require("jsonwebtoken");

jest.mock("../../../prisma/client/index.js", () => ({
    notification: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
}));

const prisma = require("../../../prisma/client/index.js");

describe("Notification API", () => {
    const adminToken = jwt.sign(
        { id: "user-1", role: "administrator" },
        "test-secret",
    );
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET ALL NOTIFICATIONS /notifications/", () => {
        it("should return 200 with token credential", async () => {
            prisma.notification.count.mockResolvedValue(2);
            prisma.notification.findMany.mockResolvedValue([
                {
                    id: "notif-1",
                    user_id: "user-1",
                    message: "Test notification",
                    is_read: false,
                    user: {
                        id: "user-1",
                        name: "John Doe",
                        email: "johndoe@example.com",
                    },
                },
                {
                    id: "notif-2",
                    user_id: "user-1",
                    message: "Test notification 2",
                    is_read: true,
                    user: {
                        id: "user-1",
                        name: "John Doe",
                        email: "johndoe@example.com",
                    },
                },
            ]);
            
            const response = await request(app)
            .get("/notifications/")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Notifications retrieved successfully");
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("totalData");
            expect(response.body).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        
        it("should return 401 without token", async () => {
            const response = await request(app)
            .get("/notifications/");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("GET NOTIFICATION BY ID /notifications/:id", () => {
        it("should return 200 with token credential", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-1",
                message: "Test notification",
                is_read: false,
                user: { 
                    id: "user-1",
                    name: "John Doe",
                    email: "johndoe@example.com"
                },
            });
            
            const response = await request(app)
            .get("/notifications/notif-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Notification retrieved successfully");
            expect(response.body.data).toHaveProperty("message");
            expect(response.body.data).toHaveProperty("is_read");
            expect(response.body.data).toHaveProperty("user");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .get("/notifications/notif-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 403 access denied", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-999",
                message: "Test notification",
                is_read: false,
                user: {
                    id: "user-999",
                    name: "Other User",
                    email: "other@example.com",
                },
            });
            
            const response = await request(app)
            .get("/notifications/notif-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Access denied");
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

    describe("MARK AS READ /notifications/:id/read", () => {
        it("should return 200 with token credential", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-1",
                message: "Test notification",
                is_read: false,
            });

            prisma.notification.update.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-1",
                message: "Test notification",
                is_read: true,
                user: { 
                    id: "user-1", 
                    name: "John Doe", 
                    email: "johndoe@example.com"
                },
            });

            const response = await request(app)
            .patch("/notifications/notif-1/read")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Notification marked as read");
            expect(response.body.data).toHaveProperty("is_read");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .patch("/notifications/notif-1/read");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 403 access denied", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-999",
                message: "Test notification",
                is_read: false,
            });

            const response = await request(app)
            .patch("/notifications/notif-1/read")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Access denied");
        });

        it("should return 404 when notification not found", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce(null);

            const response = await request(app)
            .patch("/notifications/notif-9999/read")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Notification not found");
        });   
    });

    describe("MARK ALL AS READ /notifications/read-all", () => {
        it("should return 200 with token credential", async () => {
            prisma.notification.updateMany.mockResolvedValue({ count: 2 });
            
            const response = await request(app)
            .patch("/notifications/read-all")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("All notifications marked as read");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .patch("/notifications/read-all");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });
    });

    describe("DELETE NOTIFICATION /notifications/:id", () => {
        it("should return 200 with token credential", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-1",
                message: "Test notification",
                is_read: false,
            });
            
            prisma.notification.delete.mockResolvedValue({});
            
            const response = await request(app)
            .delete("/notifications/notif-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Notification deleted successfully");
        });

        it("should return 401 without token", async () => {
            const response = await request(app)
            .delete("/notifications/notif-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it("should return 403 access denied", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce({
                id: "notif-1",
                user_id: "user-999",
                message: "Test notification",
                is_read: false,
            });
            
            const response = await request(app)
            .delete("/notifications/notif-1")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Access denied");
        });

        it("should return 404 when notification not found", async () => {
            prisma.notification.findUnique.mockResolvedValueOnce(null);
            
            const response = await request(app)
            .delete("/notifications/notif-9999")
            .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Notification not found");
        });  
    });
});
