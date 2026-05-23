import type { Request, Response, NextFunction } from "express";
import { timeLogsService } from "./timelogs.service.js";

export class TimeLogsController {
  async listByTask(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await timeLogsService.listByTask(req.params.id!);
      res.json({ data: logs });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await timeLogsService.create(req.params.id!, req.user!.userId, req.body);
      res.status(201).json({ data: log });
    } catch (err) {
      next(err);
    }
  }
}

export const timeLogsController = new TimeLogsController();
