"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const http_1 = require("../../lib/http");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
});
const addMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().regex(/^\d+$/),
});
exports.teamsRouter = (0, express_1.Router)();
exports.teamsRouter.get("/", async (_req, res) => {
    const teams = await prisma_1.prisma.team.findMany({ include: { teamMember: true } });
    res.json((0, http_1.toJson)(teams));
});
exports.teamsRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createTeamSchema), async (req, res) => {
    const team = await prisma_1.prisma.team.create({ data: req.body });
    res.status(201).json((0, http_1.toJson)(team));
});
exports.teamsRouter.post("/:id/members", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(addMemberSchema), async (req, res) => {
    const teamId = (0, http_1.asBigInt)(req.params.id);
    const userId = (0, http_1.asBigInt)(req.body.userId);
    const member = await prisma_1.prisma.teamMember.upsert({
        where: { teamId_userId: { teamId, userId } },
        create: { teamId, userId },
        update: {},
    });
    res.status(201).json((0, http_1.toJson)(member));
});
