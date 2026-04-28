"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesRouter = exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const http_1 = require("../../lib/http");
const auth_1 = require("../../middleware/auth");
const error_handler_1 = require("../../middleware/error-handler");
const validate_1 = require("../../middleware/validate");
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
exports.usersRouter.get("/", (0, auth_1.authorize)("Admin"), async (_req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        include: { userRoles: { include: { role: true } } },
    });
    res.json((0, http_1.toJson)(users));
});
exports.usersRouter.post("/", (0, auth_1.authorize)("Admin"), (0, validate_1.validateBody)(createUserSchema), async (req, res) => {
    const user = await prisma_1.prisma.user.create({ data: req.body });
    res.status(201).json((0, http_1.toJson)(user));
});
exports.usersRouter.post("/:id/roles", (0, auth_1.authorize)("Admin"), (0, validate_1.validateBody)(assignRoleSchema), async (req, res) => {
    const userId = (0, http_1.asBigInt)(req.params.id);
    const roleId = req.body.roleId;
    const role = await prisma_1.prisma.role.findUnique({ where: { id: roleId } });
    if (!role)
        throw new error_handler_1.HttpError(404, "Role not found");
    const item = await prisma_1.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        create: { userId, roleId },
        update: {},
    });
    res.status(201).json((0, http_1.toJson)(item));
});
exports.rolesRouter = (0, express_1.Router)();
exports.rolesRouter.get("/", async (_req, res) => {
    const roles = await prisma_1.prisma.role.findMany();
    res.json((0, http_1.toJson)(roles));
});
