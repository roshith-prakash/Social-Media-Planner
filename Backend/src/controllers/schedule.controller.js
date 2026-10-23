import prisma from "../config/prisma.js";
import agenda from "../config/agenda.js";
import { uploadVideoFromCDN, checkYouTubeVideoStatus } from "../services/YouTubeService.js";
import { uploadVideoToInstagram, checkInstagramMediaStatus } from "../services/InstagramService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

/**
 * POST /api/v1/schedule  (protected)
 * Create and schedule a social media post for future publication.
 */
export const schedulePost = asyncWrapper(async (req, res) => {
  const { projectId, draftId, platform, scheduledAt, content } = req.body;

  if (!projectId || !platform || !scheduledAt) {
    return errorResponse(res, "projectId, platform, and scheduledAt are required", 400);
  }

  const plat = platform.toLowerCase();
  if (plat !== "youtube" && plat !== "instagram") {
    return errorResponse(res, "Platform must be youtube or instagram", 400);
  }

  // Verify that user has the target platform connected
  if (plat === "youtube" && !req.dbUser.youtubeAccessToken) {
    return errorResponse(res, "YouTube is not connected. Please connect your YouTube account in Profile before scheduling.", 400);
  }
  if (plat === "instagram" && (!req.dbUser.instagramAccessToken || (!req.dbUser.instagramBusinessId && !req.dbUser.instagramId))) {
    return errorResponse(res, "Instagram is not connected. Please connect your Instagram Professional account in Profile before scheduling.", 400);
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return errorResponse(res, "Invalid scheduledAt date format", 400);
  }

  // Verify project ownership
  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
  });
  if (!project) return errorResponse(res, "Project not found", 404);
  if (project.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  // If draftId provided, verify draft
  let draftText = content || "";
  if (draftId) {
    const draft = await prisma.savedDraft.findUnique({ where: { id: draftId } });
    if (draft) {
      draftText = content || draft.editedContent;
    }
  }

  const post = await prisma.scheduledPost.create({
    data: {
      userId: req.dbUser.id,
      projectId,
      draftId: draftId || null,
      platform: platform.toLowerCase(),
      content: draftText,
      scheduledAt: scheduledDate,
      status: "pending",
    },
    include: {
      project: true,
      draft: true,
    },
  });

  // Schedule job via Agenda if active
  if (agenda) {
    try {
      await agenda.schedule(scheduledDate, "publish-post", {
        scheduledPostId: post.id,
      });
    } catch (schedErr) {
      console.warn("Agenda schedule notice:", schedErr.message);
    }
  }

  return successResponse(res, { post }, "Post scheduled successfully", 201);
});

/**
 * GET /api/v1/schedule  (protected)
 * List all scheduled posts for the current user.
 */
export const getScheduledPosts = asyncWrapper(async (req, res) => {
  const { sort = "desc" } = req.query;
  const sortDirection = sort.toLowerCase() === "asc" ? "asc" : "desc";

  const posts = await prisma.scheduledPost.findMany({
    where: { userId: req.dbUser.id },
    orderBy: [
      { scheduledAt: sortDirection },
      { createdAt: sortDirection },
    ],
    include: {
      project: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          status: true,
          cloudinaryUrl: true,
          youtubeVideoId: true,
          instagramMediaId: true,
        },
      },
      draft: true,
    },
  });

  return successResponse(res, { posts });
});

/**
 * DELETE /api/v1/schedule/:id  (protected)
 * Cancel a scheduled post.
 */
export const cancelScheduledPost = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const post = await prisma.scheduledPost.findUnique({ where: { id } });
  if (!post) return errorResponse(res, "Scheduled post not found", 404);
  if (post.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  const updated = await prisma.scheduledPost.update({
    where: { id },
    data: { status: "cancelled" },
  });

  // Cancel Agenda job if possible
  if (agenda) {
    try {
      await agenda.cancel({ "data.scheduledPostId": id });
    } catch (e) {
      console.warn("Agenda cancel notice:", e.message);
    }
  }

  return successResponse(res, { post: updated }, "Scheduled post cancelled");
});

