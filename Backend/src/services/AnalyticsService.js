import prisma from "../config/prisma.js";
import { getYouTubeAnalytics, getYouTubeVideoStats } from "./YouTubeService.js";
import { getInstagramMediaAnalytics } from "./InstagramService.js";

/**
 * AnalyticsService — Fetches live performance metrics for published videos/posts.
 */
class AnalyticsService {
  async getProjectAnalytics(projectId, userId) {
    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      include: {
        analysis: true,
        user: true,
        scheduledPosts: true,
      },
    });

    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized");

    // Identify if the video is published on any supported platform
    const ytPost = project.scheduledPosts.find(
      (p) => p.platform === "youtube" && p.status === "published"
    );
    const igPost = project.scheduledPosts.find(
      (p) => p.platform === "instagram" && p.status === "published"
    );

    const youtubeVideoId = project.youtubeVideoId || ytPost?.externalPostId || null;
    const instagramMediaId = project.instagramMediaId || igPost?.externalPostId || null;
    const isPublished = Boolean(youtubeVideoId || instagramMediaId);

    // Initial summary object
    const summary = {
      projectId: project.id,
      title: project.title,
      thumbnailUrl: project.thumbnailUrl,
      duration: project.duration,
      format: project.format,
      isPublished,
      youtubeVideoId,
      instagramMediaId,
      platforms: project.scheduledPosts.map((p) => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
        scheduledAt: p.scheduledAt,
        externalPostId: p.externalPostId || null,
      })),
      metrics: {
        totalViews: 0,
        estimatedMinutesWatched: 0,
        averageViewDuration: 0,
        likes: 0,
        comments: 0,
        reach: 0,
      },
      platformBreakdown: {
        youtube: null,
        instagram: null,
      },
      chartData: [],
    };

    // If project is NOT published yet, return immediately with zeroed baseline (do NOT leak channel data)
    if (!isPublished) {
      summary.chartData = this.generateBaselineChart(7);
      return summary;
    }

    let ytStats = null;
    let ytReport = null;
    let igStats = null;

    // 1. Fetch YouTube Live Stats & Daily Trajectory (ONLY if videoId exists)
    if (youtubeVideoId && project.user.youtubeAccessToken) {
      try {
        const [liveStats, report] = await Promise.all([
          getYouTubeVideoStats(project.user, youtubeVideoId),
          getYouTubeAnalytics(project.user, youtubeVideoId),
        ]);
        ytStats = liveStats;
        ytReport = report;
      } catch (ytErr) {
        console.warn("YouTube analytics fetch notice:", ytErr.message);
      }
    }

    // 2. Fetch Instagram Live Stats & Insights (ONLY if instagramMediaId exists)
    if (instagramMediaId && project.user.instagramAccessToken) {
      try {
        igStats = await getInstagramMediaAnalytics(project.user, instagramMediaId);
      } catch (igErr) {
        console.warn("Instagram analytics fetch notice:", igErr.message);
      }
    }

    // 3. Assemble Platform Breakdown
    if (ytStats || youtubeVideoId) {
      summary.platformBreakdown.youtube = {
        synced: Boolean(ytStats),
        videoId: youtubeVideoId,
        views: ytStats?.views || 0,
        likes: ytStats?.likes || 0,
        comments: ytStats?.comments || 0,
      };
    }

    if (igStats || instagramMediaId) {
      summary.platformBreakdown.instagram = {
        synced: Boolean(igStats),
        mediaId: instagramMediaId,
        views: igStats?.views || 0,
        reach: igStats?.reach || 0,
        likes: igStats?.likes || 0,
        comments: igStats?.comments || 0,
        permalink: igStats?.permalink || null,
      };
    }

    // 4. Compute Aggregate Real-Time Metrics
    const ytViews = ytStats?.views || 0;
    const igViews = igStats?.views || 0;
    const ytLikes = ytStats?.likes || 0;
    const igLikes = igStats?.likes || 0;
    const ytComments = ytStats?.comments || 0;
    const igComments = igStats?.comments || 0;
    const igReach = igStats?.reach || 0;

    summary.metrics.totalViews = ytViews + igViews;
    summary.metrics.likes = ytLikes + igLikes;
    summary.metrics.comments = ytComments + igComments;
    summary.metrics.reach = igReach;

    // 5. Build Trajectory Chart Data
    // YouTube Analytics API rows: [day, views, estimatedMinutesWatched, avgDuration, comments, likes]
    if (ytReport?.rows && ytReport.rows.length > 0) {
      let totalWatchMinutes = 0;
      let totalWeightedDuration = 0;
      let totalReportViews = 0;

      summary.chartData = ytReport.rows.map((row) => {
        const dayViews = Number(row[1]) || 0;
        const watchMinutes = Number(row[2]) || 0;
        const avgDurationSec = Number(row[3]) || 0;
        const dayComments = Number(row[4]) || 0;
        const dayLikes = Number(row[5]) || 0;

        totalReportViews += dayViews;
        totalWatchMinutes += watchMinutes;
        totalWeightedDuration += avgDurationSec * dayViews;

        return {
          date: row[0],
          views: dayViews,
          watchMinutes,
          avgDurationSec,
          comments: dayComments,
          likes: dayLikes,
        };
      });

      summary.metrics.estimatedMinutesWatched = totalWatchMinutes;
      summary.metrics.averageViewDuration = totalReportViews > 0
        ? Math.round(totalWeightedDuration / totalReportViews)
        : 0;

      // If YouTube Analytics API warehouse is lagging (0 views in daily report) but real-time Data API has views:
      if (totalReportViews === 0 && ytViews > 0 && summary.chartData.length > 0) {
        const lastIndex = summary.chartData.length - 1;
        summary.chartData[lastIndex].views = ytViews;
      }
    } else {
      // Build 7-day chart with latest real-time totals on the most recent day
      const baseline = this.generateBaselineChart(7);
      if (summary.metrics.totalViews > 0) {
        baseline[baseline.length - 1].views = summary.metrics.totalViews;
        baseline[baseline.length - 1].likes = summary.metrics.likes;
      }
      summary.chartData = baseline;
    }

    return summary;
  }

  generateBaselineChart(days = 7) {
    const baseline = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      baseline.push({
        date: d.toISOString().split("T")[0],
        views: 0,
        watchMinutes: 0,
        avgDurationSec: 0,
        likes: 0,
        comments: 0,
      });
    }
    return baseline;
  }
}

export default new AnalyticsService();

