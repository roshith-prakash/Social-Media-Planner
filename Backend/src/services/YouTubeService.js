import { google } from "googleapis";
import fetch from "node-fetch";
import { Readable } from "stream";
import { decrypt } from "../utils/crypto.js";

export const getYouTubeAuthorizedClient = (user) => {
  if (!user || !user.youtubeAccessToken) {
    throw new Error("YouTube is not connected for this user");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/v1/youtube/callback"
  );

  const rawAccessToken = decrypt(user.youtubeAccessToken);
  const rawRefreshToken = user.youtubeRefreshToken ? decrypt(user.youtubeRefreshToken) : undefined;

  oauth2Client.setCredentials({
    access_token: rawAccessToken,
    refresh_token: rawRefreshToken,
    expiry_date: user.youtubeTokenExpiry
      ? new Date(user.youtubeTokenExpiry).getTime()
      : undefined,
  });

  return oauth2Client;
};

export const uploadVideoFromCDN = async (user, cdnUrl, title, description) => {
  const auth = getYouTubeAuthorizedClient(user);
  const youtube = google.youtube({ version: "v3", auth });

  const response = await fetch(cdnUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch CDN video: ${response.statusText}`);
  }

  // Buffer video into memory (<20MB limit ensures this is fast and safe).
  // This isolates Cloudinary download from YouTube stream and avoids write ECONNRESET.
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const performUpload = async () => {
    const stream = Readable.from(buffer);
    return await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: title || "New Video",
          description: description || "",
        },
        status: { privacyStatus: "public" },
      },
      media: {
        mimeType: "video/mp4",
        body: stream,
      },
    });
  };

  try {
    const res = await performUpload();
    return res.data;
  } catch (err) {
    if (err.message && (err.message.includes("ECONNRESET") || err.message.includes("ETIMEDOUT"))) {
      console.warn("[YouTube] Network glitch encountered, retrying upload once...", err.message);
      const retryRes = await performUpload();
      return retryRes.data;
    }
    throw err;
  }
};

/**
 * Check whether a YouTube video is still active or has been deleted from YouTube.
 */
export const checkYouTubeVideoStatus = async (user, videoId) => {
  if (!user || !user.youtubeAccessToken || !videoId) {
    return { exists: false, isDeleted: false, reason: "missing_credentials" };
  }

  try {
    const auth = getYouTubeAuthorizedClient(user);
    const youtube = google.youtube({ version: "v3", auth });

    const res = await youtube.videos.list({
      part: "snippet,status",
      id: [videoId],
    });

    const item = res.data?.items?.[0];
    if (!item) {
      // Empty items array means the video is deleted or doesn't exist on YouTube
      return { exists: false, isDeleted: true, status: "deleted" };
    }

    return {
      exists: true,
      isDeleted: false,
      status: item.status?.uploadStatus || "uploaded",
      privacyStatus: item.status?.privacyStatus || "public",
      title: item.snippet?.title || "",
    };
  } catch (err) {
    console.warn("YouTube video status check error:", err.message);
    return { exists: false, isDeleted: false, error: err.message };
  }
};

/**
 * Fetch real-time video stats (instant views, likes, comments) via YouTube Data API v3.
 */
export const getYouTubeVideoStats = async (user, videoId) => {
  if (!user || !user.youtubeAccessToken || !videoId) {
    return null;
  }

  try {
    const auth = getYouTubeAuthorizedClient(user);
    const youtube = google.youtube({ version: "v3", auth });

    const res = await youtube.videos.list({
      part: "snippet,statistics,contentDetails",
      id: [videoId],
    });

    const item = res.data?.items?.[0];
    if (!item) return null;

    return {
      videoId,
      platform: "youtube",
      title: item.snippet?.title || "",
      publishedAt: item.snippet?.publishedAt || null,
      views: Number(item.statistics?.viewCount) || 0,
      likes: Number(item.statistics?.likeCount) || 0,
      comments: Number(item.statistics?.commentCount) || 0,
      favoriteCount: Number(item.statistics?.favoriteCount) || 0,
    };
  } catch (err) {
    console.warn("YouTube video stats notice:", err.message);
    return null;
  }
};

/**
 * Fetch historical 30-day daily trajectory for a specific video via YouTube Analytics API v2.
 */
export const getYouTubeAnalytics = async (user, videoId) => {
  // CRITICAL: If no videoId is provided, do NOT query the entire channel.
  if (!user || !user.youtubeAccessToken || !videoId) {
    return { columnHeaders: [], rows: [] };
  }

  const auth = getYouTubeAuthorizedClient(user);
  const analytics = google.youtubeAnalytics({ version: "v2", auth });

  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    const report = await analytics.reports.query({
      ids: "channel==MINE",
      metrics: "views,estimatedMinutesWatched,averageViewDuration,comments,likes",
      dimensions: "day",
      filters: `video==${videoId}`,
      startDate,
      endDate,
    });
    return report.data;
  } catch (err) {
    console.warn("YouTube analytics query notice:", err.message);
    // Consistent 6-column fallback shape: [day, views, estimatedMinutesWatched, averageViewDuration, comments, likes]
    return {
      columnHeaders: [
        { name: "day", columnType: "DIMENSION", dataType: "STRING" },
        { name: "views", columnType: "METRIC", dataType: "INTEGER" },
        { name: "estimatedMinutesWatched", columnType: "METRIC", dataType: "INTEGER" },
        { name: "averageViewDuration", columnType: "METRIC", dataType: "INTEGER" },
        { name: "comments", columnType: "METRIC", dataType: "INTEGER" },
        { name: "likes", columnType: "METRIC", dataType: "INTEGER" },
      ],
      rows: [
        [startDate, 0, 0, 0, 0, 0],
        [endDate, 0, 0, 0, 0, 0],
      ],
    };
  }
};
