import express from "express";
import { getOAuthClient } from "../utils/googleClient.js";
import prisma from "../config/prisma.js";
import { google } from "googleapis";
import { encrypt } from "../utils/crypto.js";
import authenticate from "../middleware/auth.middleware.js";
import { uploadVideoFromCDN } from "../services/YouTubeService.js";

const router = express.Router();

// Step 1: Return OAuth URL to frontend
router.get("/login", async (req, res) => {
  try {
    const oauth2Client = getOAuthClient();
    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ];

    const state = req.query.firebaseUID || req.query.userId || req.query.state;
    if (!state) return res.status(400).json({ error: "Missing firebaseUID or userId parameter" });

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state,
    });

    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate YouTube OAuth URL", details: err.message });
  }
});

// Step 2: Callback
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code || !state) return res.status(400).send("Missing code or state");

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const me = await youtube.channels.list({ part: "snippet", mine: true });
    const channel = me.data.items?.[0];

    // Find user by firebaseUID or DB ObjectId safely
    const isObjectId = typeof state === "string" && /^[0-9a-fA-F]{24}$/.test(state);
    const user = await prisma.user.findFirst({
      where: isObjectId
        ? { OR: [{ firebaseUID: state }, { id: state }] }
        : { firebaseUID: state },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          youtubeAccessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
          youtubeRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          youtubeTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          youtubeChannelId: channel?.id,
          youtubeChannelName: channel?.snippet?.title,
        },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/youtube/success`);
  } catch (err) {
    console.error("YouTube OAuth callback error:", err);
    res.status(500).send(`YouTube authentication failed: ${err.message}`);
  }
});

// Step 3: Authenticated direct video upload endpoint
router.post("/upload-cdn", authenticate, async (req, res) => {
  const { cdnUrl, title, description, projectId } = req.body;
  if (!cdnUrl) return res.status(400).json({ error: "cdnUrl is required" });

  try {
    const uploadResult = await uploadVideoFromCDN(req.dbUser, cdnUrl, title, description);
    
    if (projectId && uploadResult?.id) {
      await prisma.videoProject.update({
        where: { id: projectId },
        data: { youtubeVideoId: uploadResult.id },
      });
    }

    res.json({ success: true, data: uploadResult });
  } catch (err) {
    console.error("YouTube upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
