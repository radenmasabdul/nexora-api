const request = require('supertest');
const express = require('express');
const { validateCreateTeamMember, validateUpdateTeamMember } = require('../../../src/utils/validators/member/member');
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

describe('Member Validators', () => {
    describe('validateCreateTeamMember', () => {
        const app = createTestApp(validateCreateTeamMember);

        it('should pass validation with valid data', async () => {
            const validData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'member'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail validation with missing team_id', async () => {
            const invalidData = {
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'member'
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
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'member'
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

        it('should fail validation with missing user_id', async () => {
            const invalidData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                role: 'member'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'User ID is required'
                    })
                ])
            );
        });

        it('should fail validation with invalid role', async () => {
            const invalidData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'invalid-role'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Invalid role value. Allowed roles: owner, lead, member.'
                    })
                ])
            );
        });

        it('should pass validation with owner role', async () => {
            const validData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'owner'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should pass validation with lead role', async () => {
            const validData = {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'lead'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('validateUpdateTeamMember', () => {
        const app = createTestApp(validateUpdateTeamMember);

        it('should pass validation with valid role update', async () => {
            const validData = {
                role: 'lead'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail validation with missing role', async () => {
            const response = await request(app)
                .post('/test')
                .send({});

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Role is required'
                    })
                ])
            );
        });

        it('should fail validation with invalid role in update', async () => {
            const invalidData = {
                role: 'invalid-role'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(422);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Invalid role value. Allowed roles: owner, lead, member.'
                    })
                ])
            );
        });
    });
});