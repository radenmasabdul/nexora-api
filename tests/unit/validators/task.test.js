const request = require('supertest');
const express = require('express');
const { validateCreateTask, validateUpdateTask } = require('../../../src/utils/validators/task/task');
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

describe('Task Validators', () => {
    describe('validateCreateTask', () => {
        const app = createTestApp(validateCreateTask);

        it('should pass validation with valid data', async () => {
            const validData = {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                assign_to: '123e4567-e89b-12d3-a456-426614174001',
                title: 'Test Task',
                description: 'This is a test task',
                priority: 'medium',
                status: 'todo',
                due_date: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail validation with missing project_id', async () => {
            const invalidData = {
                assign_to: '123e4567-e89b-12d3-a456-426614174001',
                title: 'Test Task',
                priority: 'medium',
                status: 'todo',
                due_date: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Project ID is required'
                    })
                ])
            );
        });

        it('should fail validation with invalid project_id format', async () => {
            const invalidData = {
                project_id: 'invalid-uuid',
                assign_to: '123e4567-e89b-12d3-a456-426614174001',
                title: 'Test Task',
                priority: 'medium',
                status: 'todo',
                due_date: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Project ID must be a valid UUID'
                    })
                ])
            );
        });

        it('should fail validation with missing assign_to', async () => {
            const invalidData = {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Test Task',
                priority: 'medium',
                status: 'todo',
                due_date: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Assign To is required'
                    })
                ])
            );
        });

        it('should fail validation with invalid priority', async () => {
            const invalidData = {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                assign_to: '123e4567-e89b-12d3-a456-426614174001',
                title: 'Test Task',
                priority: 'invalid-priority',
                status: 'todo',
                due_date: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Priority must be one of: low, medium, high'
                    })
                ])
            );
        });

        it('should fail validation with invalid status', async () => {
            const invalidData = {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                assign_to: '123e4567-e89b-12d3-a456-426614174001',
                title: 'Test Task',
                priority: 'medium',
                status: 'invalid-status',
                due_date: '2024-12-31T23:59:59.000Z'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Status must be one of: todo, in_progress, done'
                    })
                ])
            );
        });

        it('should pass validation with optional description', async () => {
            const validData = {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                assign_to: '123e4567-e89b-12d3-a456-426614174001',
                title: 'Test Task',
                priority: 'medium',
                status: 'todo',
                due_date: '2024-12-31T23:59:59.000Z'
                // No description - should be optional
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('validateUpdateTask', () => {
        const app = createTestApp(validateUpdateTask);

        it('should pass validation with valid update data', async () => {
            const validData = {
                title: 'Updated Task Title',
                description: 'Updated description',
                priority: 'high',
                status: 'in_progress',
                due_date: '2024-12-31T23:59:59.000Z'
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

        it('should fail validation with invalid priority in update', async () => {
            const invalidData = {
                priority: 'invalid-priority'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Priority must be one of: low, medium, high'
                    })
                ])
            );
        });

        it('should fail validation with invalid status in update', async () => {
            const invalidData = {
                status: 'invalid-status'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Status must be one of: todo, in_progress, done'
                    })
                ])
            );
        });
    });
});