const request = require('supertest');
const express = require('express');
const { validateCreateProject, validateUpdateProject } = require('../../../src/utils/validators/projects/projects');
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

describe('Project Validators', () => {
    describe('validateCreateProject', () => {
        const app = createTestApp(validateCreateProject);

        it('should pass validation with valid data', async () => {
            const validData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Project',
                description: 'This is a test project',
                status: 'planning',
                deadline: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail validation with missing team_id', async () => {
            const invalidData = {
                name: 'Test Project',
                status: 'planning',
                deadline: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Team ID is required'
                    })
                ])
            );
        });

        it('should fail validation with invalid team_id format', async () => {
            const invalidData = {
                team_id: 'invalid-uuid',
                name: 'Test Project',
                status: 'planning',
                deadline: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Team ID must be a valid UUID'
                    })
                ])
            );
        });

        it('should fail validation with missing name', async () => {
            const invalidData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                status: 'planning',
                deadline: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Project name is required'
                    })
                ])
            );
        });

        it('should fail validation with invalid status', async () => {
            const invalidData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Project',
                status: 'invalid-status',
                deadline: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Invalid status value. Allowed values: planning, in_progress, completed, on_hold'
                    })
                ])
            );
        });

        it('should fail validation with invalid deadline format', async () => {
            const invalidData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Project',
                status: 'planning',
                deadline: 'invalid-date'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Deadline must be a valid date'
                    })
                ])
            );
        });

        it('should pass validation with optional description', async () => {
            const validData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Project',
                status: 'planning',
                deadline: '2024-12-31T23:59:59.000Z'
                // No description - should be optional
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('validateUpdateProject', () => {
        const app = createTestApp(validateUpdateProject);

        it('should pass validation with valid update data', async () => {
            const validData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Project Name',
                description: 'Updated description',
                status: 'completed',
                deadline: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail validation with missing required fields', async () => {
            const invalidData = {
                description: 'Only description provided'
                // Missing team_id, name, status, deadline
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        it('should fail validation with name too long', async () => {
            const invalidData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'A'.repeat(101), // 101 characters
                status: 'planning',
                deadline: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Project name cannot exceed 100 characters'
                    })
                ])
            );
        });
    });
});