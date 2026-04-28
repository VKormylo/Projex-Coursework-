"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = getReleases;
exports.createReleaseFromSprintRecord = createReleaseFromSprintRecord;
const prisma_1 = require("../../lib/prisma");
async function getReleases() {
    return prisma_1.prisma.release.findMany();
}
async function createReleaseFromSprintRecord(sprintId, version) {
    return prisma_1.prisma.$executeRawUnsafe(`CALL sp_create_release_from_sprint(${sprintId}, '${version}');`);
}
