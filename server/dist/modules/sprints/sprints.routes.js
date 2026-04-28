"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sprintsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const sprints_controller_1 = require("./sprints.controller");
const createSprintSchema = zod_1.z.object({
    projectId: zod_1.z.string().regex(/^\d+$/),
    name: zod_1.z.string().min(2).max(120),
    startDate: zod_1.z.string().date(),
    endDate: zod_1.z.string().date(),
    goal: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.SprintStatus),
});
exports.sprintsRouter = (0, express_1.Router)();
exports.sprintsRouter.get("/", sprints_controller_1.listSprints);
exports.sprintsRouter.post("/", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createSprintSchema), sprints_controller_1.createSprint);
exports.sprintsRouter.post("/:id/close", (0, auth_1.authorize)("Admin", "Project Manager"), sprints_controller_1.closeSprint);
