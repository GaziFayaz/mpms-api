import type { Request, Response, NextFunction } from "express";
import { sprintsService } from "./sprints.service.js";

export class SprintsController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sprint = await sprintsService.getById(req.params.id!);
      res.json({ data: sprint });
    } catch (err) {
      next(err);
    }
  }

  async listByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const sprints = await sprintsService.listByProject(req.params.projectId!);
      res.json({ data: sprints });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sprint = await sprintsService.create(req.body);
      res.status(201).json({ data: sprint });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const sprint = await sprintsService.update(req.params.id!, req.body);
      res.json({ data: sprint });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await sprintsService.delete(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const sprintsController = new SprintsController();
