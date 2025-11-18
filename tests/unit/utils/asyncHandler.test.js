const asyncHandler = require('../../../src/utils/handlers/asyncHandler');

describe('AsyncHandler', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {};
        next = jest.fn();
    });

    it('should call next() when async function resolves', async () => {
        const asyncFn = jest.fn().mockResolvedValue('success');
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(req, res, next);

        expect(asyncFn).toHaveBeenCalledWith(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when async function rejects', async () => {
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(req, res, next);

        expect(asyncFn).toHaveBeenCalledWith(req, res, next);
        expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous functions', () => {
        const syncFn = jest.fn();
        const wrappedFn = asyncHandler(syncFn);

        wrappedFn(req, res, next);

        expect(syncFn).toHaveBeenCalledWith(req, res, next);
    });
});