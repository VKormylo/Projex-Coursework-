"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const projects_controller_1 = require("./projects.controller");
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
exports.projectsRouter.get("/", projects_controller_1.listProjects);
exports.projectsRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createProjectSchema), projects_controller_1.createProject);
exports.projectsRouter.patch("/:id", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(updateProjectSchema), projects_controller_1.updateProject);
