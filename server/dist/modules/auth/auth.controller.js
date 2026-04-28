"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const auth_service_1 = require("./auth.service");
async function register(req, res, next) {
    try {
        const data = await (0, auth_service_1.registerUser)(req.body);
        res.status(201).json({
            status: "success",
            data,
        });
    }
    catch (error) {
        next(error);
    }
}
async function login(req, res, next) {
    try {
        const data = await (0, auth_service_1.loginUser)(req.body);
        res.status(200).json({
            status: "success",
            data,
        });
    }
    catch (error) {
        next(error);
    }
}
