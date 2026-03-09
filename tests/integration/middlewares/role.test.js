const roleMiddleware = require("../../../src/middlewares/role/role");

describe("Role Middleware", () => {
    let req, res, next;
    
    beforeEach(() => {
        req = { user: null };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should call next() when user has valid role', () => {
        req.user = { id: 'user-1', role: 'administrator' };

        roleMiddleware(['administrator'])(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when user has one of multiple valid roles', () => {
        req.user = { id: 'user-1', role: 'manager' };

        roleMiddleware(['administrator', 'manager'])(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user has insufficient role', () => {
        req.user = { id: 'user-1', role: 'staff' };

        roleMiddleware(['administrator'])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Forbidden. Insufficient role.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not authenticated', () => {
        req.user = null;

        roleMiddleware(['administrator'])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Forbidden. Insufficient role.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when roles array is empty', () => {
        req.user = { id: 'user-1', role: 'administrator' };

        roleMiddleware([])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});