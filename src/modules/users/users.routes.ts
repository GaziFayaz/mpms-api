import { Router } from "express";
import { usersController } from "./users.controller.js";
import { validate } from "../../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "./users.validation.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorize.js";

const router = Router();

router.get("/", authenticate, requireRole("admin", "manager"), usersController.list);
router.get("/:id", authenticate, requireRole("admin", "manager"), usersController.getById);
router.post("/", authenticate, requireRole("admin"), validate(createUserSchema), usersController.create);
router.put("/:id", authenticate, requireRole("admin"), validate(updateUserSchema), usersController.update);
router.delete("/:id", authenticate, requireRole("admin"), usersController.remove);
router.post("/:id/invite", authenticate, requireRole("admin"), usersController.invite);

export default router;
