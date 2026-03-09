const { validationResult } = require("express-validator");
const {
    validateCreateProject,
    validateUpdateProject,
} = require("../../../src/utils/validators/projects/projects.js");

const runValidation = async (validators, body) => {
    const req = { body, headers: {}, cookies: {} };
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('Project Validator', () => {
    describe('validateCreateProject', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Project',
                description: 'New Project Description',
                status: 'on_hold',
                deadline: '2025-12-31T00:00:00.000Z',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when team_id is empty', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: '',
                name: 'New Project',
                status: 'planning',
                deadline: '2025-12-31T00:00:00.000Z',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Team ID is required');
        });

        it('should fail when team_id is not valid UUID', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: 'invalid-uuid',
                name: 'New Project',
                status: 'planning',
                deadline: '2025-12-31T00:00:00.000Z',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Team ID must be a valid UUID');
        });

        it('should fail when name is empty', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: '',
                status: 'planning',
                deadline: '2025-12-31T00:00:00.000Z',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Project name is required');
        });

        it('should fail when name is too long', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'A'.repeat(101),
                status: 'planning',
                deadline: '2025-12-31T00:00:00.000Z',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Project name cannot exceed 100 characters');
        });

        it('should fail when status is invalid', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Project',
                status: 'unknown',
                deadline: '2025-12-31T00:00:00.000Z',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Invalid status value. Allowed values: planning, in_progress, on_hold, completed');
        });

        it('should fail when deadline is invalid date', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Project',
                status: 'planning',
                deadline: 'not-a-date',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Deadline must be a valid date');
        });

        it('should pass when description is not provided', async () => {
            const result = await runValidation(validateCreateProject, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Project',
                status: 'planning',
                deadline: '2025-12-31T00:00:00.000Z',
            });

            expect(result.isEmpty()).toBe(true);
        });
    });

    describe('validateUpdateProject', () => {
        it('should pass with valid partial data', async () => {
            const result = await runValidation(validateUpdateProject, {
                name: 'Updated Project',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when no field provided', async () => {
            const result = await runValidation(validateUpdateProject, {});

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('At least one field must be provided for update');
        });

        it('should fail when team_id is not valid UUID', async () => {
            const result = await runValidation(validateUpdateProject, {
                team_id: 'invalid-uuid',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Team ID must be a valid UUID');
        });

        it('should fail when name is too long', async () => {
            const result = await runValidation(validateUpdateProject, {
                name: 'A'.repeat(101),
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Project name cannot exceed 100 characters');
        });

        it('should fail when status is invalid', async () => {
            const result = await runValidation(validateUpdateProject, {
                status: 'unknown',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Invalid status value. Allowed values: planning, in_progress, on_hold, completed');
        });

        it('should fail when deadline is invalid date', async () => {
            const result = await runValidation(validateUpdateProject, {
                deadline: 'not-a-date',
            });
            
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Deadline must be a valid date');
        });
    });
});