import agenda from "../config/agenda.js";
import { uploadVideoFromCDN } from "../services/YouTubeService.js";
import { uploadVideoToInstagram } from "../services/InstagramService.js";
import prisma from "../config/prisma.js";

if (agenda) {
  agenda.define(
    "publish-post",
    { lockLifetime: 300000, concurrency: 1 }, // 5-minute lock so video processing doesn't trigger duplicate runs
    async (job) => {
      const { scheduledPostId } = job.attrs.data || {};
      if (!scheduledPostId) return;

      // 1. Atomically claim the post from 'pending' to 'publishing'
      // This strictly guarantees exactly-once execution even if Agenda retries
      const claim = await prisma.scheduledPost.updateMany({
        where: { id: scheduledPostId, status: "pending" },
        data: { status: "publishing" },
      });

      if (claim.count === 0) {
        console.log(`[Schedule] Post ${scheduledPostId} is already claimed, published, or not pending. Skipping duplicate execution.`);
        return;
      }

      const post = await prisma.scheduledPost.findUnique({
        where: { id: scheduledPostId },
        include: { project: true, draft: true, user: true },
      });

      if (!post || !post.project) {
        console.log(`[Schedule] Post ${scheduledPostId} missing project or details`);
        await prisma.scheduledPost.update({
          where: { id: scheduledPostId },
          data: { status: "failed", errorMsg: "Missing project details" },
        });
        return;
      }

      try {
        const text = post.content || post.draft?.editedContent || "";
        const platform = post.platform.toLowerCase();

        console.log(`🚀 [Schedule] Executing publish for post ${post.id} on ${platform}...`);

        if (platform === "youtube") {
          const uploadResult = await uploadVideoFromCDN(
            post.user,
            post.project.cloudinaryUrl,
            post.project.title || "Published Video",
            text
          );
          if (uploadResult?.id) {
            await prisma.videoProject.update({
              where: { id: post.projectId },
              data: { youtubeVideoId: uploadResult.id },
            });
          }
        } else if (platform === "instagram") {
          await uploadVideoToInstagram(
            post.user,
            post.project.cloudinaryUrl,
            text,
            async () => {
              try {
                await job.touch();
              } catch (_) {}
            }
          );
        }

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "published", errorMsg: null },
        });
        console.log(`✅ [Schedule] Post ${post.id} successfully published to ${platform}`);
      } catch (err) {
        console.error(`❌ [Schedule] Post ${post.id} failed:`, err.message);
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "failed", errorMsg: err.message },
        });
      }
    }
  );
}
