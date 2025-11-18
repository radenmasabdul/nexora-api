const request = require('supertest');
const express = require('express');
const { validateCreateTeam, validateUpdateTeam } = require('../../../src/utils/validators/team/team');
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

describe('Team Validators', () => {
    describe('validateCreateTeam', () => {
        const app = createTestApp(validateCreateTeam);

        it('should pass validation with valid data', async () => {
            const validData = {
                name: 'Test Team',
                description: 'This is a test team'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should pass validation with only name (description optional)', async () => {
            const validData = {
                name: 'Test Team'
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
                description: 'Test Description'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Team name is required'
                    })
                ])
            );
        });

        it('should fail validation with missing name', async () => {
            const invalidData = {
                description: 'Test Description'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Team name is required'
                    })
                ])
            );
        });

        it('should fail validation with name too long', async () => {
            const invalidData = {
                name: 'A'.repeat(101), // 101 characters
                description: 'Test Description'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Team name must not exceed 100 characters'
                    })
                ])
            );
        });

        it('should fail validation with description too long', async () => {
            const invalidData = {
                name: 'Test Team',
                description: 'A'.repeat(501) // 501 characters
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Description must not exceed 500 characters'
                    })
                ])
            );
        });
    });

    describe('validateUpdateTeam', () => {
        const app = createTestApp(validateUpdateTeam);

        it('should pass validation with partial valid data', async () => {
            const validData = {
                name: 'Updated Team Name'
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

        it('should fail validation with empty name in update', async () => {
            const invalidData = {
                name: ''
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Team name cannot be empty'
                    })
                ])
            );
        });
    });
});