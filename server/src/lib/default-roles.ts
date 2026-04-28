import { prisma } from "./prisma";

const DEFAULT_ROLES = [
  { name: "Admin", description: "Full system access" },
  { name: "Project Manager", description: "Project/sprint/task management" },
  { name: "Developer", description: "Task execution role" },
] as const;

export async function ensureDefaultRoles() {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
  }
}
