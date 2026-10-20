import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import { analysisLimiter } from "../middleware/rateLimiter.js";
import {
  analyzeVideo,
  getAnalysis,
  getAnalysisById,
  regenerateAgent,
  streamAnalysis,
} from "../controllers/analysis.controller.js";
import { validate } from "../middleware/validate.js";
import { analyzeSchema, regenerateSchema } from "../schemas/analysis.schema.js";

const router = Router();

// SSE real-time streaming endpoint (unauthenticated to allow browser EventSource)
router.get("/stream/:projectId", streamAnalysis);

// Authenticated routes below
router.use(authenticate);

// Trigger full analysis (rate-limited + validated)
router.post("/analyze", analysisLimiter, validate(analyzeSchema), analyzeVideo);

// Fetch analysis
router.get("/project/:projectId", getAnalysis);
router.get("/:id", getAnalysisById);

// Regenerate a specific agent's output
router.post("/:id/regenerate", validate(regenerateSchema), regenerateAgent);

export default router;

