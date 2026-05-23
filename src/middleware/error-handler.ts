import type { Request, Response, NextFunction } from "express";
import type { ApiError } from "../types/index.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const body: ApiError = {
      error: err.message,
      status: err.statusCode,
      details: err.details,
    };
    if (env.NODE_ENV === "development" && err.stack) {
      body.stack = err.stack;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  const body: ApiError = {
    error: "Internal server error",
    status: 500,
  };
  if (env.NODE_ENV === "development" && err.stack) {
    body.stack = err.stack;
  }
  res.status(500).json(body);
}
