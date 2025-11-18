const jwt = require('jsonwebtoken');
const verifyToken = require('../../../src/middlewares/auth/auth');

// Mock environment variable
process.env.JWT_SECRET = 'test-secret';

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            cookies: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should authenticate with valid Bearer token', () => {
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;

        verifyToken(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(1);
        expect(next).toHaveBeenCalled();
    });

    it('should authenticate with valid cookie token', () => {
        const token = jwt.sign({ id: 2 }, process.env.JWT_SECRET);
        req.cookies.token = token;

        verifyToken(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(2);
        expect(next).toHaveBeenCalled();
    });

    it('should return 401 for missing token', () => {
        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthenticated.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
        req.headers.authorization = 'Bearer invalid-token';

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token.' });
        expect(next).not.toHaveBeenCalled();
    });
});