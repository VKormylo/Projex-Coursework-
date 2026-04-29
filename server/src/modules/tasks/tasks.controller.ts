import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { Request, Response } from "express";

import { assertTaskCreate, assertTaskReadable, assertTaskWritable, getAccessibleProjectIds } from "../../lib/access";
import { asBigInt } from "../../lib/http";
import { HttpError } from "../../middleware/error-handler";
import {
  createTaskRecord,
  deleteTaskRecord,
  getTaskById,
  getTaskHistoryRecords,
  getTasksWhere,
  updateTaskRecord,
  updateTaskStatusRecord,
} from "./tasks.service";

export async function listTasks(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  const userId = BigInt(req.user.userId);
  const accessible = await getAccessibleProjectIds(userId, req.user.roles);

  const where: Prisma.TaskWhereInput = {};
  const { projectId, sprintId, status, assigneeId, priority, q } = req.query;

  if (projectId) where.projectId = asBigInt(String(projectId));
  if (sprintId) where.sprintId = asBigInt(String(sprintId));
  if (status) where.status = String(status) as TaskStatus;
  if (assigneeId) where.assigneeId = asBigInt(String(assigneeId));
  if (priority) where.priority = String(priority) as TaskPriority;

  if (accessible !== null) {
    if (accessible.length === 0) {
      return res.status(200).json({ status: "success", data: { tasks: [] } });
    }

    const pid = where.projectId as bigint | undefined;
    if (pid !== undefined) {
      if (!accessible.includes(pid)) {
        throw new HttpError(403, "Forbidden");
      }
    } else {
      where.projectId = { in: accessible };
    }
  }

  if (q && typeof q === "string" && q.trim()) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  const tasks = await getTasksWhere(where);
  res.status(200).json({
    status: "success",
    data: { tasks },
  });
}

export async function getTask(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const task = await getTaskById(id);
  await assertTaskReadable(req, task);

  res.status(200).json({
    status: "success",
    data: { task },
  });
}

export async function getTaskHistory(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const task = await getTaskById(id);
  await assertTaskReadable(req, task);
  const history = await getTaskHistoryRecords(id);

  res.status(200).json({
    status: "success",
    data: { history },
  });
}

export async function createTask(req: Request, res: Response) {
  const reporterId = asBigInt(req.body.reporterId);
  await assertTaskCreate(req, asBigInt(req.body.projectId), reporterId);
  const task = await createTaskRecord(req.body);

  res.status(201).json({
    status: "success",
    data: { task },
  });
}

export async function updateTask(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const existing = await getTaskById(id);
  await assertTaskWritable(req, existing);

  const body = req.body as {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    storyPoint?: number | null;
    sprintId?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
  };

  const task = await updateTaskRecord(id, body);

  res.status(200).json({
    status: "success",
    data: { task },
  });
}

export async function deleteTask(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const existing = await getTaskById(id);

  await assertTaskWritable(req, existing);
  await deleteTaskRecord(id);

  res.status(200).json({
    status: "success",
    data: null,
  });
}

export async function updateTaskStatus(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const existing = await getTaskById(id);

  await assertTaskWritable(req, existing);

  const nextStatus = req.body.status as TaskStatus;
  const task = await updateTaskStatusRecord(id, nextStatus, req.user?.userId);

  res.status(200).json({
    status: "success",
    data: { task },
  });
}
