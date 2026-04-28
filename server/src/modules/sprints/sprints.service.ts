import { Prisma, SprintStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";

const sprintInclude = { tasks: true } as const;

export async function getSprintsWhere(
  where: Prisma.SprintWhereInput | undefined,
) {
  return prisma.sprint.findMany({
    where,
    include: sprintInclude,
  });
}

export async function getSprintById(id: bigint) {
  const sprint = await prisma.sprint.findUnique({
    where: { id },
    include: sprintInclude,
  });
  if (!sprint) throw new HttpError(404, "Sprint not found");
  return sprint;
}

export async function createSprintRecord(data: {
  projectId: bigint;
  name: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
  status: SprintStatus;
}) {
  return prisma.sprint.create({
    data,
    include: sprintInclude,
  });
}

export async function updateSprintRecord(
  id: bigint,
  data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    goal?: string | null;
    status?: SprintStatus;
  },
) {
  const sprint = await prisma.sprint.findUnique({ where: { id } });
  if (!sprint) throw new HttpError(404, "Sprint not found");
  return prisma.sprint.update({
    where: { id },
    data,
    include: sprintInclude,
  });
}

export async function closeSprintById(sprintId: bigint) {
  return prisma.$executeRaw(Prisma.sql`CALL sp_close_sprint(${sprintId})`);
}

export async function deleteSprintRecord(id: bigint) {
  const sprint = await prisma.sprint.findUnique({ where: { id } });
  if (!sprint) throw new HttpError(404, "Sprint not found");
  if (sprint.status === "active") {
    throw new HttpError(400, "Cannot delete an active sprint. Close it first.");
  }
  if (sprint.status === "closed") {
    await prisma.task.deleteMany({ where: { sprintId: id } });
  }
  await prisma.sprint.delete({ where: { id } });
}
