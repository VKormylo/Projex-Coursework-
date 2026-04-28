import { Router } from "express";
import { z } from "zod";

import { validateBody } from "../../middleware/validate";
import {
  createTaskComment,
  listTaskComments,
} from "./comments.controller";

const createCommentSchema = z.object({
  taskId: z.string().regex(/^\d+$/),
  body: z.string().min(1),
});

export const commentsRouter = Router();

commentsRouter.get("/task/:taskId", listTaskComments);

commentsRouter.post("/", validateBody(createCommentSchema), createTaskComment);
