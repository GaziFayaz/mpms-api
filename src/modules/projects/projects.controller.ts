import type { Request, Response, NextFunction } from "express";
import { projectsService } from "./projects.service.js";

export class ProjectsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectsService.list({
        status: req.query.status as string,
        client: req.query.client as string,
      });
      res.json({ data: projects });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.getById(req.params.id!);
      res.json({ data: project });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.create(req.body);
      res.status(201).json({ data: project });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.update(req.params.id!, req.body);
      res.json({ data: project });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await projectsService.delete(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const projectsController = new ProjectsController();
