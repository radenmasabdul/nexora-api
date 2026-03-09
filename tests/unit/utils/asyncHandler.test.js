const asyncHandler = require("../../../src/utils/handlers/asyncHandler");

describe("async handler", () => {
    it("should call fn and pass req, res, next", async () => {
        const mockFn = jest.fn().mockResolvedValue('ok');
        const req = {}, res = {}, next = jest.fn();

        asyncHandler(mockFn)(req, res, next);

        await Promise.resolve();

        expect(mockFn).toHaveBeenCalledWith(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when fn throws', async () => {
        const error = new Error('Something went wrong');
        const mockFn = jest.fn().mockRejectedValue(error);
        const req = {}, res = {}, next = jest.fn();

        asyncHandler(mockFn)(req, res, next);

        await Promise.resolve();

        expect(next).toHaveBeenCalledWith(error);
    });
});