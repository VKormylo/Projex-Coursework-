import { Router } from "express";
import { ProjectStatus } from "@prisma/client";
import { z } from "zod";

import { authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "./projects.controller";

const baseProjectSchema = z.object({
  teamId: z.string().regex(/^\d+$/),
  name: z.string().min(2).max(180),
  description: z.string().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: z.nativeEnum(ProjectStatus),
  createdBy: z.string().regex(/^\d+$/),
});

const datesAreValid = (data: {
  startDate?: string;
  endDate?: string;
}) =>
  !data.startDate ||
  !data.endDate ||
  new Date(data.endDate) >= new Date(data.startDate);

const createProjectSchema = baseProjectSchema.refine(datesAreValid, {
  message: "endDate must be greater than or equal to startDate",
  path: ["endDate"],
});

const updateProjectSchema = baseProjectSchema.partial().refine(datesAreValid, {
  message: "endDate must be greater than or equal to startDate",
  path: ["endDate"],
});

export const projectsRouter = Router();

projectsRouter.get("/", listProjects);

projectsRouter.get("/:id", getProject);

projectsRouter.post(
  "/",
  authorize("Admin", "Project Manager"),
  validateBody(createProjectSchema),
  createProject,
);

projectsRouter.patch(
  "/:id",
  authorize("Admin", "Project Manager"),
  validateBody(updateProjectSchema),
  updateProject,
);

projectsRouter.delete("/:id", authorize("Admin", "Project Manager"), deleteProject);
