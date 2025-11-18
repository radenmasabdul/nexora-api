const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');

describe('Task API Endpoints', () => {
    let authToken;
    let testTaskId;
    let testProjectId;
    let testUserId;

    beforeAll(async () => {
        // Create test user
        const userResponse = await request(app)
            .post('/auth/register')
            .send({
                name: 'Task Test User',
                email: `tasktest${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'admin'
            });

        if (userResponse.status === 201) {
            testUserId = userResponse.body.data.id;
            authToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test-secret');
            
            // Create test team
            const teamResponse = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Task Test Team ${Date.now()}`,
                    description: 'Team for task testing'
                });

            if (teamResponse.status === 201) {
                // Create test project
                const projectResponse = await request(app)
                    .post('/projects/create')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        team_id: teamResponse.body.data.id,
                        name: `Task Test Project ${Date.now()}`,
                        description: 'Project for task testing',
                        status: 'planning',
                        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    });

                if (projectResponse.status === 201) {
                    testProjectId = projectResponse.body.data.id;
                }
            }
        }
    });

    describe('POST /tasks/create', () => {
        it('should create a new task successfully', async () => {
            if (!testProjectId || !testUserId) return;

            const taskData = {
                project_id: testProjectId,
                assign_to: testUserId,
                title: `Test Task ${Date.now()}`,
                description: 'This is a test task',
                priority: 'medium',
                status: 'todo',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            const response = await request(app)
                .post('/tasks/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Task created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.title).toBe(taskData.title);
            expect(response.body.data.project_id).toBe(testProjectId);

            testTaskId = response.body.data.id;
        });

        it('should return validation error for missing required fields', async () => {
            const invalidData = {
                title: 'Task without project'
                // Missing project_id, assign_to
            };

            const response = await request(app)
                .post('/tasks/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation error');
        });

        it('should return 401 without authentication', async () => {
            const taskData = {
                project_id: testProjectId,
                assign_to: testUserId,
                title: 'Unauthorized Task'
            };

            const response = await request(app)
                .post('/tasks/create')
                .send(taskData);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /tasks/all', () => {
        it('should get all tasks with pagination', async () => {
            const response = await request(app)
                .get('/tasks/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Tasks retrieved successfully');
            expect(response.body).toHaveProperty('currentPage');
            expect(response.body).toHaveProperty('totalData');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should search tasks by title or description', async () => {
            const response = await request(app)
                .get('/tasks/all?search=test')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/tasks/all');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /tasks/:id', () => {
        it('should get task by id successfully', async () => {
            if (!testTaskId) return;

            const response = await request(app)
                .get(`/tasks/${testTaskId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Task retrieved successfully');
            expect(response.body.data).toHaveProperty('id', testTaskId);
            expect(response.body.data).toHaveProperty('project');
            expect(response.body.data).toHaveProperty('assignedUser');
        });

        it('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .get('/tasks/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Task not found');
        });
    });

    describe('PUT /tasks/update/:id', () => {
        it('should update task successfully', async () => {
            if (!testTaskId || !testProjectId || !testUserId) return;

            const updateData = {
                project_id: testProjectId,
                assign_to: testUserId,
                title: `Updated Test Task ${Date.now()}`,
                description: 'Updated description for test task',
                priority: 'high',
                status: 'in_progress',
                due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            };

            const response = await request(app)
                .put(`/tasks/update/${testTaskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Task updated successfully');
            expect(response.body.data.title).toBe(updateData.title);
            expect(response.body.data.priority).toBe(updateData.priority);
            expect(response.body.data.status).toBe(updateData.status);
        });

        it('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .put('/tasks/update/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ 
                    project_id: testProjectId,
                    assign_to: testUserId,
                    title: 'Updated Name',
                    priority: 'low',
                    status: 'todo',
                    due_date: new Date().toISOString()
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Task not found.');
        });
    });

    describe('DELETE /tasks/delete/:id', () => {
        it('should delete task successfully', async () => {
            if (!testTaskId) return;

            const response = await request(app)
                .delete(`/tasks/delete/${testTaskId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Task deleted successfully');
        });

        it('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .delete('/tasks/delete/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Task not found.');
        });
    });
});