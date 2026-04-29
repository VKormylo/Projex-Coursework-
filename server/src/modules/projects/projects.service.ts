import { Prisma, ProjectStatus } from "@prisma/client";

import { asBigInt } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";

const projectInclude = {
  sprints: true,
  tasks: true,
} as const;

export async function getProjectsWhere(where: Prisma.ProjectWhereInput | undefined) {
  return prisma.project.findMany({
    where,
    include: projectInclude,
  });
}

export async function getProjectById(id: bigint) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });

  if (!project) throw new HttpError(404, "Project not found");
  return project;
}

export async function createProjectRecord(payload: {
  teamId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  createdBy: string;
}) {
  const teamId = asBigInt(payload.teamId);
  const createdBy = asBigInt(payload.createdBy);

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new HttpError(404, "Team not found");

  const creator = await prisma.user.findUnique({ where: { id: createdBy } });
  if (!creator) throw new HttpError(404, "Creator user not found");

  return prisma.project.create({
    data: {
      teamId,
      name: payload.name,
      description: payload.description,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      status: payload.status,
      createdBy,
    },
    include: projectInclude,
  });
}

export async function deleteProjectRecord(id: bigint) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new HttpError(404, "Project not found");

  return prisma.project.delete({ where: { id } });
}

export async function updateProjectRecord(id: bigint, data: Record<string, string>) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new HttpError(404, "Project not found");

  return prisma.project.update({
    where: { id },
    data: {
      ...(data.teamId ? { teamId: asBigInt(data.teamId) } : {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
      ...(data.status ? { status: data.status as ProjectStatus } : {}),
      ...(data.createdBy ? { createdBy: asBigInt(data.createdBy) } : {}),
    },
    include: projectInclude,
  });
}
