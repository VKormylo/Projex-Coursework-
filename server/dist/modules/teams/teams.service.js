"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeams = getTeams;
exports.createTeamRecord = createTeamRecord;
exports.upsertTeamMember = upsertTeamMember;
const prisma_1 = require("../../lib/prisma");
async function getTeams() {
    return prisma_1.prisma.team.findMany({ include: { teamMember: true } });
}
async function createTeamRecord(data) {
    return prisma_1.prisma.team.create({ data });
}
async function upsertTeamMember(teamId, userId) {
    return prisma_1.prisma.teamMember.upsert({
        where: { teamId_userId: { teamId, userId } },
        create: { teamId, userId },
        update: {},
    });
}
