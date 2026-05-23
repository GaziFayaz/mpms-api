import { Router } from "express";
import { sprintsController } from "./sprints.controller.js";
import { validate } from "../../middleware/validate.js";
import { createSprintSchema, updateSprintSchema } from "./sprints.validation.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorize.js";

const router = Router();

router.get("/:id", authenticate, sprintsController.getById);
router.post("/", authenticate, requireRole("admin", "manager"), validate(createSprintSchema), sprintsController.create);
router.put("/:id", authenticate, requireRole("admin", "manager"), validate(updateSprintSchema), sprintsController.update);
router.delete("/:id", authenticate, requireRole("admin"), sprintsController.remove);

export default router;
