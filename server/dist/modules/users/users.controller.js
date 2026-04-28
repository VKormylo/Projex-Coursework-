"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.assignRoleToUser = assignRoleToUser;
exports.listRoles = listRoles;
const http_1 = require("../../lib/http");
const users_service_1 = require("./users.service");
async function listUsers(_req, res) {
    const users = await (0, users_service_1.getUsers)();
    res.status(200).json({
        status: "success",
        data: { users },
    });
}
async function createUser(req, res) {
    const user = await (0, users_service_1.createUserRecord)(req.body);
    res.status(201).json({
        status: "success",
        data: { user },
    });
}
async function assignRoleToUser(req, res) {
    const userId = (0, http_1.asBigInt)(req.params.id);
    const userRole = await (0, users_service_1.assignRole)(userId, req.body.roleId);
    res.status(201).json({
        status: "success",
        data: { userRole },
    });
}
async function listRoles(_req, res) {
    const roles = await (0, users_service_1.getRoles)();
    res.status(200).json({
        status: "success",
        data: { roles },
    });
}
