import { SprintStatus } from "@prisma/client";
import { Request, Response } from "express";

import { assertProjectWritable, getAccessibleProjectIds } from "../../lib/access";
import { asBigInt } from "../../lib/http";
import { HttpError } from "../../middleware/error-handler";
import {
  closeSprintById,
  createSprintRecord,
  deleteSprintRecord,
  getSprintById,
  getSprintsWhere,
  updateSprintRecord,
} from "./sprints.service";

export async function listSprints(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const projectIds = await getAccessibleProjectIds(userId, req.user.roles);
  const where = projectIds === null ? undefined : { projectId: { in: projectIds } };
  const sprints = await getSprintsWhere(where);

  res.status(200).json({
    status: "success",
    data: { sprints },
  });
}

export async function createSprint(req: Request, res: Response) {
  const projectId = asBigInt(req.body.projectId);
  await assertProjectWritable(req, projectId);

  const sprint = await createSprintRecord({
    projectId,
    name: req.body.name,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    goal: req.body.goal,
    status: req.body.status as SprintStatus,
  });

  res.status(201).json({
    status: "success",
    data: { sprint },
  });
}

export async function updateSprint(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const existing = await getSprintById(id);
  await assertProjectWritable(req, existing.projectId);

  const body = req.body as {
    name?: string;
    startDate?: string;
    endDate?: string;
    goal?: string | null;
    status?: SprintStatus;
  };

  const sprint = await updateSprintRecord(id, {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.startDate !== undefined ? { startDate: new Date(body.startDate) } : {}),
    ...(body.endDate !== undefined ? { endDate: new Date(body.endDate) } : {}),
    ...(body.goal !== undefined ? { goal: body.goal } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
  });

  res.status(200).json({
    status: "success",
    data: { sprint },
  });
}

export async function closeSprint(req: Request, res: Response) {
  const sprintId = asBigInt(req.params.id);
  const sprint = await getSprintById(sprintId);

  await assertProjectWritable(req, sprint.projectId);
  await closeSprintById(sprintId);

  res.status(200).json({
    status: "success",
    data: null,
  });
}

export async function deleteSprint(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const existing = await getSprintById(id);

  await assertProjectWritable(req, existing.projectId);
  await deleteSprintRecord(id);

  res.status(200).json({
    status: "success",
    data: null,
  });
}
