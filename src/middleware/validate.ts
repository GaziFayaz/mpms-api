import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/errors.js";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        next(AppError.badRequest("Validation failed", details));
      } else {
        next(err);
      }
    }
  };
}
