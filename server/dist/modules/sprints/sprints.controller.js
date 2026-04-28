"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSprints = listSprints;
exports.createSprint = createSprint;
exports.closeSprint = closeSprint;
const http_1 = require("../../lib/http");
const sprints_service_1 = require("./sprints.service");
async function listSprints(_req, res) {
    const sprints = await (0, sprints_service_1.getSprints)();
    res.status(200).json({
        status: "success",
        data: { sprints },
    });
}
async function createSprint(req, res) {
    const sprint = await (0, sprints_service_1.createSprintRecord)({
        projectId: (0, http_1.asBigInt)(req.body.projectId),
        name: req.body.name,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        goal: req.body.goal,
        status: req.body.status,
    });
    res.status(201).json({
        status: "success",
        data: { sprint },
    });
}
async function closeSprint(req, res) {
    const sprintId = (0, http_1.asBigInt)(req.params.id);
    await (0, sprints_service_1.closeSprintById)(sprintId);
    res.status(200).json({
        status: "success",
        data: null,
    });
}
