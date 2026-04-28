"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.createUserRecord = createUserRecord;
exports.assignRole = assignRole;
exports.getRoles = getRoles;
const prisma_1 = require("../../lib/prisma");
const error_handler_1 = require("../../middleware/error-handler");
async function getUsers() {
    return prisma_1.prisma.user.findMany({
        include: { userRoles: { include: { role: true } } },
    });
}
async function createUserRecord(data) {
    return prisma_1.prisma.user.create({ data });
}
async function assignRole(userId, roleId) {
    const role = await prisma_1.prisma.role.findUnique({ where: { id: roleId } });
    if (!role)
        throw new error_handler_1.HttpError(404, "Role not found");
    return prisma_1.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        create: { userId, roleId },
        update: {},
    });
}
async function getRoles() {
    return prisma_1.prisma.role.findMany();
}
