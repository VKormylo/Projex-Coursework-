"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommentsByTask = getCommentsByTask;
exports.createCommentRecord = createCommentRecord;
const prisma_1 = require("../../lib/prisma");
async function getCommentsByTask(taskId) {
    return prisma_1.prisma.taskComment.findMany({ where: { taskId } });
}
async function createCommentRecord(data) {
    return prisma_1.prisma.taskComment.create({ data });
}
