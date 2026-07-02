import express from "express";
import { generateVideoAnalysis, uploadVideoFromCDN, uploadVideoViaAI } from "../controllers/agent.controller.js";
import { prisma } from "../utils/prismaClient.js";
const router = express.Router();

// Upload video on youtube
router.post("/upload-youtube", async (req, res) => {
    try {
        const { userId, cdnUrl, title, description } = req.body;

        if (!userId || !cdnUrl || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find user in DB
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.youtubeAccessToken) {
            return res.status(400).json({ error: "User has not connected YouTube" });
        }

        // Upload video
        const video = await uploadVideoFromCDN(user, cdnUrl, title, description);

        res.json({ success: true, video });
    } catch (err) {
        console.error("YouTube upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/analysis", generateVideoAnalysis)

router.post("/upload-youtube-ai", uploadVideoViaAI)


export default router
