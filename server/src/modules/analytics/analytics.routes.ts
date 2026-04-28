import { Router } from "express";

import {
  exportReportPdf,
  projectTaskSummary,
  sprintVelocity,
} from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.get("/project-summary", projectTaskSummary);
analyticsRouter.get("/sprint-velocity", sprintVelocity);
analyticsRouter.get("/report.pdf", exportReportPdf);
