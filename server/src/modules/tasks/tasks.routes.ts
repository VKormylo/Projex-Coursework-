import { Router } from "express";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

import { authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  createTask,
  deleteTask,
  getTask,
  getTaskHistory,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "./tasks.controller";

export const createTaskSchema = z.object({
  projectId: z.string().regex(/^\d+$/),
  sprintId: z.string().regex(/^\d+$/).nullable().optional(),
  title: z.string().min(2).max(220),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  storyPoint: z.number().int().min(0).nullable().optional(),
  assigneeId: z.string().regex(/^\d+$/).nullable().optional(),
  reporterId: z.string().regex(/^\d+$/),
  dueDate: z.string().date().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).max(220).optional(),
  description: z.string().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  storyPoint: z.number().int().min(0).nullable().optional(),
  sprintId: z.string().regex(/^\d+$/).nullable().optional(),
  assigneeId: z.string().regex(/^\d+$/).nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
});

export const tasksRouter = Router();

tasksRouter.get("/", listTasks);

tasksRouter.get("/:id/history", getTaskHistory);

tasksRouter.get("/:id", getTask);

tasksRouter.post(
  "/",
  authorize("Admin", "Project Manager", "Developer"),
  validateBody(createTaskSchema),
  createTask,
);

tasksRouter.patch(
  "/:id",
  authorize("Admin", "Project Manager", "Developer"),
  validateBody(updateTaskSchema),
  updateTask,
);

tasksRouter.delete(
  "/:id",
  authorize("Admin", "Project Manager"),
  deleteTask,
);

tasksRouter.patch(
  "/:id/status",
  authorize("Admin", "Project Manager", "Developer"),
  validateBody(z.object({ status: z.nativeEnum(TaskStatus) })),
  updateTaskStatus,
);
