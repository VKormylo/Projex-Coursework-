"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjects = listProjects;
exports.createProject = createProject;
exports.updateProject = updateProject;
const http_1 = require("../../lib/http");
const projects_service_1 = require("./projects.service");
async function listProjects(_req, res) {
    const projects = await (0, projects_service_1.getProjects)();
    res.status(200).json({
        status: "success",
        data: { projects },
    });
}
async function createProject(req, res) {
    const project = await (0, projects_service_1.createProjectRecord)(req.body);
    res.status(201).json({
        status: "success",
        data: { project },
    });
}
async function updateProject(req, res) {
    const id = (0, http_1.asBigInt)(req.params.id);
    const project = await (0, projects_service_1.updateProjectRecord)(id, req.body);
    res.status(200).json({
        status: "success",
        data: { project },
    });
}
