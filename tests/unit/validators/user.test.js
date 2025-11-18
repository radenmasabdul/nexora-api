const request = require('supertest');
const express = require('express');
const { validateCreateUser, validateUpdateUser } = require('../../../src/utils/validators/user/user');
const { validationResult } = require('express-validator');

// Create test app
const createTestApp = (validators) => {
    const app = express();
    app.use(express.json());
    
    app.post('/test', validators, (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                errors: errors.array()
            });
        }
        res.status(200).json({ success: true });
    });
    
    return app;
};

describe('User Validators', () => {
    describe('validateCreateUser', () => {
        const app = createTestApp(validateCreateUser);

        it('should pass validation with valid data', async () => {
            const validData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail validation with empty name', async () => {
            const invalidData = {
                name: '',
                email: 'test@example.com',
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Name is required'
                    })
                ])
            );
        });

        it('should fail validation with invalid email', async () => {
            const invalidData = {
                name: 'Test User',
                email: 'invalid-email',
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Email is invalid'
                    })
                ])
            );
        });

        it('should fail validation with weak password', async () => {
            const invalidData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'weak',
                role: 'member'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        it('should fail validation with invalid role', async () => {
            const invalidData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!',
                role: 'invalid-role'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Invalid role value. Allowed roles: admin, manager, member.'
                    })
                ])
            );
        });
    });

    describe('validateUpdateUser', () => {
        const app = createTestApp(validateUpdateUser);

        it('should pass validation with partial valid data', async () => {
            const validData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should pass validation with empty body (all optional)', async () => {
            const response = await request(app)
                .post('/test')
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail validation with invalid email in update', async () => {
            const invalidData = {
                email: 'invalid-email'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Email is invalid'
                    })
                ])
            );
        });
    });
});