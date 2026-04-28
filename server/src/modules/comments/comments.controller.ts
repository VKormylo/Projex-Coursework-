import { Request, Response } from "express";

import { assertTaskReadable } from "../../lib/access";
import { asBigInt } from "../../lib/http";
import { HttpError } from "../../middleware/error-handler";
import { getTaskById } from "../tasks/tasks.service";
import { createCommentRecord, getCommentsByTask } from "./comments.service";

export async function listTaskComments(req: Request, res: Response) {
  const taskId = asBigInt(req.params.taskId);
  const task = await getTaskById(taskId);
  await assertTaskReadable(req, task);
  const comments = await getCommentsByTask(taskId);
  res.status(200).json({
    status: "success",
    data: { comments },
  });
}

export async function createTaskComment(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  const taskId = asBigInt(req.body.taskId);
  const task = await getTaskById(taskId);
  await assertTaskReadable(req, task);
  const authorId = BigInt(req.user.userId);
  const comment = await createCommentRecord({
    taskId,
    authorId,
    body: req.body.body,
  });
  res.status(201).json({
    status: "success",
    data: { comment },
  });
}
