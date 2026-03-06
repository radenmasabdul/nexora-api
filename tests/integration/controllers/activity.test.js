const request = require('supertest');
const app = require('../../../src/app.js');
const jwt = require('jsonwebtoken');

jest.mock('../../../prisma/client/index.js', () => ({
    activityLog: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
    }
}));

const prisma = require('../../../prisma/client/index.js');

describe('Activity Log API', () => {
    const adminToken = jwt.sign(
        { id: 'user-1', role: 'administrator'},
        'test-secret'
    );

    const managerToken = jwt.sign(
        { id: 'user-2', role: 'manager_division'},
        'test-secret'
    );

    const staffToken = jwt.sign(
        { id: 'user-3', role: 'staff'},
        'test-secret'
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /activities/', () => {
        it('should return 200 and activity logs for administrator', async () => {
            prisma.activityLog.count.mockResolvedValue(2);
            prisma.activityLog.findMany.mockResolvedValue([
              {
                id: "activity-1",
                user_id: "user-1",
                action: "task_created",
                entity_type: "task",
                entity_id: "task-1",
                created_at: new Date(),
                user: { id: "user-1", name: "Admin", email: "admin@test.com" },
              },
              {
                id: "activity-2",
                user_id: "user-2",
                action: "project_created",
                entity_type: "project",
                entity_id: "project-1",
                created_at: new Date(),
                user: { id: "user-2", name: "Manager", email: "manager@test.com" },
              },
            ]);

            const response = await request(app)
                .get('/activities/')
                .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Activity logs retrieved successfully");
                expect(response.body).toHaveProperty("currentPage");
                expect(response.body).toHaveProperty("totalData");
                expect(response.body).toHaveProperty("totalPages");
                expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should return 200 for manager_division', async () => {
            prisma.activityLog.count.mockResolvedValue(0);
            prisma.activityLog.findMany.mockResolvedValue([]);

            const response = await request(app)
                .get("/activities/")
                .set("Authorization", `Bearer ${managerToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
        });

        it('should return 401 without token', async () => {
            const response = await request(app).get("/activities/");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 403 for staff role', async () => {
            const response = await request(app)
                .get("/activities/")
                .set("Authorization", `Bearer ${staffToken}`);

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Forbidden. Insufficient role.");
        });

        it('should filter by entity_type', async () => {
            prisma.activityLog.count.mockResolvedValue(1);
            prisma.activityLog.findMany.mockResolvedValue([
                {
                    id: "activity-1",
                    user_id: "user-1",
                    action: "task_created",
                    entity_type: "task",
                    entity_id: "task-1",
                    created_at: new Date(),
                    user: { id: "user-1", name: "Admin", email: "admin@test.com" },
                },
            ]);
            
            const response = await request(app)
                .get("/activities/?entity_type=task")
                .set("Authorization", `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
        });
    });

    describe('GET /activities/:id',() => {
        it('should return 200 and activity log for administrator', async () => {
            prisma.activityLog.findUnique.mockResolvedValue({
                id: "activity-1",
                user_id: "user-1",
                action: "task_created",
                entity_type: "task",
                entity_id: "task-1",
                created_at: new Date(),
                user: { id: "user-1", name: "Admin", email: "admin@test.com" },
            });
            
            const response = await request(app)
                .get("/activities/activity-1")
                .set("Authorization", `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Activity log retrieved successfully");
                expect(response.body.data).toHaveProperty("id");
                expect(response.body.data).toHaveProperty("user");
        });

        it('should return 404 if activity log not found', async () => {
            prisma.activityLog.findUnique.mockResolvedValue(null);
            
            const response = await request(app)
                .get("/activities/tidak-ada")
                .set("Authorization", `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Activity log not found");
        });

        it('should return 401 without token', async () => {
            const response = await request(app).get("/activities/activity-1");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Unauthenticated.");
        });

        it('should return 403 for staff role', async () => {
            const response = await request(app)
                .get("/activities/activity-1")
                .set("Authorization", `Bearer ${staffToken}`);

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Forbidden. Insufficient role.");
        });
    });

    describe('GET /dashboard/activities/counts', () => {
        it('should return 200 for any authenticated user', async () => {
            prisma.activityLog.findMany.mockResolvedValue([]);
            
            const response = await request(app)
                .get("/dashboard/activities/counts")
                .set("Authorization", `Bearer ${staffToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should return 401 without token', async () => {
            const response = await request(app).get("/dashboard/activities/counts");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should filter by range week', async () => {
            prisma.activityLog.findMany.mockResolvedValue([]);
            
            const response = await request(app)
                .get("/dashboard/activities/counts?range=week")
                .set("Authorization", `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(7);
        });

        it('should return 400 for invalid range', async () => {
            const response = await request(app)
                .get("/dashboard/activities/counts?range=invalid")
                .set("Authorization", `Bearer ${adminToken}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Invalid range. Allowed: day, week, month, year");
        });
    });
});