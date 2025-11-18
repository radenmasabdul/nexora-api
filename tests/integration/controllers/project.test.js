const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');

describe('Project API Endpoints', () => {
    let authToken;
    let testProjectId;
    let testTeamId;

    beforeAll(async () => {
        // Create test user
        const userResponse = await request(app)
            .post('/auth/register')
            .send({
                name: 'Project Test User',
                email: `projecttest${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'admin'
            });

        if (userResponse.status === 201) {
            authToken = jwt.sign({ id: userResponse.body.data.id }, process.env.JWT_SECRET || 'test-secret');
            
            // Create test team
            const teamResponse = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Project Test Team ${Date.now()}`,
                    description: 'Team for project testing'
                });

            if (teamResponse.status === 201) {
                testTeamId = teamResponse.body.data.id;
            }
        }
    });

    describe('POST /projects/create', () => {
        it('should create a new project successfully', async () => {
            if (!testTeamId) return;

            const projectData = {
                team_id: testTeamId,
                name: `Test Project ${Date.now()}`,
                description: 'This is a test project',
                status: 'planning',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            };

            const response = await request(app)
                .post('/projects/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe(projectData.name);
            expect(response.body.data.team_id).toBe(testTeamId);

            testProjectId = response.body.data.id;
        });

        it('should return validation error for missing required fields', async () => {
            const invalidData = {
                name: 'Project without team'
                // Missing team_id
            };

            const response = await request(app)
                .post('/projects/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation error');
        });

        it('should return 401 without authentication', async () => {
            const projectData = {
                team_id: testTeamId,
                name: 'Unauthorized Project',
                description: 'This should fail'
            };

            const response = await request(app)
                .post('/projects/create')
                .send(projectData);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /projects/all', () => {
        it('should get all projects with pagination', async () => {
            const response = await request(app)
                .get('/projects/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Projects retrieved successfully');
            expect(response.body).toHaveProperty('currentPage');
            expect(response.body).toHaveProperty('totalData');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should search projects by name or description', async () => {
            const response = await request(app)
                .get('/projects/all?search=test')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/projects/all');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /projects/:id', () => {
        it('should get project by id successfully', async () => {
            if (!testProjectId) return;

            const response = await request(app)
                .get(`/projects/${testProjectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project retrieved successfully');
            expect(response.body.data).toHaveProperty('id', testProjectId);
            expect(response.body.data).toHaveProperty('team');
        });

        it('should return 404 for non-existent project', async () => {
            const response = await request(app)
                .get('/projects/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project not found');
        });
    });

    describe('PUT /projects/update/:id', () => {
        it('should update project successfully', async () => {
            if (!testProjectId || !testTeamId) return;

            const updateData = {
                team_id: testTeamId,
                name: `Updated Test Project ${Date.now()}`,
                description: 'Updated description for test project',
                status: 'in_progress',
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
            };

            const response = await request(app)
                .put(`/projects/update/${testProjectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project updated successfully');
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.status).toBe(updateData.status);
        });

        it('should return 404 for non-existent project', async () => {
            const response = await request(app)
                .put('/projects/update/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ 
                    team_id: testTeamId,
                    name: 'Updated Name',
                    status: 'planning',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /projects/delete/:id', () => {
        it('should delete project successfully', async () => {
            if (!testProjectId) return;

            const response = await request(app)
                .delete(`/projects/delete/${testProjectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project deleted successfully');
        });

        it('should return 404 for non-existent project', async () => {
            const response = await request(app)
                .delete('/projects/delete/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project not found.');
        });
    });
});