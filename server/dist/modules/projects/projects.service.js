"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjects = getProjects;
exports.createProjectRecord = createProjectRecord;
exports.updateProjectRecord = updateProjectRecord;
const http_1 = require("../../lib/http");
const prisma_1 = require("../../lib/prisma");
async function getProjects() {
    return prisma_1.prisma.project.findMany({ include: { sprints: true, tasks: true } });
}
async function createProjectRecord(payload) {
    return prisma_1.prisma.project.create({
        data: {
            teamId: (0, http_1.asBigInt)(payload.teamId),
            name: payload.name,
            description: payload.description,
            startDate: payload.startDate ? new Date(payload.startDate) : null,
            endDate: payload.endDate ? new Date(payload.endDate) : null,
            status: payload.status,
            createdBy: (0, http_1.asBigInt)(payload.createdBy),
        },
    });
}
async function updateProjectRecord(id, data) {
    return prisma_1.prisma.project.update({
        where: { id },
        data: {
            ...(data.teamId ? { teamId: (0, http_1.asBigInt)(data.teamId) } : {}),
            ...(data.name ? { name: data.name } : {}),
            ...(data.description ? { description: data.description } : {}),
            ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
            ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
            ...(data.status ? { status: data.status } : {}),
            ...(data.createdBy ? { createdBy: (0, http_1.asBigInt)(data.createdBy) } : {}),
        },
    });
}