/**
 * POST /api/v1/schedule/now  (protected)
 * Immediately publish a social media post to Instagram or YouTube.
 */
export const publishNowPost = asyncWrapper(async (req, res) => {
  const { projectId, draftId, platform, content } = req.body;

  if (!projectId || !platform) {
    return errorResponse(res, "projectId and platform are required", 400);
  }

  const plat = platform.toLowerCase();
  if (plat !== "youtube" && plat !== "instagram") {
    return errorResponse(res, "Platform must be youtube or instagram", 400);
  }

  // Verify that user has the target platform connected
  if (plat === "youtube" && !req.dbUser.youtubeAccessToken) {
    return errorResponse(res, "YouTube is not connected. Please connect your YouTube account in Profile before publishing.", 400);
  }
  if (plat === "instagram" && (!req.dbUser.instagramAccessToken || (!req.dbUser.instagramBusinessId && !req.dbUser.instagramId))) {
    return errorResponse(res, "Instagram is not connected. Please connect your Instagram Professional account in Profile before publishing.", 400);
  }

  // 1. Verify project ownership and media
  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
  });
  if (!project) return errorResponse(res, "Project not found", 404);
  if (project.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);
  if (!project.cloudinaryUrl) {
    return errorResponse(res, "Video has no media file to publish", 400);
  }

  // 2. Draft text
  let draftText = content || "";
  if (draftId) {
    const draft = await prisma.savedDraft.findUnique({ where: { id: draftId } });
    if (draft) {
      draftText = content || draft.editedContent;
    }
  }

  // 3. Create or update scheduledPost record as 'publishing'
  let post;
  if (req.body.postId) {
    post = await prisma.scheduledPost.update({
      where: { id: req.body.postId },
      data: { status: "publishing", errorMsg: null },
      include: { project: true, draft: true },
    });
  } else {
    post = await prisma.scheduledPost.create({
      data: {
        userId: req.dbUser.id,
        projectId,
        draftId: draftId || null,
        platform: plat,
        content: draftText,
        scheduledAt: new Date(),
        status: "publishing",
      },
      include: {
        project: true,
        draft: true,
      },
    });
  }

  try {
    let result = null;
    let externalId = null;
    if (plat === "youtube") {
      result = await uploadVideoFromCDN(
        req.dbUser,
        project.cloudinaryUrl,
        project.title || "Published Video",
        draftText
      );
      if (result?.id) {
        externalId = result.id;
        await prisma.videoProject.update({
          where: { id: projectId },
          data: { youtubeVideoId: result.id, status: "completed" },
        });
      }
    } else if (plat === "instagram") {
      result = await uploadVideoToInstagram(
        req.dbUser,
        project.cloudinaryUrl,
        draftText
      );
      if (result?.mediaId) {
        externalId = result.mediaId;
        await prisma.videoProject.update({
          where: { id: projectId },
          data: { instagramMediaId: result.mediaId, status: "completed" },
        });
      }
    }

    if (!externalId) {
      throw new Error(`Upload succeeded without returning a platform media ID for ${plat.toUpperCase()}.`);
    }

    const updatedPost = await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: "published", externalPostId: externalId, errorMsg: null },
    });

    return successResponse(res, { post: updatedPost, result }, `Successfully published to ${plat.toUpperCase()}!`, 200);
  } catch (err) {
    console.error(`❌ [PublishNow] Post ${post.id} failed:`, err.message);
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: "failed", errorMsg: err.message },
    });
    return errorResponse(res, `Failed to publish to ${plat}: ${err.message}`, 500);
  }
});

/**
 * POST /api/v1/schedule/:id/verify  (protected)
 * Check whether a published post is still active or has been deleted from YouTube / Instagram.
 */
