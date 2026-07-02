import express from "express";
import { getOAuthClient } from "../utils/googleClient.js";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";

const router = express.Router();
const prisma = new PrismaClient();

// Step 1: Return OAuth URL to frontend
router.get("/login", async (req, res) => {
    const oauth2Client = getOAuthClient();
    const scopes = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
    ];

    const { firebaseUID } = req.query;
    if (!firebaseUID) return res.status(400).send("Missing firebaseUID");

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
        state: firebaseUID,
    });

    res.json({ url });
});

router.get("/callback", async (req, res) => {
    const code = req.query.code;
    const firebaseUID = req.query.state;

    if (!code || !firebaseUID)
        return res.status(400).send("Missing code or firebaseUID");

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const me = await youtube.channels.list({ part: "snippet", mine: true });
    const channel = me.data.items?.[0];

    // Update user in DB by firebaseUID
    await prisma.user.update({
        where: { firebaseUID },
        data: {
            youtubeAccessToken: tokens.access_token,
            youtubeRefreshToken: tokens.refresh_token,
            youtubeTokenExpiry: tokens.expiry_date
                ? new Date(tokens.expiry_date)
                : null,
            youtubeChannelId: channel?.id,
            youtubeChannelName: channel?.snippet?.title,
        },
    });

    res.redirect(`${process.env.FRONTEND_URL}/youtube/success`);
});


export default router
