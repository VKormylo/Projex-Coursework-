import { Router } from "express";
import { SprintStatus } from "@prisma/client";
import { z } from "zod";

import { authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { closeSprint, createSprint, deleteSprint, listSprints, updateSprint } from "./sprints.controller";

const createSprintSchema = z
  .object({
    projectId: z.string().regex(/^\d+$/),
    name: z.string().min(2).max(120),
    startDate: z.string().date(),
    endDate: z.string().date(),
    goal: z.string().optional(),
    status: z.nativeEnum(SprintStatus),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "endDate must be greater than or equal to startDate",
    path: ["endDate"],
  });

const updateSprintSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    goal: z.string().nullable().optional(),
    status: z.nativeEnum(SprintStatus).optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate), {
    message: "endDate must be greater than or equal to startDate",
    path: ["endDate"],
  });

export const sprintsRouter = Router();

sprintsRouter.get("/", listSprints);

sprintsRouter.post("/", authorize("Admin", "Project Manager"), validateBody(createSprintSchema), createSprint);

sprintsRouter.patch("/:id", authorize("Admin", "Project Manager"), validateBody(updateSprintSchema), updateSprint);

sprintsRouter.post("/:id/close", authorize("Admin", "Project Manager"), closeSprint);

sprintsRouter.delete("/:id", authorize("Admin", "Project Manager"), deleteSprint);
