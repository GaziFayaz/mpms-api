import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden("Insufficient permissions");
    }
    next();
  };
}
