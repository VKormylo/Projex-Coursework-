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
      const target = Array.isArray(err.meta?.target)
        ? (err.meta?.target as string[]).join(", ")
        : String(err.meta?.target ?? "field");
      return { status: 409, message: `Unique constraint failed on: ${target}` };
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
