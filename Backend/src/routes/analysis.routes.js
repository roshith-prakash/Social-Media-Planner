import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import { analysisLimiter } from "../middleware/rateLimiter.js";
import {
  analyzeVideo,
  getAnalysis,
  getAnalysisById,
  regenerateAgent,
} from "../controllers/analysis.controller.js";

const router = Router();

router.use(authenticate);

// Trigger full analysis (rate-limited)
router.post("/analyze", analysisLimiter, analyzeVideo);

// Fetch analysis
router.get("/project/:projectId", getAnalysis);
router.get("/:id", getAnalysisById);

// Regenerate a specific agent's output
router.post("/:id/regenerate", regenerateAgent);

export default router;
