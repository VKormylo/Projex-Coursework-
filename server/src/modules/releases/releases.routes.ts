import { Router } from "express";
import { z } from "zod";

import { authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  createRelease,
  createReleaseFromSprint,
  deleteRelease,
  getRelease,
  listReleases,
  updateRelease,
} from "./releases.controller";

const createReleaseFromSprintSchema = z.object({
  sprintId: z.string().regex(/^\d+$/),
  version: z.string().min(1).max(30),
});

const createReleaseSchema = z.object({
  projectId: z.string().regex(/^\d+$/),
  sprintId: z.string().regex(/^\d+$/).optional().nullable(),
  version: z.string().min(1).max(30),
  name: z.string().min(1).max(180),
  releaseDate: z.string(),
  notes: z.string().optional().nullable(),
});

const updateReleaseSchema = z.object({
  version: z.string().min(1).max(30).optional(),
  name: z.string().min(1).max(180).optional(),
  releaseDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  sprintId: z.string().regex(/^\d+$/).optional().nullable(),
  status: z.enum(["planned", "completed"]).optional(),
});

export const releasesRouter = Router();

releasesRouter.get("/", listReleases);
releasesRouter.get("/:id", getRelease);

releasesRouter.post(
  "/",
  authorize("Admin", "Project Manager"),
  validateBody(createReleaseSchema),
  createRelease,
);

releasesRouter.patch(
  "/:id",
  authorize("Admin", "Project Manager"),
  validateBody(updateReleaseSchema),
  updateRelease,
);

releasesRouter.delete(
  "/:id",
  authorize("Admin", "Project Manager"),
  deleteRelease,
);

releasesRouter.post(
  "/from-sprint",
  authorize("Admin", "Project Manager"),
  validateBody(createReleaseFromSprintSchema),
  createReleaseFromSprint,
);
