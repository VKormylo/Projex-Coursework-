import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";

const teamInclude = {
  teamMember: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          position: true,
          isActive: true,
          role: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

export async function getTeamsWhere(where: Prisma.TeamWhereInput | undefined) {
  return prisma.team.findMany({
    where,
    include: teamInclude,
  });
}

export async function getTeamById(id: bigint) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: teamInclude,
  });
  if (!team) throw new HttpError(404, "Team not found");
  return team;
}

export async function createTeamRecord(data: { name: string }) {
  return prisma.team.create({
    data,
    include: teamInclude,
  });
}

export async function updateTeamRecord(id: bigint, name: string) {
  await getTeamById(id);
  return prisma.team.update({
    where: { id },
    data: { name },
    include: teamInclude,
  });
}

export async function upsertTeamMember(teamId: bigint, userId: bigint) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new HttpError(404, "Team not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found");

  return prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId } },
    create: { teamId, userId },
    update: {},
  });
}

export async function deleteTeamRecord(id: bigint) {
  await getTeamById(id);
  return prisma.team.delete({ where: { id } });
}

export async function removeTeamMember(teamId: bigint, userId: bigint) {
  await getTeamById(teamId);
  try {
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  } catch {
    throw new HttpError(404, "Member not found");
  }
}
