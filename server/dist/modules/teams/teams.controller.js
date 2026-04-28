"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeams = listTeams;
exports.createTeam = createTeam;
exports.addTeamMember = addTeamMember;
const http_1 = require("../../lib/http");
const teams_service_1 = require("./teams.service");
async function listTeams(_req, res) {
    const teams = await (0, teams_service_1.getTeams)();
    res.status(200).json({
        status: "success",
        data: { teams },
    });
}
async function createTeam(req, res) {
    const team = await (0, teams_service_1.createTeamRecord)(req.body);
    res.status(201).json({
        status: "success",
        data: { team },
    });
}
async function addTeamMember(req, res) {
    const teamId = (0, http_1.asBigInt)(req.params.id);
    const userId = (0, http_1.asBigInt)(req.body.userId);
    const member = await (0, teams_service_1.upsertTeamMember)(teamId, userId);
    res.status(201).json({
        status: "success",
        data: { member },
    });
}
