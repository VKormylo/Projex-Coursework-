"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSprints = getSprints;
exports.createSprintRecord = createSprintRecord;
exports.closeSprintById = closeSprintById;
const prisma_1 = require("../../lib/prisma");
async function getSprints() {
    return prisma_1.prisma.sprint.findMany({ include: { tasks: true } });
}
async function createSprintRecord(data) {
    return prisma_1.prisma.sprint.create({ data });
}
async function closeSprintById(sprintId) {
    return prisma_1.prisma.$executeRawUnsafe(`CALL sp_close_sprint(${sprintId});`);
}
