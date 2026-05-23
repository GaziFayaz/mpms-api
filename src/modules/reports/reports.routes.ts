import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorize.js";

const router = Router();

router.get("/project/:id", authenticate, requireRole("admin", "manager"), reportsController.projectReport);
router.get("/user/:id", authenticate, requireRole("admin", "manager"), reportsController.userReport);
router.get("/overview", authenticate, requireRole("admin", "manager"), reportsController.overview);

export default router;
