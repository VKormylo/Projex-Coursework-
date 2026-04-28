import { prisma } from "../../lib/prisma";

export async function clearDatabase(keepUserId: bigint) {
  await prisma.$executeRaw`TRUNCATE TABLE task_history, task_comments, tasks, releases, sprints, projects, team_members, teams RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`DELETE FROM users WHERE id != ${keepUserId}`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))`;
}
