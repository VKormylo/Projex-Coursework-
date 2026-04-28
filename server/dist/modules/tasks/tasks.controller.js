"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTasks = listTasks;
exports.createTask = createTask;
exports.updateTaskStatus = updateTaskStatus;
const http_1 = require("../../lib/http");
const tasks_service_1 = require("./tasks.service");
async function listTasks(req, res) {
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
    const tasks = await (0, tasks_service_1.getTasks)(where);
    res.status(200).json({
        status: "success",
        data: { tasks },
    });
}
async function createTask(req, res) {
    const task = await (0, tasks_service_1.createTaskRecord)(req.body);
    res.status(201).json({
        status: "success",
        data: { task },
    });
}
async function updateTaskStatus(req, res) {
    const id = (0, http_1.asBigInt)(req.params.id);
    const nextStatus = req.body.status;
    const task = await (0, tasks_service_1.updateTaskStatusRecord)(id, nextStatus, req.user?.userId);
    res.status(200).json({
        status: "success",
        data: { task },
    });
}
