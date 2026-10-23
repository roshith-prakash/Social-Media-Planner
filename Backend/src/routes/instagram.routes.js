import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  getInstagramAuthUrl,
  handleInstagramCallback,
  uploadVideoToInstagram,
  disconnectInstagram,
} from "../services/InstagramService.js";
import prisma from "../config/prisma.js";

const router = express.Router();

/**
 * Step 1: Return Instagram / Meta OAuth Login URL
 */
router.get("/login", async (req, res) => {
  try {
    const state = req.query.firebaseUID || req.query.userId || req.query.state;
    if (!state) {
      return res.status(400).json({ error: "Missing state (firebaseUID or userId)" });
    }

    const url = getInstagramAuthUrl(state);
    res.json({ success: true, url });
  } catch (err) {
    console.error("Instagram login URL generation error:", err);
    res.status(500).json({ error: "Failed to generate Instagram login URL", details: err.message });
  }
});

/**
 * Step 2: Handle OAuth Callback
 */
router.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error("Instagram OAuth denied/failed:", error, error_description);
    return res.status(400).send(`Instagram Authorization Error: ${error_description || error}`);
  }

  if (!code || !state) {
    return res.status(400).send("Missing code or state parameter.");
  }

  try {
    await handleInstagramCallback(code, state);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/instagram/success`);
  } catch (err) {
    console.error("Instagram callback processing error:", err);
    res.status(500).send(`Instagram authentication failed: ${err.message}`);
  }
});

/**
 * Step 3: Get current Instagram Connection Status
 */
router.get("/status", authenticate, async (req, res) => {
  try {
    const user = req.dbUser;
    const isConnected = Boolean(user.instagramAccessToken && user.instagramBusinessId);

    res.json({
      success: true,
      data: {
        connected: isConnected,
        username: user.instagramUsername || null,
        name: user.instagramName || null,
        profilePic: user.instagramProfilePic || null,
        businessId: user.instagramBusinessId || null,
        expiresAt: user.instagramTokenExpiry || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Step 4: Publish Video / Reel directly
 */
router.post("/publish", authenticate, async (req, res) => {
  const { cdnUrl, caption, projectId } = req.body;
  if (!cdnUrl) {
    return res.status(400).json({ error: "cdnUrl is required to publish to Instagram." });
  }

  try {
    const result = await uploadVideoToInstagram(req.dbUser, cdnUrl, caption);

    if (projectId) {
      await prisma.videoProject.update({
        where: { id: projectId },
        data: {
          status: "completed",
          ...(result?.mediaId ? { instagramMediaId: result.mediaId } : {}),
        },
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Instagram publishing error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Step 5: Disconnect Instagram Account
 */
router.post("/disconnect", authenticate, async (req, res) => {
  try {
    await disconnectInstagram(req.dbUser.id);
    res.json({ success: true, message: "Instagram account disconnected successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
