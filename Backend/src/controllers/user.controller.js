import UserRepository from "../repositories/UserRepository.js";
import cloudinary from "../config/cloudinary.js";
import { successResponse, errorResponse, AppError } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

/**
 * GET /api/v1/users/me  (protected)
 */
export const getMe = asyncWrapper(async (req, res) => {
  return successResponse(res, { user: req.dbUser });
});

/**
 * PUT /api/v1/users/me  (protected)
 * Update name, bio, niche, brandVoice, preferredPlatforms
 */
export const updateMe = asyncWrapper(async (req, res) => {
  const { name, bio, niche, brandVoice, preferredPlatforms } = req.body;
  const userId = req.dbUser.id;

  const updated = await UserRepository.update(userId, {
    ...(name !== undefined && { name }),
    ...(bio !== undefined && { bio }),
    ...(niche !== undefined && { niche }),
    ...(brandVoice !== undefined && { brandVoice }),
    ...(preferredPlatforms !== undefined && { preferredPlatforms }),
  });

  return successResponse(res, { user: updated }, "Profile updated");
});

/**
 * POST /api/v1/users/complete-onboarding  (protected)
 */
export const completeOnboarding = asyncWrapper(async (req, res) => {
  const { niche, brandVoice, preferredPlatforms } = req.body;
  const userId = req.dbUser.id;

  const updated = await UserRepository.update(userId, {
    niche: niche || "",
    brandVoice: brandVoice || "professional",
    preferredPlatforms: preferredPlatforms || [],
    onboardingCompleted: true,
  });

  return successResponse(res, { user: updated }, "Studio setup complete");
});

/**
 * POST /api/v1/users/check-username  (public - deprecated)
 */
export const checkUsername = asyncWrapper(async (req, res) => {
  return successResponse(res, { available: true });
});

/**
 * DELETE /api/v1/users/me  (protected)
 */
export const deleteMe = asyncWrapper(async (req, res) => {
  await UserRepository.delete(req.dbUser.id);
  return successResponse(res, {}, "Account deleted successfully");
});

/**
 * POST /api/v1/users/upload-avatar  (protected)
 * Cloudinary signed upload for profile avatar.
 */
export const uploadAvatar = asyncWrapper(async (req, res) => {
  if (!req.file) return errorResponse(res, "No file uploaded", 400);

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      req.file.path,
      { folder: "avatars", resource_type: "image" },
      (err, r) => (err ? reject(err) : resolve(r))
    );
  });

  const updated = await UserRepository.update(req.dbUser.id, {
    photoURL: result.secure_url,
  });

  return successResponse(res, { user: updated, photoURL: result.secure_url }, "Avatar updated");
});
