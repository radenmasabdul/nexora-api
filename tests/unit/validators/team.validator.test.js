const { validationResult } = require("express-validator");
const {
    validateCreateTeam,
    validateUpdateTeam,
} = require("../../../src/utils/validators/team/team.js");

const runValidation = async (validators, body) => {
    const req = { body, headers: {}, cookies: {} };
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('Team Validator', () => {
    describe('validateCreateTeam', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateCreateTeam, {
                name: 'New Team',
                description: 'A brief description',
            });
            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when team name is empty', async () => {
            const result = await runValidation(validateCreateTeam, {
                name: '',
                description: 'A brief description',
            });
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Team name is required');
        });

        it('should fail when team name is too long', async () => {
            const result = await runValidation(validateCreateTeam, {
                name: 'A'.repeat(101),
                description: 'A brief description',
            });
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Team name must not exceed 100 characters');
        });

        it('should fail when description is too long', async () => {
            const result = await runValidation(validateCreateTeam, {
                name: 'New Team',
                description: 'A'.repeat(501),
            });
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Description must not exceed 500 characters');
        });

        it('should pass when description is not provided', async () => {
            const result = await runValidation(validateCreateTeam, {
                name: 'New Team',
            });
            expect(result.isEmpty()).toBe(true);
        });
    });

    describe('validateUpdateTeam', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateUpdateTeam, {
                name: 'Updated Team',
            });
            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when no field provided', async () => {
            const result = await runValidation(validateUpdateTeam, {});
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('At least one field must be provided for update');
        });

        it('should fail when name is too long', async () => {
            const result = await runValidation(validateUpdateTeam, {
                name: 'A'.repeat(101),
            });
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Team name must not exceed 100 characters');
        });

        it('should fail when description is too long', async () => {
            const result = await runValidation(validateUpdateTeam, {
                description: 'A'.repeat(501),
            });
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Description must not exceed 500 characters');
        });
    });
});