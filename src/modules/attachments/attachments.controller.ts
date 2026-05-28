import type { Request, Response, NextFunction } from "express";
import { attachmentsService } from "./attachments.service.js";

export class AttachmentsController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided", status: 400 });
        return;
      }
      const attachment = await attachmentsService.upload(req.params.id!, req.user!.userId, req.file);
      res.status(201).json({ data: attachment });
    } catch (err) {
      next(err);
    }
  }

  async listByTask(req: Request, res: Response, next: NextFunction) {
    try {
      const attachments = await attachmentsService.listByTask(req.params.id!);
      res.json({ data: attachments });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const attachment = await attachmentsService.getById(req.params.id!);
      res.json({ data: attachment });
    } catch (err) {
      next(err);
    }
  }

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const attachment = await attachmentsService.getById(req.params.id!);
      res.redirect(302, attachment.downloadUrl);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await attachmentsService.delete(req.params.id!, req.user!.userId, req.user!.role);
      res.json({ message: "Attachment deleted" });
    } catch (err) {
      next(err);
    }
  }
}

export const attachmentsController = new AttachmentsController();
