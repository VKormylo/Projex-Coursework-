import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function respond(res: Response, status: number, message: string) {
  const kind = status >= 400 && status < 500 ? "fail" : "error";
  return res.status(status).json({ status: kind, message });
}

function mapPrismaKnownError(err: Prisma.PrismaClientKnownRequestError): {
  status: number;
  message: string;
} {
  switch (err.code) {
    case "P2002": {
      const fields: string[] = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[])
        : [String(err.meta?.target ?? "")];

      const FIELD_MESSAGES: Record<string, string> = {
        email:      "Користувач з таким email вже існує",
        name:       "Запис з такою назвою вже існує",
        key:        "Проект з таким ключем вже існує",
        version:    "Реліз з такою версією вже існує для цього проєкту",
        sprint_id:  "До цього спринту вже прив'язаний реліз",
      };

      const msg = fields.reduce<string | null>((found, f) => {
        return found ?? (FIELD_MESSAGES[f] ?? null);
      }, null);

      return { status: 409, message: msg ?? "Запис з такими даними вже існує" };
    }
    case "P2003":
      return { status: 400, message: "Foreign key constraint failed" };
    case "P2025":
      return { status: 404, message: "Record not found" };
    default:
      return { status: 400, message: err.message.split("\n").pop() ?? err.message };
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    return respond(res, err.status, err.message);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaKnownError(err);
    return respond(res, mapped.status, mapped.message);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return respond(res, 400, "Invalid request payload");
  }

  if (err instanceof Error) {
    return respond(res, 500, err.message);
  }

  return respond(res, 500, "Unknown error");
}
