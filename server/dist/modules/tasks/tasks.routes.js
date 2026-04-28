"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksRouter = exports.createTaskSchema = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const tasks_controller_1 = require("./tasks.controller");
exports.createTaskSchema = zod_1.z.object({
    projectId: zod_1.z.string().regex(/^\d+$/),
    sprintId: zod_1.z.string().regex(/^\d+$/).nullable().optional(),
    title: zod_1.z.string().min(2).max(220),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.nativeEnum(client_1.TaskPriority),
    status: zod_1.z.nativeEnum(client_1.TaskStatus),
    storyPoint: zod_1.z.number().int().min(0).optional(),
    assigneeId: zod_1.z.string().regex(/^\d+$/).nullable().optional(),
    reporterId: zod_1.z.string().regex(/^\d+$/),
    dueDate: zod_1.z.string().date().optional(),
});
exports.tasksRouter = (0, express_1.Router)();
exports.tasksRouter.get("/", auth_1.authenticate, tasks_controller_1.listTasks);
exports.tasksRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager", "Developer"), (0, validate_1.validateBody)(exports.createTaskSchema), tasks_controller_1.createTask);
exports.tasksRouter.patch("/:id/status", auth_1.authenticate, (0, auth_1.authorize)("Admin", "Project Manager", "Developer"), (0, validate_1.validateBody)(zod_1.z.object({ status: zod_1.z.nativeEnum(client_1.TaskStatus) })), tasks_controller_1.updateTaskStatus);
