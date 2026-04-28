"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const http_1 = require("../../lib/http");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const createProjectSchema = zod_1.z.object({
    teamId: zod_1.z.string().regex(/^\d+$/),
    name: zod_1.z.string().min(2).max(180),
    description: zod_1.z.string().optional(),
    startDate: zod_1.z.string().date().optional(),
    endDate: zod_1.z.string().date().optional(),
    status: zod_1.z.nativeEnum(client_1.ProjectStatus),
    createdBy: zod_1.z.string().regex(/^\d+$/),
});
const updateProjectSchema = createProjectSchema.partial();
exports.projectsRouter = (0, express_1.Router)();
exports.projectsRouter.get("/", async (_req, res) => {
    const projects = await prisma_1.prisma.project.findMany({
        include: { sprints: true, tasks: true },
    });
    res.json((0, http_1.toJson)(projects));
});
exports.projectsRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createProjectSchema), async (req, res) => {
    const payload = req.body;
    const project = await prisma_1.prisma.project.create({
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
    res.status(201).json((0, http_1.toJson)(project));
});
exports.projectsRouter.patch("/:id", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(updateProjectSchema), async (req, res) => {
    const id = (0, http_1.asBigInt)(req.params.id);
    const data = req.body;
    const project = await prisma_1.prisma.project.update({
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
    res.json((0, http_1.toJson)(project));
});
