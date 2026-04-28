"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releasesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const http_1 = require("../../lib/http");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const createReleaseSchema = zod_1.z.object({
    sprintId: zod_1.z.string().regex(/^\d+$/),
    version: zod_1.z.string().min(1).max(30),
});
exports.releasesRouter = (0, express_1.Router)();
exports.releasesRouter.get("/", async (_req, res) => {
    const releases = await prisma_1.prisma.release.findMany();
    res.json((0, http_1.toJson)(releases));
});
exports.releasesRouter.post("/from-sprint", (0, auth_1.authorize)("Admin", "Project Manager"), (0, validate_1.validateBody)(createReleaseSchema), async (req, res) => {
    const sprintId = (0, http_1.asBigInt)(req.body.sprintId);
    const version = req.body.version.replace(/'/g, "");
    await prisma_1.prisma.$executeRawUnsafe(`CALL sp_create_release_from_sprint(${sprintId}, '${version}');`);
    res.status(201).json({ message: "Release created" });
});
