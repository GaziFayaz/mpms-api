import { Router } from "express";
import { tasksController } from "./tasks.controller.js";
import { validate } from "../../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, updateStatusSchema } from "./tasks.validation.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorize.js";

const router = Router();

router.get("/", authenticate, tasksController.list);
router.get("/:id", authenticate, tasksController.getById);
router.post("/", authenticate, requireRole("admin", "manager"), validate(createTaskSchema), tasksController.create);
router.put("/:id", authenticate, requireRole("admin", "manager"), validate(updateTaskSchema), tasksController.update);
router.delete("/:id", authenticate, requireRole("admin"), tasksController.remove);
router.patch("/:id/status", authenticate, validate(updateStatusSchema), tasksController.updateStatus);
router.post("/:id/subtasks", authenticate, tasksController.addSubtask);
router.patch("/:id/subtasks/:subId", authenticate, tasksController.toggleSubtask);

export default router;
