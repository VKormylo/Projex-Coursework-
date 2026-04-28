"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const error_handler_1 = require("./error-handler");
function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return next(new error_handler_1.HttpError(401, "Missing or invalid Authorization header"));
    }
    const token = header.split(" ")[1];
    try {
        req.user = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        return next();
    }
    catch {
        return next(new error_handler_1.HttpError(401, "Invalid token"));
    }
}
function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new error_handler_1.HttpError(401, "Not authenticated"));
        }
        const hasRole = req.user.roles.some((r) => roles.includes(r));
        if (!hasRole) {
            return next(new error_handler_1.HttpError(403, "Forbidden"));
        }
        return next();
    };
}
