import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

import { HttpError } from "./error-handler";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message).join("; ");
      return next(new HttpError(400, issues));
    }

    req.body = result.data;
    return next();
  };
}
