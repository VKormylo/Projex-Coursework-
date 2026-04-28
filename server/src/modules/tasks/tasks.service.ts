import {
  Prisma,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";

import { asBigInt } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "in_review", "done", "blocked"];

const statusFlow: Record<TaskStatus, TaskStatus[]> = {
  todo: ALL_STATUSES.filter((s) => s !== "todo"),
  in_progress: ALL_STATUSES.filter((s) => s !== "in_progress"),
  in_review: ALL_STATUSES.filter((s) => s !== "in_review"),
  done: ALL_STATUSES.filter((s) => s !== "done"),
  blocked: ALL_STATUSES.filter((s) => s !== "blocked"),
};

const taskInclude = {
  comments: {
    include: {
      author: { select: { id: true, fullName: true } },
    },
    orderBy: { id: "asc" as const },
  },
  assignee: { select: { id: true, fullName: true } },
  reporter: { select: { id: true, fullName: true } },
  project: { select: { id: true, name: true } },
  sprint: { select: { id: true, name: true } },
} as const;

export async function getTasksWhere(where: Prisma.TaskWhereInput) {
  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: { id: "asc" },
  });
}

export async function getTaskById(id: bigint) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });
  if (!task) throw new HttpError(404, "Task not found");
  return task;
}

export async function getTaskHistoryRecords(taskId: bigint) {
  return prisma.taskHistory.findMany({
    where: { taskId },
    orderBy: { changedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function createTaskRecord(body: {
  projectId: string;
  sprintId?: string | null;
  title: string;
  description?: string;
  priority: string;
  status: TaskStatus;
  storyPoint?: number;
  assigneeId?: string | null;
  reporterId: string;
  dueDate?: string;
}) {
  return prisma.task.create({
    data: {
      projectId: asBigInt(body.projectId),
      sprintId: body.sprintId ? asBigInt(body.sprintId) : null,
      title: body.title,
      description: body.description,
      priority: body.priority as TaskPriority,
      status: body.status,
      storyPoint: body.storyPoint,
      assigneeId: body.assigneeId ? asBigInt(body.assigneeId) : null,
      reporterId: asBigInt(body.reporterId),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
    include: taskInclude,
  });
}

export async function updateTaskRecord(
  id: bigint,
  body: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    storyPoint?: number | null;
    sprintId?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
  },
) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new HttpError(404, "Task not found");

  return prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.priority !== undefined ? { priority: body.priority } : {}),
      ...(body.storyPoint !== undefined ? { storyPoint: body.storyPoint } : {}),
      ...(body.sprintId !== undefined
        ? { sprintId: body.sprintId ? asBigInt(body.sprintId) : null }
        : {}),
      ...(body.assigneeId !== undefined
        ? { assigneeId: body.assigneeId ? asBigInt(body.assigneeId) : null }
        : {}),
      ...(body.dueDate !== undefined
        ? { dueDate: body.dueDate ? new Date(body.dueDate) : null }
        : {}),
    },
    include: taskInclude,
  });
}

export async function deleteTaskRecord(id: bigint) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new HttpError(404, "Task not found");
  await prisma.task.delete({ where: { id } });
}

export async function updateTaskStatusRecord(
  id: bigint,
  nextStatus: TaskStatus,
  actorUserId?: string,
) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new HttpError(404, "Task not found");

  if (!statusFlow[task.status].includes(nextStatus)) {
    throw new HttpError(
      400,
      `Invalid transition: ${task.status} -> ${nextStatus}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${actorUserId ?? ""}, true)`;
    return tx.task.update({
      where: { id },
      data: { status: nextStatus },
      include: taskInclude,
    });
  });
}
