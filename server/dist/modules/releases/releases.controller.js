"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReleases = listReleases;
exports.createReleaseFromSprint = createReleaseFromSprint;
const http_1 = require("../../lib/http");
const releases_service_1 = require("./releases.service");
async function listReleases(_req, res) {
    const releases = await (0, releases_service_1.getReleases)();
    res.status(200).json({
        status: "success",
        data: { releases },
    });
}
async function createReleaseFromSprint(req, res) {
    const sprintId = (0, http_1.asBigInt)(req.body.sprintId);
    const version = req.body.version.replace(/'/g, "");
    await (0, releases_service_1.createReleaseFromSprintRecord)(sprintId, version);
    res.status(201).json({
        status: "success",
        message: "Release created",
    });
}
