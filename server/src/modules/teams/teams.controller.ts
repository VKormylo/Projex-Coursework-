import { Request, Response } from "express";

import { assertTeamManagedByPmOrAdmin, isAdminRole } from "../../lib/access";
import { asBigInt } from "../../lib/http";
import { HttpError } from "../../middleware/error-handler";
import {
  createTeamRecord,
  deleteTeamRecord,
  getTeamsWhere,
  removeTeamMember,
  updateTeamRecord,
  upsertTeamMember,
} from "./teams.service";

export async function listTeams(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const where = isAdminRole(req.user.roles) ? undefined : { teamMember: { some: { userId } } };
  const teams = await getTeamsWhere(where);

  res.status(200).json({
    status: "success",
    data: { teams },
  });
}

export async function createTeam(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const team = await createTeamRecord(req.body);
  if (!isAdminRole(req.user.roles) && req.user.roles.includes("Project Manager")) {
    await upsertTeamMember(team.id, BigInt(req.user.userId));
  }

  res.status(201).json({
    status: "success",
    data: { team },
  });
}

export async function updateTeam(req: Request, res: Response) {
  const teamId = asBigInt(req.params.id);
  await assertTeamManagedByPmOrAdmin(req, teamId);
  const team = await updateTeamRecord(teamId, req.body.name);

  res.status(200).json({
    status: "success",
    data: { team },
  });
}

export async function addTeamMember(req: Request, res: Response) {
  const teamId = asBigInt(req.params.id);
  await assertTeamManagedByPmOrAdmin(req, teamId);

  const userId = asBigInt(req.body.userId);
  const member = await upsertTeamMember(teamId, userId);

  res.status(201).json({
    status: "success",
    data: { member },
  });
}

export async function deleteTeam(req: Request, res: Response) {
  const teamId = asBigInt(req.params.id);

  await assertTeamManagedByPmOrAdmin(req, teamId);
  await deleteTeamRecord(teamId);

  res.status(200).json({ status: "success", data: null });
}

export async function deleteTeamMember(req: Request, res: Response) {
  const teamId = asBigInt(req.params.id);
  await assertTeamManagedByPmOrAdmin(req, teamId);
  const userId = asBigInt(req.params.userId);
  await removeTeamMember(teamId, userId);

  res.status(200).json({
    status: "success",
    data: null,
  });
}
