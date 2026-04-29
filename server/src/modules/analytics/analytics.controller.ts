import { Request, Response } from "express";

import { getAccessibleProjectIds } from "../../lib/access";
import { HttpError } from "../../middleware/error-handler";
import {
  fetchProjectTaskSummary,
  fetchSprintVelocity,
  fetchSprintStats,
  findDefaultSprintId,
} from "./analytics.service";
import { fetchReportData } from "./analytics.report.service";

export async function projectTaskSummary(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const projectIds = await getAccessibleProjectIds(userId, req.user.roles);
  const summary = await fetchProjectTaskSummary(projectIds);

  res.status(200).json({
    status: "success",
    data: { summary },
  });
}

export async function sprintVelocity(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const projectIds = await getAccessibleProjectIds(userId, req.user.roles);
  const velocity = await fetchSprintVelocity(projectIds);

  res.status(200).json({
    status: "success",
    data: { velocity },
  });
}

export async function sprintStats(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const projectIds = await getAccessibleProjectIds(userId, req.user.roles);

  let sprintId: bigint;
  if (req.query.sprintId) {
    const parsed = parseInt(req.query.sprintId as string, 10);
    if (isNaN(parsed)) throw new HttpError(400, "Invalid sprintId");
    sprintId = BigInt(parsed);
  } else {
    const defaultId = await findDefaultSprintId(projectIds);
    if (!defaultId) return res.status(200).json({ status: "success", data: { stats: null } });
    sprintId = defaultId;
  }

  const stats = await fetchSprintStats(sprintId, projectIds);
  if (!stats) throw new HttpError(404, "Sprint not found or not accessible");

  res.status(200).json({ status: "success", data: { stats } });
}

export async function reportData(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const projectIds = await getAccessibleProjectIds(userId, req.user.roles);

  let sprintId: bigint;
  if (req.query.sprintId) {
    const parsed = parseInt(req.query.sprintId as string, 10);
    if (isNaN(parsed)) throw new HttpError(400, "Invalid sprintId");
    sprintId = BigInt(parsed);
  } else {
    const defaultId = await findDefaultSprintId(projectIds);
    if (!defaultId) return res.status(200).json({ status: "success", data: { report: null } });
    sprintId = defaultId;
  }

  const report = await fetchReportData(sprintId, projectIds);
  if (!report) throw new HttpError(404, "Sprint not found or not accessible");

  res.status(200).json({ status: "success", data: { report } });
}
