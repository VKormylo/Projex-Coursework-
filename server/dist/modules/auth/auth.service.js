"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const prisma_1 = require("../../lib/prisma");
const error_handler_1 = require("../../middleware/error-handler");
async function buildToken(userId, email) {
    const userRoles = await prisma_1.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
    });
    const roles = userRoles.map((r) => r.role.name);
    return jsonwebtoken_1.default.sign({ userId: userId.toString(), email, roles }, env_1.env.jwtSecret, {
        expiresIn: "12h",
    });
}
async function registerUser(input) {
    const { fullName, email, password, role } = input;
    const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exists) {
        throw new error_handler_1.HttpError(409, "Email already used");
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            fullName,
            email,
            passwordHash,
            position: "",
        },
    });
    const roleRecord = await prisma_1.prisma.role.findUnique({
        where: { name: role },
    });
    if (!roleRecord) {
        throw new error_handler_1.HttpError(500, "Role not configured; run prisma:seed");
    }
    await prisma_1.prisma.userRole.create({
        data: { userId: user.id, roleId: roleRecord.id },
    });
    const token = await buildToken(user.id, user.email);
    return { token, userId: user.id.toString() };
}
async function loginUser(input) {
    const { email, password } = input;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
        throw new error_handler_1.HttpError(401, "Invalid credentials");
    }
    const ok = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!ok) {
        throw new error_handler_1.HttpError(401, "Invalid credentials");
    }
    const token = await buildToken(user.id, user.email);
    return { token, userId: user.id.toString() };
}
