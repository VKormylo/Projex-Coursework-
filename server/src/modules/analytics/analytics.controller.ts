import { Request, Response } from "express";

import { getAccessibleProjectIds } from "../../lib/access";
import { HttpError } from "../../middleware/error-handler";
import {
  fetchProjectTaskSummary,
  fetchSprintVelocity,
} from "./analytics.service";

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

export async function exportReportPdf(_req: Request, res: Response) {
  res.status(501).json({
    status: "fail",
    message:
      "PDF export is not implemented. Use GET /api/analytics/project-summary and /api/analytics/sprint-velocity for JSON data.",
  });
}
