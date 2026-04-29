import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppRole, JwtPayload } from "../types/auth";
import { HttpError } from "./error-handler";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing or invalid Authorization header"));
  }

  const token = header.split(" ")[1];

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }

  let userIdBig: bigint;
  try {
    userIdBig = BigInt(payload.userId);
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }

  const user = await prisma.user.findUnique({
    where: { id: userIdBig },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return next(new HttpError(401, "Account is inactive or not found"));
  }

  const roles: AppRole[] = user.role ? [user.role.name as AppRole] : [];

  req.user = {
    userId: payload.userId,
    email: user.email,
    roles,
  };

  return next();
}

export function authorize(...roles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Not authenticated"));
    }

    const hasRole = req.user.roles.some((r) => roles.includes(r));

    if (!hasRole) {
      return next(new HttpError(403, "Forbidden"));
    }

    return next();
  };
}
