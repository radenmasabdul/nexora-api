const roleMiddleware = require('../../../src/middlewares/role/role');

describe('Role Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('Single Role Authorization', () => {
        it('should allow access for correct role', () => {
            req.user = { id: '1', role: 'admin' };
            const middleware = roleMiddleware(['admin']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for incorrect role', () => {
            req.user = { id: '1', role: 'member' };
            const middleware = roleMiddleware(['admin']);

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Forbidden. Insufficient role.' 
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Multiple Roles Authorization', () => {
        it('should allow access for admin role', () => {
            req.user = { id: '1', role: 'admin' };
            const middleware = roleMiddleware(['admin', 'manager']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow access for manager role', () => {
            req.user = { id: '1', role: 'manager' };
            const middleware = roleMiddleware(['admin', 'manager']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for member role', () => {
            req.user = { id: '1', role: 'member' };
            const middleware = roleMiddleware(['admin', 'manager']);

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Forbidden. Insufficient role.' 
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should deny access when user is null', () => {
            req.user = null;
            const middleware = roleMiddleware(['admin']);

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Forbidden. Insufficient role.' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should deny access when user has no role', () => {
            req.user = { id: '1' }; // No role property
            const middleware = roleMiddleware(['admin']);

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Forbidden. Insufficient role.' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should deny access when roles array is empty', () => {
            req.user = { id: '1', role: 'admin' };
            const middleware = roleMiddleware([]);

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Forbidden. Insufficient role.' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should allow access when no roles specified (default behavior)', () => {
            req.user = { id: '1', role: 'member' };
            const middleware = roleMiddleware(); // No roles specified

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Role Hierarchy Testing', () => {
        it('should respect role hierarchy - admin can access admin-only', () => {
            req.user = { id: '1', role: 'admin' };
            const middleware = roleMiddleware(['admin']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should respect role hierarchy - manager can access manager-only', () => {
            req.user = { id: '1', role: 'manager' };
            const middleware = roleMiddleware(['manager']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should respect role hierarchy - member can access member-only', () => {
            req.user = { id: '1', role: 'member' };
            const middleware = roleMiddleware(['member']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});