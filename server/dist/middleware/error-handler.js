"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.errorHandler = errorHandler;
class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.HttpError = HttpError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof HttpError) {
        const status = err.status >= 400 && err.status < 500 ? "fail" : "error";
        return res.status(err.status).json({
            status,
            message: err.message,
        });
    }
    if (err instanceof Error) {
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
    return res.status(500).json({
        status: "error",
        message: "Unknown error",
    });
}
