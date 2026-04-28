"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releasesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const releases_controller_1 = require("./releases.controller");
const createReleaseSchema = zod_1.z.object({
    sprintId: zod_1.z.string().regex(/^\d+$/),
    version: zod_1.z.string().min(1).max(30),
});
exports.releasesRouter = (0, express_1.Router)();
exports.releasesRouter.get("/", releases_controller_1.listReleases);
exports.releasesRouter.post("/from-sprint", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createReleaseSchema), releases_controller_1.createReleaseFromSprint);
