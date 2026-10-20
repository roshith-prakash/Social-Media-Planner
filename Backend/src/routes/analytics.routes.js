import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import { getProjectAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.use(authenticate);

router.get("/:projectId", getProjectAnalytics);

export default router;
