"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const appRole = zod_1.z.enum(["Admin", "Project Manager", "Developer"]);
exports.registerSchema = zod_1.z
    .object({
    fullName: zod_1.z.string().min(2).max(150),
    email: zod_1.z.string().email().max(255),
    password: zod_1.z.string().min(8).max(128),
    confirmPassword: zod_1.z.string().min(8).max(128),
    role: appRole,
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
});
