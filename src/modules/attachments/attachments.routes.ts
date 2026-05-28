import { Router } from "express";
import { attachmentsController } from "./attachments.controller.js";
import { authenticate } from "../../middleware/auth.js";

const attachmentRouter = Router();

attachmentRouter.get("/:id", authenticate, attachmentsController.getById);
attachmentRouter.get("/:id/download", authenticate, attachmentsController.download);
attachmentRouter.delete("/:id", authenticate, attachmentsController.remove);

export { attachmentRouter as attachmentRoutes };
