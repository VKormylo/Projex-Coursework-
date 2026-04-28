import { NextFunction, Request, Response } from "express";

import { HttpError } from "../../middleware/error-handler";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
} from "./auth.service";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await registerUser(req.body);
    res.status(201).json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await loginUser(req.body);
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, "Not authenticated");
    }
    const user = await getCurrentUser(BigInt(req.user.userId));
    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function patchMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new HttpError(401, "Not authenticated");
    }
    const user = await updateCurrentUser(BigInt(req.user.userId), req.body);
    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
