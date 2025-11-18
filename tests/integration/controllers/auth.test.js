const request = require('supertest');
const app = require('../../../src/app');

describe('Auth Endpoints', () => {
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Register successfully');
        });

        it('should return validation error for invalid email', async () => {
            const userData = {
                name: 'Test User',
                email: 'invalid-email',
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /auth/login', () => {
        it('should return error for non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return validation error for missing fields', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
        });
    });
});