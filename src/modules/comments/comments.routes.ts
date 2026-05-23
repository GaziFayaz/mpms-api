import { Router } from "express";
import { commentsController } from "./comments.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.put("/:id", authenticate, commentsController.update);

export default router;
