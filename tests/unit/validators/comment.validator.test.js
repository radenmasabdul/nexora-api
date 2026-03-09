const { validationResult } = require('express-validator');
const { validateCreateComment } = require('../../../src/utils/validators/comments/comments.js');

const runValidation = async (validators, body) => {
    const req = { body, headers: {}, cookies: {} };
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('Comment Validator', () => {
    describe('validateCreateComment', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateCreateComment, {
                task_id: '123e4567-e89b-12d3-a456-426614174000',
                content: 'New content comment',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when task_id is empty', async () => {
            const result = await runValidation(validateCreateComment, {
                task_id: '',
                content: 'New content comment',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Task ID is required');
        });

        it('should fail when task_id is not valid UUID', async () => {
            const result = await runValidation(validateCreateComment, {
                task_id: 'invalid-uuid',
                content: 'New content comment',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Task ID must be a valid UUID');
        });

        it('should fail when content is empty', async () => {
            const result = await runValidation(validateCreateComment, {
                task_id: '123e4567-e89b-12d3-a456-426614174000',
                content: '',
            });
            
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Content is required');
        });

        it('should fail when content is too long', async () => {
            const result = await runValidation(validateCreateComment, {
                task_id: '123e4567-e89b-12d3-a456-426614174000',
                content: 'A'.repeat(1001),
            });
            
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Content must be between 1 and 1000 characters');
        });
    });
});