"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasks = getTasks;
exports.createTaskRecord = createTaskRecord;
exports.updateTaskStatusRecord = updateTaskStatusRecord;
const http_1 = require("../../lib/http");
const prisma_1 = require("../../lib/prisma");
const error_handler_1 = require("../../middleware/error-handler");
const statusFlow = {
    todo: ["in_progress", "blocked"],
    in_progress: ["in_review", "blocked", "todo"],
    in_review: ["done", "in_progress", "blocked"],
    done: [],
    blocked: ["todo", "in_progress"],
};
async function getTasks(filters) {
    return prisma_1.prisma.task.findMany({ where: filters, include: { comments: true } });
}
async function createTaskRecord(body) {
    return prisma_1.prisma.task.create({
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
}
async function updateTaskStatusRecord(id, nextStatus, actorUserId) {
    const task = await prisma_1.prisma.task.findUnique({ where: { id } });
    if (!task)
        throw new error_handler_1.HttpError(404, "Task not found");
    if (!statusFlow[task.status].includes(nextStatus)) {
        throw new error_handler_1.HttpError(400, `Invalid transition: ${task.status} -> ${nextStatus}`);
    }
    await prisma_1.prisma.$executeRawUnsafe(`SELECT set_config('app.user_id', '${actorUserId ?? ""}', true);`);
    return prisma_1.prisma.task.update({
        where: { id },
        data: { status: nextStatus },
    });
}
