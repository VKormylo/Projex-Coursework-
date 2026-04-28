import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

const releaseInclude = {
  sprint: {
    select: {
      id: true,
      name: true,
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  },
  project: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ReleaseInclude;

export async function getReleasesWhere(
  where: Prisma.ReleaseWhereInput | undefined,
) {
  return prisma.release.findMany({
    where,
    include: releaseInclude,
    orderBy: { releaseDate: "desc" },
  });
}

export async function createReleaseRecord(data: {
  projectId: bigint;
  sprintId: bigint | null;
  version: string;
  name: string;
  releaseDate: Date;
  notes: string | null;
}) {
  return prisma.release.create({
    data: {
      projectId: data.projectId,
      sprintId: data.sprintId,
      version: data.version,
      name: data.name,
      releaseDate: data.releaseDate,
      notes: data.notes,
    },
    include: releaseInclude,
  });
}

export async function updateReleaseRecord(
  id: bigint,
  data: {
    version?: string;
    name?: string;
    releaseDate?: Date;
    notes?: string | null;
    sprintId?: bigint | null;
  },
) {
  return prisma.release.update({
    where: { id },
    data,
    include: releaseInclude,
  });
}

export async function deleteReleaseRecord(id: bigint) {
  return prisma.release.delete({ where: { id } });
}

export async function createReleaseFromSprintRecord(
  sprintId: bigint,
  version: string,
) {
  return prisma.$executeRaw`CALL sp_create_release_from_sprint(${sprintId}, ${version})`;
}
