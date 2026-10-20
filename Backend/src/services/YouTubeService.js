import { google } from "googleapis";
import fetch from "node-fetch";
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

  const res = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: title || "New Video",
        description: description || "",
      },
      status: { privacyStatus: "public" },
    },
    media: {
      body: response.body,
    },
  });

  return res.data;
};

export const getYouTubeAnalytics = async (user, videoId) => {
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
      filters: videoId ? `video==${videoId}` : undefined,
      startDate,
      endDate,
    });
    return report.data;
  } catch (err) {
    console.warn("YouTube analytics query notice:", err.message);
    // If YouTube Analytics API is not enabled on Google project or channel has no data, return mock/fallback shape
    return {
      columnHeaders: [
        { name: "day", columnType: "DIMENSION", dataType: "STRING" },
        { name: "views", columnType: "METRIC", dataType: "INTEGER" },
        { name: "estimatedMinutesWatched", columnType: "METRIC", dataType: "INTEGER" },
        { name: "averageViewDuration", columnType: "METRIC", dataType: "INTEGER" },
        { name: "likes", columnType: "METRIC", dataType: "INTEGER" },
      ],
      rows: [
        [startDate, 0, 0, 0, 0],
        [endDate, 0, 0, 0, 0],
      ],
    };
  }
};
