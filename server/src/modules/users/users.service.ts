import bcrypt from "bcrypt";

import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";

const userPublicSelect = {
  id: true,
  fullName: true,
  email: true,
  position: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true, description: true } },
  _count: { select: { assigned: true } },
} as const;

export async function getUsers() {
  return prisma.user.findMany({ select: userPublicSelect });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, select: userPublicSelect });
}

export async function createUserRecord(data: {
  fullName: string;
  email: string;
  password: string;
  position: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new HttpError(409, "Email already used");
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      position: data.position,
    },
    select: userPublicSelect,
  });
}

export async function assignRole(userId: bigint, roleId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found");

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new HttpError(404, "Role not found");

  return prisma.user.update({
    where: { id: userId },
    data: { roleId },
    select: userPublicSelect,
  });
}

export async function getRoles() {
  return prisma.role.findMany();
}

export async function patchUserRecord(
  id: bigint,
  data: {
    fullName?: string;
    position?: string;
    email?: string;
    isActive?: boolean;
  },
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, "User not found");
  if (data.email !== undefined && data.email !== user.email) {
    const taken = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (taken) throw new HttpError(409, "Email already used");
  }
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    select: userPublicSelect,
  });
}
