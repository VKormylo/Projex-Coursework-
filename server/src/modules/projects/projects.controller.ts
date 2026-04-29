import { Request, Response } from "express";

import {
  assertCreateProject,
  assertProjectReadable,
  getAccessibleProjectIds,
  isAdminRole,
  isMemberOfTeam,
} from "../../lib/access";
import { asBigInt } from "../../lib/http";
import { HttpError } from "../../middleware/error-handler";
import {
  createProjectRecord,
  deleteProjectRecord,
  getProjectById,
  getProjectsWhere,
  updateProjectRecord,
} from "./projects.service";

export async function listProjects(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const projectIds = await getAccessibleProjectIds(userId, req.user.roles);
  const where = projectIds === null ? undefined : { id: { in: projectIds } };
  const projects = await getProjectsWhere(where);

  res.status(200).json({
    status: "success",
    data: { projects },
  });
}

export async function getProject(req: Request, res: Response) {
  const id = asBigInt(req.params.id);

  await assertProjectReadable(req, id);
  const project = await getProjectById(id);

  res.status(200).json({
    status: "success",
    data: { project },
  });
}

export async function createProject(req: Request, res: Response) {
  await assertCreateProject(req, asBigInt(req.body.teamId));
  const project = await createProjectRecord(req.body);

  res.status(201).json({
    status: "success",
    data: { project },
  });
}

export async function deleteProject(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  await assertProjectReadable(req, id);
  await deleteProjectRecord(id);

  res.status(200).json({ status: "success", data: null });
}

export async function updateProject(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  await getProjectById(id);
  await assertProjectReadable(req, id);

  const body = req.body as Record<string, string>;
  if (body.teamId) {
    const newTeamId = asBigInt(body.teamId);
    if (!isAdminRole(req.user!.roles)) {
      if (!(await isMemberOfTeam(BigInt(req.user!.userId), newTeamId))) {
        throw new HttpError(403, "Forbidden");
      }
    }
  }

  const project = await updateProjectRecord(id, body);

  res.status(200).json({
    status: "success",
    data: { project },
  });
}
