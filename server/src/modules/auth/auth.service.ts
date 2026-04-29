import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { ensureDefaultRoles } from "../../lib/default-roles";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";
import { AppRole } from "../../types/auth";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  position: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true, description: true } },
} as const;

function serializeUser(user: {
  id: bigint;
  fullName: string;
  email: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  role: { id: number; name: string; description: string | null } | null;
}) {
  return {
    id: user.id.toString(),
    fullName: user.fullName,
    email: user.email,
    position: user.position,
    isActive: user.isActive,
    createdAt: user.createdAt,
    role: user.role ?? null,
  };
}

async function buildToken(userId: bigint, email: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  const roles: AppRole[] = user?.role ? [user.role.name as AppRole] : [];

  return jwt.sign({ userId: userId.toString(), email, roles }, env.jwtSecret, {
    expiresIn: "12h",
  });
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: AppRole;
}) {
  const { fullName, email, password, role } = input;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw new HttpError(409, "Email already used");
  }

  let roleRecord = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRecord) {
    await ensureDefaultRoles();
    roleRecord = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRecord) {
      throw new HttpError(500, "Role not configured");
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      position: "",
      roleId: roleRecord.id,
    },
  });

  const newUser = await prisma.user.findUnique({ where: { email } });
  const token = await buildToken(newUser!.id, newUser!.email);

  return { token, userId: newUser!.id.toString() };
}

export async function loginUser(input: { email: string; password: string }) {
  const { email, password } = input;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }
  if (!user.isActive) {
    throw new HttpError(403, "Обліковий запис деактивовано. Зверніться до адміністратора.");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid credentials");
  }

  const token = await buildToken(user.id, user.email);
  return { token, userId: user.id.toString() };
}

export async function updateCurrentUser(
  userId: bigint,
  data: { fullName?: string; position?: string; email?: string },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
    },
    select: userSelect,
  });

  return serializeUser(user);
}

export async function getCurrentUser(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return serializeUser(user);
}
