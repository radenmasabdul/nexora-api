const { validationResult } = require("express-validator");
const {
    validateCreateTeamMember,
    validateUpdateTeamMember,
} = require("../../../src/utils/validators/member/member.js");

const runValidation = async (validators, body) => {
    const req = { body, headers: {}, cookies: {} };
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('Member Validator', () => {
    describe('validateCreateTeamMember', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateCreateTeamMember, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'developer',
            });
            
            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when team_id is empty', async () => {
            const result = await runValidation(validateCreateTeamMember, {
                team_id: '',
                user_id: 'user-1',
                role: 'developer',
            });
            
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Team ID is required');
        });

        it('should fail when user_id is not valid UUID', async () => {
            const result = await runValidation(validateCreateTeamMember, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: 'invalid-uuid',
                role: 'developer',
            });
            
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('User ID must be a valid UUID');
        });

        it('should fail when role is invalid', async () => {
            const result = await runValidation(validateCreateTeamMember, {
                team_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                role: 'superadmin',
            });
        
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Invalid role value. Allowed roles: project_owner, team_leader, developer.');
        });
    });
    
    describe('validateUpdateTeamMember', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateUpdateTeamMember, {
                role: 'developer',
            });
        
            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when role is empty', async () => {
            const result = await runValidation(validateUpdateTeamMember, {
                role: '',
            });
        
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Role is required');
        });

        it('should fail when role is invalid', async () => {
            const result = await runValidation(validateUpdateTeamMember, {
                role: 'admin',
            });
        
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Invalid role value. Allowed roles: project_owner, team_leader, developer.');
        });
    });
});