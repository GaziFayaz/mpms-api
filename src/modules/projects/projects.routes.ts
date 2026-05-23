import { Router } from "express";
import { projectsController } from "./projects.controller.js";
import { sprintsController } from "../sprints/sprints.controller.js";
import { validate } from "../../middleware/validate.js";
import { createProjectSchema, updateProjectSchema } from "./projects.validation.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorize.js";

const router = Router();

router.get("/", authenticate, projectsController.list);
router.get("/:id", authenticate, projectsController.getById);
router.get("/:projectId/sprints", authenticate, sprintsController.listByProject);
router.post("/", authenticate, requireRole("admin", "manager"), validate(createProjectSchema), projectsController.create);
router.put("/:id", authenticate, requireRole("admin", "manager"), validate(updateProjectSchema), projectsController.update);
router.delete("/:id", authenticate, requireRole("admin"), projectsController.remove);

export default router;
