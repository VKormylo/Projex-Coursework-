import { Router } from "express";

import {
  exportReportPdf,
  projectTaskSummary,
  sprintVelocity,
  sprintStats,
  reportData,
} from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.get("/project-summary", projectTaskSummary);
analyticsRouter.get("/sprint-velocity", sprintVelocity);
analyticsRouter.get("/sprint-stats", sprintStats);
analyticsRouter.get("/report-data", reportData);
analyticsRouter.get("/report.pdf", exportReportPdf);
