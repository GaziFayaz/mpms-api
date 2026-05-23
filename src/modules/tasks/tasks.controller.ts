import type { Request, Response, NextFunction } from "express";
import { tasksService } from "./tasks.service.js";

export class TasksController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.list({
        projectId: req.query.project as string,
        sprintId: req.query.sprint as string,
        assignee: req.query.assignee as string,
        status: req.query.status as string,
        priority: req.query.priority as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.getById(req.params.id!);
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.create(req.body);
      res.status(201).json({ data: task });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.update(req.params.id!, req.body);
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await tasksService.delete(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const tasksController = new TasksController();
