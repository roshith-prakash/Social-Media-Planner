import AnalysisService from "../services/AnalysisService.js";
import AnalysisRepository from "../repositories/AnalysisRepository.js";
import VideoRepository from "../repositories/VideoRepository.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import { registerClient, removeClient } from "../utils/sseEmitter.js";

/**
 * GET /api/v1/analysis/stream/:projectId
 * Establishes an SSE stream for real-time agent execution progress.
 */
export const streamAnalysis = asyncWrapper(async (req, res) => {
  const { projectId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ projectId, connectedAt: new Date().toISOString() })}\n\n`);

  registerClient(projectId, res);

  req.on("close", () => {
    removeClient(projectId, res);
  });
});


/**
 * POST /api/v1/analysis/analyze  (protected)
 * Triggers the full multi-agent analysis pipeline for a video project.
 */
export const analyzeVideo = asyncWrapper(async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return errorResponse(res, "projectId is required", 400);

  const project = await VideoRepository.findById(projectId);
  if (!project) return errorResponse(res, "Project not found", 404);
  if (project.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  if (project.status === "analyzing") {
    return errorResponse(res, "Analysis is already in progress", 409);
  }

  const userHints = {
    title: project.title,
    niche: req.dbUser.niche || "",
    brandVoice: req.dbUser.brandVoice || "professional",
  };

  // Mark project as analyzing immediately
  await VideoRepository.updateStatus(projectId, "analyzing");

  // Run the full 7-agent pipeline asynchronously in the background
  setImmediate(() => {
    AnalysisService.runFullAnalysis(
      projectId,
      req.dbUser.id,
      project.cloudinaryUrl,
      userHints
    ).catch((err) => {
      console.error(`[Analysis Error] Project ${projectId}:`, err.message || err);
    });
  });

  return res.status(202).json({
    success: true,
    data: {
      projectId,
      status: "analyzing",
      message: "Analysis started. Please poll video project status.",
    },
  });
});


// Helper to compute weighted readiness from individual sub-scores
const enrichAnalysisScorecard = (analysis) => {
  if (analysis?.strategy?.scorecard) {
    const sc = analysis.strategy.scorecard;
    const pFit = Number(sc.platformFit) || Number(analysis.platformRecommendations?.[0]?.score) || 85;
    const eng = Number(sc.engagementPotential) || 80;
    const sScore = Number(sc.seoScore) || 78;
    const vir = Number(sc.viralityPotential) || 70;
    const prof = Number(sc.professionalism) || 85;
    const read = Number(sc.readability) || 85;

    sc.overallReadiness = Math.round(
      pFit * 0.25 + eng * 0.25 + sScore * 0.15 + vir * 0.15 + prof * 0.10 + read * 0.10
    );
  }
  return analysis;
};

/**
 * GET /api/v1/analysis/:projectId  (protected)
 * Get the analysis for a specific video project.
 */
export const getAnalysis = asyncWrapper(async (req, res) => {
  const analysis = await AnalysisRepository.findByProjectId(req.params.projectId);
  if (!analysis) return errorResponse(res, "Analysis not found", 404);
  if (analysis.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  return successResponse(res, { analysis: enrichAnalysisScorecard(analysis) });
});

/**
 * GET /api/v1/analysis/id/:id  (protected)
 * Get analysis by its own ID.
 */
export const getAnalysisById = asyncWrapper(async (req, res) => {
  const analysis = await AnalysisRepository.findById(req.params.id);
  if (!analysis) return errorResponse(res, "Analysis not found", 404);
  if (analysis.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  return successResponse(res, { analysis: enrichAnalysisScorecard(analysis) });
});

/**
 * POST /api/v1/analysis/:id/regenerate  (protected)
 * Regenerate output for a specific agent.
 * Body: { agent: "content" | "quality" | "strategy" | "seo" | "platform" }
 */
export const regenerateAgent = asyncWrapper(async (req, res) => {
  const { agent } = req.body;
  if (!agent) return errorResponse(res, "agent name is required", 400);

  const result = await AnalysisService.regenerateAgent(
    req.params.id,
    agent,
    req.dbUser.id
  );

  return successResponse(res, result, `${agent} regenerated successfully`);
});
