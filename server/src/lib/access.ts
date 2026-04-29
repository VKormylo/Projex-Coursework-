import { Request } from "express";

import { prisma } from "./prisma";
import { HttpError } from "../middleware/error-handler";
import { AppRole } from "../types/auth";
import { Task } from "@prisma/client";

export function requestUserId(req: Request): bigint {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  return BigInt(req.user.userId);
}

export function isAdminRole(roles: AppRole[]) {
  return roles.includes("Admin");
}

export async function getAccessibleProjectIds(
  userId: bigint,
  roles: AppRole[],
): Promise<bigint[] | null> {
  if (isAdminRole(roles)) return null;

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = memberships.map((m) => m.teamId);

  if (teamIds.length === 0) return [];

  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  });

  return projects.map((p) => p.id);
}

export async function isMemberOfTeam(userId: bigint, teamId: bigint) {
  const row = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  return Boolean(row);
}

export async function assertProjectReadable(req: Request, projectId: bigint) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const roles = req.user.roles;

  if (isAdminRole(roles)) return;
  const ids = await getAccessibleProjectIds(userId, roles);

  if (!ids || ids.length === 0) throw new HttpError(403, "Forbidden");
  if (!ids.includes(projectId)) throw new HttpError(403, "Forbidden");
}

export async function assertProjectWritable(req: Request, projectId: bigint) {
  await assertProjectReadable(req, projectId);
}

export async function assertCreateProject(req: Request, teamId: bigint) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const roles = req.user.roles;

  if (isAdminRole(roles)) return;

  if (roles.includes("Project Manager")) {
    if (!(await isMemberOfTeam(userId, teamId))) {
      throw new HttpError(403, "Forbidden");
    }
    return;
  }

  throw new HttpError(403, "Forbidden");
}

export async function assertTeamManagedByPmOrAdmin(
  req: Request,
  teamId: bigint,
) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const roles = req.user.roles;

  if (isAdminRole(roles)) return;

  if (!roles.includes("Project Manager")) {
    throw new HttpError(403, "Forbidden");
  }

  if (!(await isMemberOfTeam(userId, teamId))) {
    throw new HttpError(403, "Forbidden");
  }
}

/** Developer may modify task only if assignee or (unassigned and reporter). */
export function developerCanWriteTask(
  userId: bigint,
  task: Pick<Task, "assigneeId" | "reporterId">,
) {
  if (task.assigneeId != null && task.assigneeId === userId) return true;
  if (task.assigneeId == null && task.reporterId === userId) return true;
  return false;
}

export async function assertTaskWritable(req: Request, task: Task) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const roles = req.user.roles;

  if (isAdminRole(roles)) return;

  if (roles.includes("Project Manager")) {
    await assertProjectWritable(req, task.projectId);
    return;
  }

  if (roles.includes("Developer")) {
    await assertProjectReadable(req, task.projectId);
    if (!developerCanWriteTask(userId, task)) {
      throw new HttpError(403, "Forbidden");
    }
    return;
  }

  throw new HttpError(403, "Forbidden");
}

export async function assertTaskReadable(req: Request, task: Task) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const roles = req.user.roles;

  if (isAdminRole(roles)) return;
  await assertProjectReadable(req, task.projectId);
}

export async function assertTaskCreate(
  req: Request,
  projectId: bigint,
  reporterId: bigint,
) {
  if (!req.user) throw new HttpError(401, "Not authenticated");

  const userId = BigInt(req.user.userId);
  const roles = req.user.roles;

  if (isAdminRole(roles)) {
    await assertProjectReadable(req, projectId);
    return;
  }

  if (roles.includes("Project Manager")) {
    await assertProjectWritable(req, projectId);
    return;
  }

  if (roles.includes("Developer")) {
    await assertProjectReadable(req, projectId);
    if (reporterId !== userId) throw new HttpError(403, "Forbidden");
    return;
  }

  throw new HttpError(403, "Forbidden");
}
