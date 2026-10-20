import AnalyticsService from "../services/AnalyticsService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

/**
 * GET /api/v1/analytics/:projectId  (protected)
 * Returns performance metrics and daily chart data for a video project.
 */
export const getProjectAnalytics = asyncWrapper(async (req, res) => {
  const { projectId } = req.params;
  try {
    const data = await AnalyticsService.getProjectAnalytics(projectId, req.dbUser.id);
    return successResponse(res, { analytics: data });
  } catch (err) {
    if (err.message === "Project not found") return errorResponse(res, err.message, 404);
    if (err.message === "Unauthorized") return errorResponse(res, err.message, 403);
    return errorResponse(res, err.message, 500);
  }
});
