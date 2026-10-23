import cloudinary from "../config/cloudinary.js";
import VideoRepository from "../repositories/VideoRepository.js";
import { successResponse, errorResponse, AppError } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

/**
 * GET /api/v1/videos/upload-signature  (protected)
 * Returns a signed Cloudinary upload signature so the browser can upload
 * directly to Cloudinary without routing the file bytes through the backend.
 */
export const getUploadSignature = asyncWrapper(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `videos/${req.dbUser.id}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_APISECRET
  );

  return successResponse(res, {
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD,
    apiKey: process.env.CLOUDINARY_APIKEY,
  });
});

const getThumbnailFromVideoUrl = (videoUrl) => {
  if (!videoUrl || typeof videoUrl !== "string") return "";
  return videoUrl.replace(/\.[^/.]+$/, ".jpg");
};

/**
 * POST /api/v1/videos  (protected)
 * Create a video project record after successful Cloudinary upload.
 */
export const createVideoProject = asyncWrapper(async (req, res) => {
  const {
    title,
    cloudinaryPublicId,
    cloudinaryUrl,
    thumbnailUrl,
    fileSize,
    duration,
    format,
  } = req.body;

  if (!cloudinaryPublicId || !cloudinaryUrl) {
    return errorResponse(res, "cloudinaryPublicId and cloudinaryUrl are required", 400);
  }

  const computedThumbnail = (thumbnailUrl && thumbnailUrl.trim() !== "")
    ? thumbnailUrl
    : getThumbnailFromVideoUrl(cloudinaryUrl);

  const project = await VideoRepository.create({
    userId: req.dbUser.id,
    title: title || "Untitled Project",
    cloudinaryPublicId,
    cloudinaryUrl,
    thumbnailUrl: computedThumbnail || "",
    fileSize: fileSize || 0,
    duration: duration || 0,
    format: format || "mp4",
    status: "pending",
  });

  return successResponse(res, { project }, "Video project created", 201);
});

/**
 * GET /api/v1/videos  (protected)
 * Get all video projects for the current user (paginated).
 */
export const getMyProjects = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    VideoRepository.findByUserId(req.dbUser.id, { skip, take: limit }),
    VideoRepository.countByUserId(req.dbUser.id),
  ]);

  const enrichedProjects = projects.map((p) => {
    let thumb = p.thumbnailUrl;
    if (!thumb || thumb.trim() === "") {
      thumb = getThumbnailFromVideoUrl(p.cloudinaryUrl);
    }

    if (p.analysis?.strategy?.scorecard) {
      const sc = p.analysis.strategy.scorecard;
      const pFit = Number(sc.platformFit) || Number(p.analysis?.platformRecommendations?.[0]?.score) || 85;
      const eng = Number(sc.engagementPotential) || 80;
      const sScore = Number(sc.seoScore) || 78;
      const vir = Number(sc.viralityPotential) || 70;
      const prof = Number(sc.professionalism) || 85;
      const read = Number(sc.readability) || 85;

      sc.overallReadiness = Math.round(
        pFit * 0.25 + eng * 0.25 + sScore * 0.15 + vir * 0.15 + prof * 0.10 + read * 0.10
      );
    }

    return {
      ...p,
      thumbnailUrl: thumb,
    };
  });

  return successResponse(res, {
    projects: enrichedProjects,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/v1/videos/:id  (protected)
 */
export const getProjectById = asyncWrapper(async (req, res) => {
  const project = await VideoRepository.findById(req.params.id);
  if (!project) return errorResponse(res, "Project not found", 404);
  if (project.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  if (!project.thumbnailUrl || project.thumbnailUrl.trim() === "") {
    project.thumbnailUrl = getThumbnailFromVideoUrl(project.cloudinaryUrl);
  }
  if (project.analysis?.strategy?.scorecard) {
    const sc = project.analysis.strategy.scorecard;
    const pFit = Number(sc.platformFit) || Number(project.analysis?.platformRecommendations?.[0]?.score) || 85;
    const eng = Number(sc.engagementPotential) || 80;
    const sScore = Number(sc.seoScore) || 78;
    const vir = Number(sc.viralityPotential) || 70;
    const prof = Number(sc.professionalism) || 85;
    const read = Number(sc.readability) || 85;

    sc.overallReadiness = Math.round(
      pFit * 0.25 + eng * 0.25 + sScore * 0.15 + vir * 0.15 + prof * 0.10 + read * 0.10
    );
  }
  return successResponse(res, { project });
});

/**
 * DELETE /api/v1/videos/:id  (protected)
 */
export const deleteProject = asyncWrapper(async (req, res) => {
  const project = await VideoRepository.findById(req.params.id);
  if (!project) return errorResponse(res, "Project not found", 404);
  if (project.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(project.cloudinaryPublicId, {
      resource_type: "video",
    });
  } catch (e) {
    console.warn("Cloudinary delete failed (non-fatal):", e.message);
  }

  await VideoRepository.delete(project.id);
  return successResponse(res, {}, "Project deleted");
});

/**
 * GET /api/v1/videos/signed/:publicId  (protected)
 * Generates a signed, time-limited URL for secure playback and access.
 */
export const getSignedUrl = asyncWrapper(async (req, res) => {
  const { publicId } = req.params;
  const project = await VideoRepository.findByPublicId(publicId);
  if (!project) return errorResponse(res, "Video project not found", 404);
  if (project.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  const expiresAt = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
  const signedUrl = cloudinary.url(publicId, {
    resource_type: "video",
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });

  return successResponse(res, { url: signedUrl, expiresAt });
});

