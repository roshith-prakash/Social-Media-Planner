import express from "express";
import axios from "axios";
import prisma from "../config/prisma.js";
import { getUserData, postData } from "../services/LinkedInService.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

const getLinkedInConfig = () => {
  const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
  const LINKEDIN_CLIENT_AS = process.env.LINKEDIN_CLIENT_AS || process.env.LINKEDIN_CLIENT_SECRET;
  const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || "http://localhost:4000/api/v1/linkedin/callback";
  return { CLIENT_ID, LINKEDIN_CLIENT_AS, REDIRECT_URI };
};

// Step 1: Redirect user to LinkedIn for authorization
router.get("/login", async (req, res) => {
  const { CLIENT_ID, REDIRECT_URI } = getLinkedInConfig();

  if (!CLIENT_ID || !REDIRECT_URI) {
    return res.status(500).json({
      error: "Missing LinkedIn credentials (LINKEDIN_CLIENT_ID or LINKEDIN_REDIRECT_URI)",
    });
  }

  const scope = "openid profile email";
  const state = req.query.state || req.query.firebaseUID || req.query.userId || Math.random().toString(36).substring(2);
  const linkedInAuthUrl =
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}`;

  res.redirect(linkedInAuthUrl);
});

// Step 2: LinkedIn redirects here with code
router.get("/callback", async (req, res) => {
  const { code, error, error_description, state } = req.query;

  if (error) {
    console.error(`LinkedIn OAuth error: ${error_description || error}`);
    return res.status(400).send(`Authentication failed: ${error_description || error}.`);
  }

  if (!code) {
    return res.status(400).send("Authorization code missing.");
  }

  const { CLIENT_ID, LINKEDIN_CLIENT_AS, REDIRECT_URI } = getLinkedInConfig();

  try {
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_AS,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;
    const userData = await getUserData(access_token);

    const userProfile = {
      linkedinId: userData.sub,
      firstName: userData.given_name,
      lastName: userData.family_name,
      email: userData.email,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      accessToken: access_token,
      profilePicture: userData.picture || null,
    };

    let dbUser = null;
    if (state) {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: state },
            { firebaseUID: state },
            ...(userData.email ? [{ email: userData.email.toLowerCase() }] : []),
          ],
        },
      });
    }

    if (!dbUser && userData.email) {
      dbUser = await prisma.user.findFirst({
        where: { email: userData.email.toLowerCase() },
      });
    }

    if (dbUser) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          linkedinId: userProfile.linkedinId,
          linkedinFirst: userProfile.firstName,
          linkedinLast: userProfile.lastName,
          linkedinPicture: userProfile.profilePicture,
          linkedinToken: encrypt(userProfile.accessToken),
          linkedinExpires: userProfile.expiresAt,
        },
      });
    }

    const userForFrontend = {
      id: dbUser?.id || state,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      profilePicture: userProfile.profilePicture,
    };

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/linkedin?user=${encodeURIComponent(JSON.stringify(userForFrontend))}`);
  } catch (err) {
    console.error("LinkedIn OAuth error:", err.message);
    res.status(500).send(`Failed to authenticate with LinkedIn: ${err.message}`);
  }
});

// Step 3: Authenticated post endpoint
router.post("/post", authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const user = req.dbUser;
    if (!user.linkedinToken) {
      return res.status(400).json({ error: "LinkedIn account not connected" });
    }
    const token = decrypt(user.linkedinToken);
    const result = await postData(text, token, user.linkedinId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error posting to LinkedIn:", error);
    res.status(500).json({ error: error.message || "Failed to post to LinkedIn" });
  }
});

export default router;
