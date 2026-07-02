import AnalysisService from "../services/AnalysisService.js";
import AnalysisRepository from "../repositories/AnalysisRepository.js";
import VideoRepository from "../repositories/VideoRepository.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

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

  // Run the full 7-agent pipeline
  const analysis = await AnalysisService.runFullAnalysis(
    projectId,
    req.dbUser.id,
    project.cloudinaryUrl,
    userHints
  );

  return successResponse(res, { analysis }, "Analysis complete", 201);
});

/**
 * GET /api/v1/analysis/:projectId  (protected)
 * Get the analysis for a specific video project.
 */
export const getAnalysis = asyncWrapper(async (req, res) => {
  const analysis = await AnalysisRepository.findByProjectId(req.params.projectId);
  if (!analysis) return errorResponse(res, "Analysis not found", 404);
  if (analysis.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  return successResponse(res, { analysis });
});

/**
 * GET /api/v1/analysis/id/:id  (protected)
 * Get analysis by its own ID.
 */
export const getAnalysisById = asyncWrapper(async (req, res) => {
  const analysis = await AnalysisRepository.findById(req.params.id);
  if (!analysis) return errorResponse(res, "Analysis not found", 404);
  if (analysis.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  return successResponse(res, { analysis });
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
