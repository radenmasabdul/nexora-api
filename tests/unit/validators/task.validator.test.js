const { validationResult } = require("express-validator");
const {
    validateCreateTask,
    validateUpdateTask,
} = require("../../../src/utils/validators/task/task.js");

const runValidation = async (validators, body) => {
    const req = { body, headers: {}, cookies: {} };
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('Task Validator', () => {
    describe('validateCreateTask', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                assign_to: '123e4567-e89b-12d3-a456-426614174001',
                title: 'New Task',
                description: 'Task description',
                priority: 'medium',
                status: 'to_do',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should pass when optional fields not provided', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'New Task',
                priority: 'medium',
                status: 'to_do',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when project_id is empty', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '',
                title: 'New Task',
                priority: 'medium',
                status: 'to_do',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Project ID is required');
        });

        it('should fail when project_id is not valid UUID', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: 'invalid-uuid',
                title: 'New Task',
                priority: 'medium',
                status: 'to_do',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Project ID must be a valid UUID');
        });

        it('should fail when assign_to is not valid UUID', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                assign_to: 'invalid-uuid',
                title: 'New Task',
                priority: 'medium',
                status: 'to_do',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Assign To must be a valid UUID');
        });

        it('should fail when title is empty', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                title: '',
                priority: 'medium',
                status: 'to_do',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Title is required');
        });

        it('should fail when priority is invalid', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'New Task',
                priority: 'urgent',
                status: 'to_do',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Priority must be one of: low, medium, high');
        });

        it('should fail when status is invalid', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'New Task',
                priority: 'medium',
                status: 'unknown',
                due_date: '2026-12-31',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Status must be one of: to_do, in_progress, review, done');
        });

        it('should fail when due_date is invalid date', async () => {
            const result = await runValidation(validateCreateTask, {
                project_id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'New Task',
                priority: 'medium',
                status: 'to_do',
                due_date: 'not-a-date',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Due Date must be a valid date');
        });
    });

    describe('validateUpdateTask', () => {
        it('should pass with valid partial data', async () => {
            const result = await runValidation(validateUpdateTask, {
                title: 'Updated Task',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when no field provided', async () => {
            const result = await runValidation(validateUpdateTask, {});

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('At least one field must be provided for update');
        });

        it('should fail when project_id is not valid UUID', async () => {
            const result = await runValidation(validateUpdateTask, {
                project_id: 'invalid-uuid',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Project ID must be a valid UUID');
        });

        it('should fail when priority is invalid', async () => {
            const result = await runValidation(validateUpdateTask, {
                priority: 'urgent',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Priority must be one of: low, medium, high');
        });

        it('should fail when status is invalid', async () => {
            const result = await runValidation(validateUpdateTask, {
                status: 'unknown',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Status must be one of: to_do, in_progress, review, done');
        });

        it('should fail when due_date is invalid date', async () => {
            const result = await runValidation(validateUpdateTask, {
                due_date: 'not-a-date',
            });
            
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Due Date must be a valid date');
        });
    });
});