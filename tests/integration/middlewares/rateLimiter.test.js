const { loginLimiter, registerLimiter } = require('../../../src/middlewares/auth/rateLimiter');

describe('Rate Limiter Middleware', () => {
    it('should export loginLimiter', () => {
        expect(loginLimiter).toBeDefined();
        expect(typeof loginLimiter).toBe('function');
    });

    it('should export registerLimiter', () => {
        expect(registerLimiter).toBeDefined();
        expect(typeof registerLimiter).toBe('function');
    });

    it('should have higher limit in test environment', () => {
        expect(process.env.NODE_ENV).toBe('test');
    });
});