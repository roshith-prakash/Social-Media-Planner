import express from "express";
import { TwitterApi } from "twitter-api-v2";
import crypto from "crypto";
import prisma from "../config/prisma.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { postToTwitter } from "../services/TwitterService.js";

const router = express.Router();

const oauthHandshakeStore = new Map();

const getTwitterConfig = () => ({
  clientId: process.env.TWITTER_CLIENT_ID || process.env.CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.CLIENT_SECRET,
  redirectUri: process.env.TWITTER_REDIRECT_URI || process.env.REDIRECT_URI || "http://localhost:4000/api/v1/twitter/callback",
});

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function requestAuthUrl(userIdentifier = null) {
  const { clientId, redirectUri } = getTwitterConfig();
  if (!clientId) {
    throw new Error("Missing Twitter CLIENT_ID / TWITTER_CLIENT_ID");
  }

  const { verifier, challenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString("hex");

  oauthHandshakeStore.set(state, {
    verifier,
    userIdentifier,
    expires: Date.now() + 10 * 60 * 1000,
  });

  const authUrl =
    `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=tweet.read%20tweet.write%20users.read%20offline.access&` +
    `state=${state}&` +
    `code_challenge=${challenge}&` +
    `code_challenge_method=S256`;

  return { url: authUrl, state };
}

async function exchangeCodeForToken({ code, verifier, redirectUri }) {
  const { clientId, clientSecret } = getTwitterConfig();
  const client = new TwitterApi({ clientId, clientSecret });

  const tokens = await client.loginWithOAuth2({ code, codeVerifier: verifier, redirectUri });
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error("Invalid token response");
  }
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

async function fetchUserData(accessToken) {
  const client = new TwitterApi(accessToken);
  const { data: user } = await client.v2.me({
    "user.fields": "id,username,name,profile_image_url",
  });
  if (!user?.id || !user?.username) {
    throw new Error("Invalid user data");
  }
  return user;
}

async function getUserTokens(userId) {
  if (!userId) return null;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { firebaseUID: userId },
          { twitterUserId: userId },
        ],
      },
    });

    if (user && user.twitterAccessToken) {
      return {
        accessToken: decrypt(user.twitterAccessToken),
        refreshToken: user.twitterRefreshToken ? decrypt(user.twitterRefreshToken) : null,
        expires: user.twitterExpiry ? new Date(user.twitterExpiry).getTime() : null,
        dbUserId: user.id,
        user,
      };
    }
  } catch (e) {
    console.error("Error fetching user tokens from DB:", e.message);
  }

  return null;
}

// ----------------- ROUTES ------------------

const handleLoginRequest = async (req, res) => {
  try {
    const userIdentifier = req.query.firebaseUID || req.query.userId || null;
    const { url, state } = await requestAuthUrl(userIdentifier);
    res.json({ url, state });
  } catch (error) {
    res.status(500).json({ error: "Failed to initiate Twitter auth", details: error.message });
  }
};

router.get("/auth/twitter/login", handleLoginRequest);
router.get("/login", handleLoginRequest);

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" });
  }

  const authData = oauthHandshakeStore.get(state);
  if (!authData || authData.expires < Date.now()) {
    oauthHandshakeStore.delete(state);
    return res.status(400).json({ error: "Invalid or expired OAuth state" });
  }

  try {
    const { redirectUri } = getTwitterConfig();
    const tokens = await exchangeCodeForToken({
      code,
      verifier: authData.verifier,
      redirectUri,
    });

    const user = await fetchUserData(tokens.accessToken);
    const expiryDate = tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null;

    try {
      let dbUser = null;
      if (authData.userIdentifier) {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: authData.userIdentifier },
              { firebaseUID: authData.userIdentifier },
            ],
          },
        });
      }

      if (!dbUser && user.id) {
        dbUser = await prisma.user.findFirst({
          where: { twitterUserId: user.id },
        });
      }

      if (dbUser) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            twitterAccessToken: encrypt(tokens.accessToken),
            twitterRefreshToken: encrypt(tokens.refreshToken),
            twitterUserId: user.id,
            twitterUsername: user.username,
            twitterName: user.name || "",
            twitterExpiry: expiryDate,
          },
        });
      }
    } catch (dbErr) {
      console.error("Failed to persist Twitter tokens to DB:", dbErr.message);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/twitter?userId=${user.id}&username=${encodeURIComponent(user.username)}&name=${encodeURIComponent(user.name || "")}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({ error: "Twitter authentication failed", details: error.message });
  } finally {
    oauthHandshakeStore.delete(state);
  }
});

router.post("/logout", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    await prisma.user.updateMany({
      where: {
        OR: [
          { id: userId },
          { firebaseUID: userId },
          { twitterUserId: userId },
        ],
      },
      data: {
        twitterAccessToken: null,
        twitterRefreshToken: null,
        twitterExpiry: null,
      },
    });
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to logout", details: err.message });
  }
});

const handlePostTweetRequest = async (req, res) => {
  const { userId, text } = req.body;
  const userTokens = await getUserTokens(userId);
  if (!userTokens) {
    return res.status(401).json({ error: "Unauthorized: Twitter account not connected" });
  }

  try {
    const result = await postToTwitter(userTokens.user, text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.post("/api/post-tweet", handlePostTweetRequest);
router.post("/post-tweet", handlePostTweetRequest);

export default router;
