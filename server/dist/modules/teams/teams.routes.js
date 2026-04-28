"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const teams_controller_1 = require("./teams.controller");
const createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
});
const addMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().regex(/^\d+$/),
});
exports.teamsRouter = (0, express_1.Router)();
exports.teamsRouter.get("/", teams_controller_1.listTeams);
exports.teamsRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createTeamSchema), teams_controller_1.createTeam);
exports.teamsRouter.post("/:id/members", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(addMemberSchema), teams_controller_1.addTeamMember);
