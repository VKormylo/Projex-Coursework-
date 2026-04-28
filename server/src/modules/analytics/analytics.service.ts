import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export async function fetchProjectTaskSummary(projectIds: bigint[] | null) {
  if (projectIds !== null && projectIds.length === 0) return [];
  if (projectIds === null) {
    return prisma.$queryRaw<
      Record<string, unknown>[]
    >`SELECT * FROM vw_project_task_summary`;
  }
  return prisma.$queryRaw<
    Record<string, unknown>[]
  >`SELECT * FROM vw_project_task_summary WHERE project_id IN (${Prisma.join(projectIds)})`;
}

export async function fetchSprintVelocity(projectIds: bigint[] | null) {
  if (projectIds !== null && projectIds.length === 0) return [];
  if (projectIds === null) {
    return prisma.$queryRaw<
      Record<string, unknown>[]
    >`SELECT * FROM vw_sprint_velocity`;
  }
  return prisma.$queryRaw<
    Record<string, unknown>[]
  >`SELECT * FROM vw_sprint_velocity WHERE project_id IN (${Prisma.join(projectIds)})`;
}
