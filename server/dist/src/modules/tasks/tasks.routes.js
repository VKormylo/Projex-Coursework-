"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const http_1 = require("../../lib/http");
const auth_1 = require("../../middleware/auth");
const error_handler_1 = require("../../middleware/error-handler");
const validate_1 = require("../../middleware/validate");
const createTaskSchema = zod_1.z.object({
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
const statusFlow = {
    todo: ["in_progress", "blocked"],
    in_progress: ["in_review", "blocked", "todo"],
    in_review: ["done", "in_progress", "blocked"],
    done: [],
    blocked: ["todo", "in_progress"],
};
exports.tasksRouter = (0, express_1.Router)();
exports.tasksRouter.get("/", auth_1.authenticate, async (req, res) => {
    const where = {};
    const { projectId, sprintId, status, assigneeId, priority } = req.query;
    if (projectId)
        where.projectId = (0, http_1.asBigInt)(String(projectId));
    if (sprintId)
        where.sprintId = (0, http_1.asBigInt)(String(sprintId));
    if (status)
        where.status = status;
    if (assigneeId)
        where.assigneeId = (0, http_1.asBigInt)(String(assigneeId));
    if (priority)
        where.priority = priority;
    const tasks = await prisma_1.prisma.task.findMany({ where, include: { comments: true } });
    res.json((0, http_1.toJson)(tasks));
});
exports.tasksRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager", "Developer"), (0, validate_1.validateBody)(createTaskSchema), async (req, res) => {
    const body = req.body;
    const task = await prisma_1.prisma.task.create({
        data: {
            projectId: (0, http_1.asBigInt)(body.projectId),
            sprintId: body.sprintId ? (0, http_1.asBigInt)(body.sprintId) : null,
            title: body.title,
            description: body.description,
            priority: body.priority,
            status: body.status,
            storyPoint: body.storyPoint,
            assigneeId: body.assigneeId ? (0, http_1.asBigInt)(body.assigneeId) : null,
            reporterId: (0, http_1.asBigInt)(body.reporterId),
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
    });
    res.status(201).json((0, http_1.toJson)(task));
});
exports.tasksRouter.patch("/:id/status", auth_1.authenticate, (0, auth_1.authorize)("Admin", "Project Manager", "Developer"), (0, validate_1.validateBody)(zod_1.z.object({ status: zod_1.z.nativeEnum(client_1.TaskStatus) })), async (req, res) => {
    const id = (0, http_1.asBigInt)(req.params.id);
    const nextStatus = req.body.status;
    const task = await prisma_1.prisma.task.findUnique({ where: { id } });
    if (!task)
        throw new error_handler_1.HttpError(404, "Task not found");
    if (!statusFlow[task.status].includes(nextStatus)) {
        throw new error_handler_1.HttpError(400, `Invalid transition: ${task.status} -> ${nextStatus}`);
    }
    await prisma_1.prisma.$executeRawUnsafe(`SELECT set_config('app.user_id', '${req.user?.userId ?? ""}', true);`);
    const updated = await prisma_1.prisma.task.update({
        where: { id },
        data: { status: nextStatus },
    });
    res.json((0, http_1.toJson)(updated));
});
