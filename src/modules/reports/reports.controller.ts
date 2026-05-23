import type { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service.js";

export class ReportsController {
  async projectReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.projectReport(req.params.id!);
      res.json({ data: report });
    } catch (err) {
      next(err);
    }
  }

  async userReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.userReport(req.params.id!);
      res.json({ data: report });
    } catch (err) {
      next(err);
    }
  }

  async overview(_req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.overview();
      res.json({ data: report });
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
