import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";

const commentInclude = {
  author: { select: { id: true, fullName: true } },
} as const;

export async function getCommentsByTask(taskId: bigint) {
  return prisma.taskComment.findMany({
    where: { taskId },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function createCommentRecord(data: {
  taskId: bigint;
  authorId: bigint;
  body: string;
}) {
  const task = await prisma.task.findUnique({ where: { id: data.taskId } });
  if (!task) throw new HttpError(404, "Task not found");

  const author = await prisma.user.findUnique({ where: { id: data.authorId } });
  if (!author) throw new HttpError(404, "Author not found");

  return prisma.taskComment.create({ data, include: commentInclude });
}
