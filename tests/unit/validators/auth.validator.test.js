const { validationResult } = require('express-validator');

jest.mock('../../../prisma/client/index.js', () => ({
    user: { findUnique: jest.fn() },
}));

const prisma = require('../../../prisma/client/index.js');
const { validateRegister, validateLogin } = require('../../../src/utils/validators/auth/auth.js');

const runValidation = async (validators, body) => {
    const req = { body, headers: {}, cookies: {} };
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('Auth Validator', () => {
    afterEach(() => jest.clearAllMocks());

    describe('validateRegister', () => {
        it('should pass with valid data', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateRegister, {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when name is empty', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateRegister, {
                name: '',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Name is required');
        });

        it('should fail when name is too short', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateRegister, {
                name: 'J',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Name must be at least 2 characters long');
        });

        it('should fail when email is invalid', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateRegister, {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Invalid email format');
        });

        it('should fail when email already in use', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'user-1' }); // ← email exists!

            const result = await runValidation(validateRegister, {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'administrator',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Email already in use');
        });

        it('should fail when password has no uppercase', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await runValidation(validateRegister, {
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

            const result = await runValidation(validateRegister, {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password1!',
                role: 'superadmin', // ← invalid!
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Role must be either administrator, manager_division, project_owner, or staff');
        });
    });

    describe('validateLogin', () => {
        it('should pass with valid data', async () => {
            const result = await runValidation(validateLogin, {
                email: 'john@example.com',
                password: 'Password1!',
            });

            expect(result.isEmpty()).toBe(true);
        });

        it('should fail when email is empty', async () => {
            const result = await runValidation(validateLogin, {
                email: '',
                password: 'Password1!',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Email is required');
        });

        it('should fail when password is too short', async () => {
            const result = await runValidation(validateLogin, {
                email: 'john@example.com',
                password: '123',
            });

            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Password must be at least 6 characters long');
        });
    });
});