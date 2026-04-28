"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesRouter = exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const users_controller_1 = require("./users.controller");
const createUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(150),
    email: zod_1.z.string().email(),
    passwordHash: zod_1.z.string().min(20),
    position: zod_1.z.string().min(2).max(100),
});
const assignRoleSchema = zod_1.z.object({
    roleId: zod_1.z.number().int().positive(),
});
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.get("/", (0, auth_1.authorize)("Admin"), users_controller_1.listUsers);
exports.usersRouter.post("/", (0, auth_1.authorize)("Admin"), (0, validate_1.validateBody)(createUserSchema), users_controller_1.createUser);
exports.usersRouter.post("/:id/roles", (0, auth_1.authorize)("Admin"), (0, validate_1.validateBody)(assignRoleSchema), users_controller_1.assignRoleToUser);
exports.rolesRouter = (0, express_1.Router)();
exports.rolesRouter.get("/", users_controller_1.listRoles);
