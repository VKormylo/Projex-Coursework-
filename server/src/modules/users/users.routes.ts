import { Router } from "express";
import { z } from "zod";

import { authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  assignRoleToUser,
  createUser,
  findUserByEmail,
  listRoles,
  listUsers,
  updateUser,
} from "./users.controller";

const createUserSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  position: z.string().min(2).max(100),
});

const assignRoleSchema = z.object({
  roleId: z.number().int().positive(),
});

const patchUserSchema = z
  .object({
    fullName: z.string().min(2).max(150).optional(),
    position: z.string().max(100).optional(),
    email: z.string().email().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.fullName !== undefined ||
      d.position !== undefined ||
      d.email !== undefined ||
      d.isActive !== undefined,
    { message: "At least one field is required" },
  );

export const usersRouter = Router();

usersRouter.get("/", authorize("Admin"), listUsers);
usersRouter.get(
  "/by-email",
  authorize("Admin", "Project Manager"),
  findUserByEmail,
);

usersRouter.post(
  "/",
  authorize("Admin"),
  validateBody(createUserSchema),
  createUser,
);

usersRouter.post(
  "/:id/roles",
  authorize("Admin"),
  validateBody(assignRoleSchema),
  assignRoleToUser,
);

usersRouter.patch(
  "/:id",
  authorize("Admin"),
  validateBody(patchUserSchema),
  updateUser,
);

export const rolesRouter = Router();

rolesRouter.get("/", listRoles);
