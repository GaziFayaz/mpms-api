import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

const storage = multer.memoryStorage();

const allowedMimes = ["image/png", "image/jpeg", "image/gif", "application/pdf"];

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`) as any);
  }
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE },
});

export function uploadSingle(req: Request, res: Response, next: NextFunction) {
  multerUpload.single("file")(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message, status: 400 });
    }
    next();
  });
}
