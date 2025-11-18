const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');

describe('Team API Endpoints', () => {
    let authToken;
    let testTeamId;
    let testUserId;

    // Create test user and auth token
    beforeAll(async () => {
        // Create a test user first
        const userResponse = await request(app)
            .post('/auth/register')
            .send({
                name: 'Team Test User',
                email: `teamtest${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'admin'
            });
        
        if (userResponse.status === 201) {
            testUserId = userResponse.body.data.id;
            authToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test-secret');
        } else {
            // Fallback if user creation fails
            authToken = jwt.sign({ id: 'test-user-id' }, process.env.JWT_SECRET || 'test-secret');
        }
    });

    describe('POST /teams/create', () => {
        it('should create a new team successfully', async () => {
            const teamData = {
                name: `Test Team ${Date.now()}`,
                description: 'This is a test team for API testing'
            };

            const response = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(teamData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Team created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe(teamData.name);
            expect(response.body.data.description).toBe(teamData.description);

            // Save team ID for other tests
            testTeamId = response.body.data.id;
        });

        it('should return validation error for missing name', async () => {
            const invalidData = {
                description: 'Team without name'
            };

            const response = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation error');
        });

        it('should return 401 without authentication', async () => {
            const teamData = {
                name: 'Unauthorized Team',
                description: 'This should fail'
            };

            const response = await request(app)
                .post('/teams/create')
                .send(teamData);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /teams/all', () => {
        it('should get all teams with pagination', async () => {
            const response = await request(app)
                .get('/teams/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Teams retrieved successfully');
            expect(response.body).toHaveProperty('currentPage');
            expect(response.body).toHaveProperty('totalData');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should search teams by name or description', async () => {
            const response = await request(app)
                .get('/teams/all?search=test')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/teams/all');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /teams/:id', () => {
        it('should get team by id successfully', async () => {
            // Skip if no test team created
            if (!testTeamId) {
                return;
            }

            const response = await request(app)
                .get(`/teams/${testTeamId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Get team successfully');
            expect(response.body.data).toHaveProperty('id', testTeamId);
        });

        it('should return 404 for non-existent team', async () => {
            const response = await request(app)
                .get('/teams/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Team not found');
        });
    });

    describe('PUT /teams/update/:id', () => {
        it('should update team successfully', async () => {
            // Skip if no test team created
            if (!testTeamId) {
                return;
            }

            const updateData = {
                name: `Updated Test Team ${Date.now()}`,
                description: 'Updated description for test team'
            };

            const response = await request(app)
                .put(`/teams/update/${testTeamId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Team updated successfully');
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.description).toBe(updateData.description);
        });

        it('should return 404 for non-existent team', async () => {
            const response = await request(app)
                .put('/teams/update/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Updated Name' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Team not found.');
        });
    });

    describe('DELETE /teams/delete/:id', () => {
        it('should delete team successfully', async () => {
            // Skip if no test team created
            if (!testTeamId) {
                return;
            }

            const response = await request(app)
                .delete(`/teams/delete/${testTeamId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Team deleted successfully');
        });

        it('should return 404 for non-existent team', async () => {
            const response = await request(app)
                .delete('/teams/delete/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Team not found.');
        });
    });
});