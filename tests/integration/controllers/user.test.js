const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');

describe('User API Endpoints', () => {
    let authToken;
    let testUserId;

    // Create auth token for testing protected routes
    beforeAll(() => {
        authToken = jwt.sign({ id: 'test-user-id' }, process.env.JWT_SECRET || 'test-secret');
    });

    describe('POST /users', () => {
        it('should create a new user successfully', async () => {
            const userData = {
                name: 'Test User API',
                email: `testapi${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/users/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.email).toBe(userData.email);
            expect(response.body.data).not.toHaveProperty('password');

            // Save user ID for cleanup
            testUserId = response.body.data.id;
        });

        it('should return validation error for invalid data', async () => {
            const invalidData = {
                name: '',
                email: 'invalid-email',
                password: '123',
                role: 'invalid-role'
            };

            const response = await request(app)
                .post('/users/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation error');
        });

        it('should return 401 without authentication', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/users/create')
                .send(userData);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /users', () => {
        it('should get all users with pagination', async () => {
            const response = await request(app)
                .get('/users/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Get all users successfully');
            expect(response.body).toHaveProperty('currentPage');
            expect(response.body).toHaveProperty('totalData');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should search users by name or email', async () => {
            const response = await request(app)
                .get('/users/all?search=test')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/users/all');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /users/:id', () => {
        it('should get user by id successfully', async () => {
            // Skip if no test user created
            if (!testUserId) {
                return;
            }

            const response = await request(app)
                .get(`/users/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Get user successfully');
            expect(response.body.data).toHaveProperty('id', testUserId);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/users/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });
    });

    describe('PUT /users/:id', () => {
        it('should update user successfully', async () => {
            // Skip if no test user created
            if (!testUserId) {
                return;
            }

            const updateData = {
                name: 'Updated Test User',
                role: 'admin'
            };

            const response = await request(app)
                .put(`/users/update/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User updated successfully');
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.role).toBe(updateData.role);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .put('/users/update/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Updated Name' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found.');
        });
    });

    describe('DELETE /users/:id', () => {
        it('should delete user successfully', async () => {
            // Skip if no test user created
            if (!testUserId) {
                return;
            }

            const response = await request(app)
                .delete(`/users/delete/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .delete('/users/delete/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found.');
        });
    });
});