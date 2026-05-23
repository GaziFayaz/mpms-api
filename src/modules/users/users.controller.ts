import type { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";

export class UsersController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.list();
      res.json({ data: users });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getById(req.params.id!);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.create(req.body);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.update(req.params.id!, req.body);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.delete(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.invite(req.params.id!);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
