import DraftRepository from "../repositories/DraftRepository.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

/**
 * POST /api/v1/drafts  (protected)
 * Save a new draft.
 */
export const createDraft = asyncWrapper(async (req, res) => {
  const {
    analysisId,
    projectId,
    platform,
    contentType,
    label,
    originalContent,
    editedContent,
  } = req.body;

  if (!analysisId || !projectId || !platform || !contentType || !editedContent) {
    return errorResponse(res, "analysisId, projectId, platform, contentType, editedContent are required", 400);
  }

  const draft = await DraftRepository.create({
    userId: req.dbUser.id,
    analysisId,
    projectId,
    platform,
    contentType,
    label: label || "",
    originalContent: originalContent || "",
    editedContent,
  });

  return successResponse(res, { draft }, "Draft saved", 201);
});

/**
 * GET /api/v1/drafts  (protected)
 * Get all drafts for current user.
 */
export const getMyDrafts = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    DraftRepository.findByUserId(req.dbUser.id, { skip, take: limit }),
    DraftRepository.countByUserId(req.dbUser.id),
  ]);

  return successResponse(res, {
    drafts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/v1/drafts/:id  (protected)
 */
export const getDraftById = asyncWrapper(async (req, res) => {
  const draft = await DraftRepository.findById(req.params.id);
  if (!draft) return errorResponse(res, "Draft not found", 404);
  if (draft.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  return successResponse(res, { draft });
});

/**
 * PUT /api/v1/drafts/:id  (protected)
 * Update draft content.
 */
export const updateDraft = asyncWrapper(async (req, res) => {
  const draft = await DraftRepository.findById(req.params.id);
  if (!draft) return errorResponse(res, "Draft not found", 404);
  if (draft.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  const { editedContent, label } = req.body;
  const updated = await DraftRepository.update(draft.id, {
    ...(editedContent !== undefined && { editedContent }),
    ...(label !== undefined && { label }),
  });

  return successResponse(res, { draft: updated }, "Draft updated");
});

/**
 * PATCH /api/v1/drafts/:id/favorite  (protected)
 * Toggle favorite status.
 */
export const toggleFavorite = asyncWrapper(async (req, res) => {
  const draft = await DraftRepository.findById(req.params.id);
  if (!draft) return errorResponse(res, "Draft not found", 404);
  if (draft.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  const updated = await DraftRepository.toggleFavorite(draft.id, draft.isFavorited);
  return successResponse(res, { draft: updated }, "Favorite toggled");
});

/**
 * DELETE /api/v1/drafts/:id  (protected)
 */
export const deleteDraft = asyncWrapper(async (req, res) => {
  const draft = await DraftRepository.findById(req.params.id);
  if (!draft) return errorResponse(res, "Draft not found", 404);
  if (draft.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  await DraftRepository.delete(draft.id);
  return successResponse(res, {}, "Draft deleted");
});
