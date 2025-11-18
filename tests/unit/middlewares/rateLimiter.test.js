const request = require('supertest');
const app = require('../../../src/app');

describe('Rate Limiting', () => {
    describe('Login Rate Limiting', () => {
        it('should allow login attempts within limit', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            // First attempt should go through (even if user doesn't exist)
            const response = await request(app)
                .post('/auth/login')
                .send(loginData);

            // Should not be rate limited (will get 404 or 422, not 429)
            expect(response.status).not.toBe(429);
        });
    });

    describe('Register Rate Limiting', () => {
        it('should allow register attempts within limit', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            // Should not be rate limited initially
            expect(response.status).not.toBe(429);
        });
    });

    describe('Global Rate Limiting', () => {
        it('should allow requests to non-auth endpoints', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer fake-token');

            // Should not be rate limited (will get 401, not 429)
            expect(response.status).not.toBe(429);
        });
    });
});