const jwt = require("jsonwebtoken");
const verifyToken = require("../../../src/middlewares/auth/auth");

describe("verifyToken Middleware", () => {
    let req, res, next;
    
    beforeEach(() => {
        req = { headers: {}, cookies: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });
    
    it("should call next() with valid Bearer token", () => {
        const token = jwt.sign(
            { id: "user-1", role: "administrator" },
            "test-secret",
        );
        req.headers.authorization = `Bearer ${token}`;
        
        verifyToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toHaveProperty("id", "user-1");
        expect(req.user).toHaveProperty("role", "administrator");
    });
    
    it("should call next() with valid cookie token", () => {
        const token = jwt.sign(
            { id: "user-1", role: "administrator" },
            "test-secret",
        );
        req.cookies.token = token;

        verifyToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toHaveProperty("id", "user-1");
    });

    it("should return 401 when no token provided", () => {
        verifyToken(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Unauthenticated.",
        });
        expect(next).not.toHaveBeenCalled();
    });
    
    it("should return 401 when token is invalid", () => {
        req.headers.authorization = "Bearer invalidtoken123";

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid token.",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is expired", () => {
        const token = jwt.sign(
            { id: "user-1" },
            "test-secret",
            { expiresIn: "0s" },
        );
        req.headers.authorization = `Bearer ${token}`;

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid token.",
        });
        expect(next).not.toHaveBeenCalled();
    });
});