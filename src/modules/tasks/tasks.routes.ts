import { Router } from "express";
import { tasksController } from "./tasks.controller.js";
import { validate } from "../../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, updateStatusSchema } from "./tasks.validation.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorize.js";
import { commentsController } from "../comments/comments.controller.js";
import { attachmentsController } from "../attachments/attachments.controller.js";
import { timeLogsController } from "../timelogs/timelogs.controller.js";
import { uploadSingle } from "../../middleware/upload.js";

const router = Router();

router.get("/", authenticate, tasksController.list);
router.get("/:id", authenticate, tasksController.getById);
router.post("/", authenticate, requireRole("admin", "manager"), validate(createTaskSchema), tasksController.create);
router.put("/:id", authenticate, requireRole("admin", "manager"), validate(updateTaskSchema), tasksController.update);
router.delete("/:id", authenticate, requireRole("admin"), tasksController.remove);
router.patch("/:id/status", authenticate, validate(updateStatusSchema), tasksController.updateStatus);
router.post("/:id/subtasks", authenticate, tasksController.addSubtask);
router.patch("/:id/subtasks/:subId", authenticate, tasksController.toggleSubtask);
router.get("/:id/comments", authenticate, commentsController.listByTask);
router.post("/:id/comments", authenticate, commentsController.create);
router.post("/:id/attachments", authenticate, uploadSingle, attachmentsController.upload);
router.get("/:id/timelogs", authenticate, timeLogsController.listByTask);
router.post("/:id/timelogs", authenticate, timeLogsController.create);

export default router;