export const verifyPostStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const post = await prisma.scheduledPost.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!post) return errorResponse(res, "Post not found", 404);
  if (post.userId !== req.dbUser.id) return errorResponse(res, "Unauthorized", 403);

  const targetId =
    post.externalPostId ||
    (post.platform === "youtube" ? post.project?.youtubeVideoId : post.project?.instagramMediaId);

  if (!targetId) {
    // If it was marked as published, but has no platform ID, it does not exist on the platform
    if (post.status === "published" || post.status === "deleted_on_platform") {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "deleted_on_platform",
          errorMsg: `Video was deleted or does not exist on ${post.platform.toUpperCase()}`,
        },
      });
      return successResponse(res, {
        postId: post.id,
        platform: post.platform,
        exists: false,
        isDeleted: true,
        status: "deleted",
        message: `Video was not found on ${post.platform.toUpperCase()}`,
      });
    }

    return successResponse(res, {
      postId: post.id,
      platform: post.platform,
      exists: false,
      isDeleted: false,
      message: "No external post ID found to verify",
    });
  }

  let statusResult = null;
  const plat = post.platform.toLowerCase();
  if (plat === "youtube") {
    statusResult = await checkYouTubeVideoStatus(req.dbUser, targetId);
  } else if (plat === "instagram") {
    statusResult = await checkInstagramMediaStatus(req.dbUser, targetId);
  } else {
    return errorResponse(res, "Unsupported platform", 400);
  }

  // If deleted on the platform, update post in database
  if (statusResult.isDeleted) {
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: {
        status: "deleted_on_platform",
        errorMsg: `Video was deleted off ${post.platform.toUpperCase()}`,
      },
    });
  } else if (statusResult.exists && post.status === "deleted_on_platform") {
    // Restored on platform
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: {
        status: "published",
        errorMsg: null,
      },
    });
  }

  return successResponse(
    res,
    {
      postId: post.id,
      platform: post.platform,
      externalId: targetId,
      ...statusResult,
    },
    statusResult.isDeleted
      ? `Confirmed: Video has been deleted from ${post.platform.toUpperCase()}`
      : `Video is live on ${post.platform.toUpperCase()}`
  );
});

/**
 * POST /api/v1/schedule/verify-all (protected)
 * Check whether published posts for the current user are still active or have been deleted off YouTube / Instagram.
 */
export const verifyAllPosts = asyncWrapper(async (req, res) => {
  const posts = await prisma.scheduledPost.findMany({
    where: {
      userId: req.dbUser.id,
      status: { in: ["published", "deleted_on_platform"] },
    },
    include: { project: true },
  });

  const results = await Promise.allSettled(
    posts.map(async (post) => {
      const plat = post.platform.toLowerCase();
      const targetId =
        post.externalPostId ||
        (plat === "youtube" ? post.project?.youtubeVideoId : post.project?.instagramMediaId);

      if (!targetId) {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "deleted_on_platform",
            errorMsg: `Video does not exist on ${post.platform.toUpperCase()} (missing platform ID)`,
          },
        });
        return {
          postId: post.id,
          platform: post.platform,
          exists: false,
          isDeleted: true,
          status: "deleted",
        };
      }

      let statusResult = null;
      if (plat === "youtube") {
        statusResult = await checkYouTubeVideoStatus(req.dbUser, targetId);
      } else if (plat === "instagram") {
        statusResult = await checkInstagramMediaStatus(req.dbUser, targetId);
      }

      if (statusResult?.isDeleted) {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "deleted_on_platform",
            errorMsg: `Video was deleted off ${post.platform.toUpperCase()}`,
          },
        });
      } else if (statusResult?.exists && post.status === "deleted_on_platform") {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "published",
            errorMsg: null,
          },
        });
      }

      return {
        postId: post.id,
        platform: post.platform,
        externalId: targetId,
        ...(statusResult || { exists: false, isDeleted: false }),
      };
    })
  );

  const formattedResults = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { postId: posts[i]?.id, error: r.reason?.message }
  );

  return successResponse(res, { results: formattedResults }, "All posts verified successfully", 200);
});

