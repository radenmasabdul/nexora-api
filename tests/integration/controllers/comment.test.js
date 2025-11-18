const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');

describe('Comment API Endpoints', () => {
    let authToken;

    beforeAll(() => {
        authToken = jwt.sign({ id: 'test-user-id' }, process.env.JWT_SECRET || 'test-secret');
    });



    describe('GET /comments/all', () => {
        it('should get all comments with pagination', async () => {
            const response = await request(app)
                .get('/comments/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/comments/all');

            expect(response.status).toBe(401);
        });
    });








});