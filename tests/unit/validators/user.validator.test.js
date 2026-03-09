const { validationResult } = require("express-validator");

jest.mock('../../../prisma/client/index.js', () => ({
    user: { findUnique: jest.fn() },
}));

const prisma = require("../../../prisma/client/index.js");

const {
  validateCreateUser,
  validateUpdateUser,
} = require("../../../src/utils/validators/user/user.js");

const runValidation = async (validators, body) => {
    const req = { body, headers: {}, cookies: {} };
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('User Validator', () => {
    afterEach(() => jest.clearAllMocks());

    describe('validateCreateUser', () => {
        it('should pass with valid data', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            const errors = await runValidation(validateCreateUser, {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(errors.isEmpty()).toBe(true);
        });

        it('should fail when name is empty', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateCreateUser, {
                name: '',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe("Name is required");
        });
        
        it('should fail when name is too long', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateCreateUser, {
                name: 'John Doe Example Lorem Ipsum',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Name must not exceed 25 characters');
        });

        it('should fail when email is invalid', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateCreateUser, {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Email is invalid');
        });

        it('should fail when password has no uppercase', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateCreateUser, {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Password must contain at least one uppercase letter');
        });

        it('should fail when role is invalid', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateCreateUser, {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'superadmin',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe(
              "Invalid role value. Allowed roles: administrator, manager_division, project_owner, staff.");
        });
    });

    describe('validateUpdateUser', () => {
        it('should pass with valid partial data', async () => {
            const result = await runValidation(validateUpdateUser, {
                name: 'John Updated',
            });

            expect(result.isEmpty()).toBe(true);
        });
        
        it('should pass when only email provided', async () => {
            const result = await runValidation(validateUpdateUser, {
                email: 'newemail@example.com',
            });

            expect(result.isEmpty()).toBe(true);
        });
        
        it('should fail when no field provided', async () => {
            const result = await runValidation(validateUpdateUser, {});
            
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('At least one field must be provided for update');
        });
        
        it('should fail when name is too long', async () => {
            const result = await runValidation(validateUpdateUser, {
                name: 'John Doe Example Lorem Ipsum',
            });
        
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Name must not exceed 25 characters');
        });

        it('should fail when email is invalid', async () => {
            const result = await runValidation(validateUpdateUser, {
                email: 'invalid-email',
            });
        
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Email is invalid');
        });

        it('should fail when password has no special character', async () => {
            const result = await runValidation(validateUpdateUser, {
                password: 'Password1',
            });
        
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Password must contain at least one special character');
        });

        it('should fail when role is invalid', async () => {
            const result = await runValidation(validateUpdateUser, {
                role: 'superadmin',
            });
        
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Invalid role value. Allowed roles: administrator, manager_division, project_owner, staff.');
        });
    });
});