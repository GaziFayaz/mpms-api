import type { Request, Response, NextFunction } from "express";
import { commentsService } from "./comments.service.js";

export class CommentsController {
  async listByTask(req: Request, res: Response, next: NextFunction) {
    try {
      const comments = await commentsService.listByTask(req.params.id!);
      res.json({ data: comments });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await commentsService.create(
        req.params.id!,
        req.user!.userId,
        req.body.body,
        req.body.parentId,
      );
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await commentsService.update(req.params.id!, req.user!.userId, req.body.body);
      res.json({ data: comment });
    } catch (err) {
      next(err);
    }
  }
}

export const commentsController = new CommentsController();
