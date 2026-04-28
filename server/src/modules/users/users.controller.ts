import { Request, Response } from "express";

import { asBigInt } from "../../lib/http";
import { HttpError } from "../../middleware/error-handler";
import {
  assignRole,
  createUserRecord,
  getRoles,
  getUsers,
  getUserByEmail,
  patchUserRecord,
} from "./users.service";

export async function listUsers(_req: Request, res: Response) {
  const users = await getUsers();
  res.status(200).json({
    status: "success",
    data: { users },
  });
}

export async function createUser(req: Request, res: Response) {
  const user = await createUserRecord(req.body);
  res.status(201).json({
    status: "success",
    data: { user },
  });
}

export async function findUserByEmail(req: Request, res: Response) {
  const { email } = req.query as { email?: string };
  if (!email) throw new HttpError(400, "Email query param required");
  const user = await getUserByEmail(email);
  if (!user) throw new HttpError(404, "User not found");
  res.status(200).json({ status: "success", data: { user } });
}

export async function assignRoleToUser(req: Request, res: Response) {
  const userId = asBigInt(req.params.id);
  const user = await assignRole(userId, req.body.roleId);
  res.status(200).json({
    status: "success",
    data: { user },
  });
}

export async function updateUser(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const user = await patchUserRecord(id, req.body);
  res.status(200).json({
    status: "success",
    data: { user },
  });
}

export async function listRoles(_req: Request, res: Response) {
  const roles = await getRoles();
  res.status(200).json({
    status: "success",
    data: { roles },
  });
}
