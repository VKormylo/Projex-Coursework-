"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const error_handler_1 = require("./error-handler");
function validateBody(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues.map((i) => i.message).join("; ");
            return next(new error_handler_1.HttpError(400, issues));
        }
        req.body = result.data;
        return next();
    };
}
