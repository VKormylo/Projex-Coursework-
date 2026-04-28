"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sprintsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const http_1 = require("../../lib/http");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const createSprintSchema = zod_1.z.object({
    projectId: zod_1.z.string().regex(/^\d+$/),
    name: zod_1.z.string().min(2).max(120),
    startDate: zod_1.z.string().date(),
    endDate: zod_1.z.string().date(),
    goal: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.SprintStatus),
});
exports.sprintsRouter = (0, express_1.Router)();
exports.sprintsRouter.get("/", async (_req, res) => {
    const sprints = await prisma_1.prisma.sprint.findMany({ include: { tasks: true } });
    res.json((0, http_1.toJson)(sprints));
});
exports.sprintsRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createSprintSchema), async (req, res) => {
    const sprint = await prisma_1.prisma.sprint.create({
        data: {
            projectId: (0, http_1.asBigInt)(req.body.projectId),
            name: req.body.name,
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
            goal: req.body.goal,
            status: req.body.status,
        },
    });
    res.status(201).json((0, http_1.toJson)(sprint));
});
exports.sprintsRouter.post("/:id/close", (0, auth_1.authorize)("Admin", "Project Manager"), async (req, res) => {
    const sprintId = (0, http_1.asBigInt)(req.params.id);
    await prisma_1.prisma.$executeRawUnsafe(`CALL sp_close_sprint(${sprintId});`);
    res.json({ message: "Sprint closed" });
});
