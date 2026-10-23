import fetch from "node-fetch";
import prisma from "../config/prisma.js";
import { encrypt, decrypt } from "../utils/crypto.js";

const GRAPH_API_VERSION = "v19.0";
const INSTAGRAM_AUTH_URL = "https://api.instagram.com/oauth/authorize";
const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_GRAPH_URL = `https://graph.instagram.com/${GRAPH_API_VERSION}`;

const getMetaConfig = () => {
  const clientId = process.env.META_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.META_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${process.env.BACKEND_URL || "http://localhost:4000"}/api/v1/instagram/callback`;

  return { clientId, clientSecret, redirectUri };
};

/**
 * Step 1: Generate OAuth URL for Instagram Login for Professionals
 */
export const getInstagramAuthUrl = (state) => {
  const { clientId, redirectUri } = getMetaConfig();
  if (!clientId) {
    throw new Error("META_APP_ID or INSTAGRAM_CLIENT_ID is not configured in .env");
  }

  const scopes = [
    "instagram_business_basic",
    "instagram_business_content_publish",
    "instagram_business_manage_insights",
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(","),
    response_type: "code",
    state: state || "",
  });

  return `${INSTAGRAM_AUTH_URL}?${params.toString()}`;
};

/**
 * Step 2: Handle OAuth callback code, exchange for tokens and resolve Instagram account.
 */
export const handleInstagramCallback = async (code, state) => {
  const { clientId, clientSecret, redirectUri } = getMetaConfig();

  // 1. Exchange authorization code for short-lived token via Instagram OAuth endpoint
  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  let tokenData = null;
  const tokenRes = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams.toString(),
  });
  tokenData = await tokenRes.json();

  // If api.instagram.com failed, attempt Facebook Graph fallback
  if (tokenData.error) {
    console.warn("Instagram direct token exchange note:", tokenData.error_message || tokenData.error?.message);
    const fbTokenUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?` + new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });
    const fbRes = await fetch(fbTokenUrl);
    const fbData = await fbRes.json();
    if (!fbData.error) {
      tokenData = fbData;
    } else {
      throw new Error(`Instagram token exchange failed: ${tokenData.error_message || tokenData.error?.message || fbData.error?.message}`);
    }
  }

  const shortLivedToken = tokenData.access_token;
  const userId = tokenData.user_id;

  // 2. Exchange short-lived token for long-lived 60-day token
  let accessToken = shortLivedToken;
  let expiresInSeconds = 5184000; // default 60 days

  try {
    const longLivedUrl = `https://graph.instagram.com/access_token?` + new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: clientSecret,
      access_token: shortLivedToken,
    });
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();
    if (longLivedData.access_token) {
      accessToken = longLivedData.access_token;
      expiresInSeconds = longLivedData.expires_in || expiresInSeconds;
    }
  } catch (err) {
    console.warn("Long-lived token exchange warning:", err.message);
  }

  const tokenExpiry = new Date(Date.now() + expiresInSeconds * 1000);

  // 3. Retrieve user profile info from Instagram Graph API
  let igUsername = null;
  let igName = null;
  let igProfilePic = null;
  let resolvedId = userId;

  try {
    const profileUrl = `${INSTAGRAM_GRAPH_URL}/me?` + new URLSearchParams({
      fields: "id,username,name,profile_picture_url,account_type",
      access_token: accessToken,
    });
    const profileRes = await fetch(profileUrl);
    const profileData = await profileRes.json();
    if (profileData.id) {
      resolvedId = profileData.id;
      igUsername = profileData.username;
      igName = profileData.name || profileData.username;
      igProfilePic = profileData.profile_picture_url || "";
    }
  } catch (err) {
    console.warn("Instagram profile lookup warning:", err.message);
  }

  // 4. Locate user in DB by state (firebaseUID or DB ObjectId safely)
  const isObjectId = typeof state === "string" && /^[0-9a-fA-F]{24}$/.test(state);
  const user = await prisma.user.findFirst({
    where: isObjectId
      ? { OR: [{ firebaseUID: state }, { id: state }] }
      : { firebaseUID: state },
  });

  if (!user) {
    throw new Error(`User not found with identifier: ${state}`);
  }

  // 5. Update user record with encrypted token and Instagram metadata
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      instagramId: String(resolvedId || user.id),
      instagramUsername: igUsername || "instagram_creator",
      instagramName: igName || "Instagram Creator",
      instagramProfilePic: igProfilePic || "",
      instagramAccessToken: encrypt(accessToken),
      instagramTokenExpiry: tokenExpiry,
      instagramBusinessId: String(resolvedId || user.id),
    },
  });

  console.log(`✅ [Instagram] Account @${updatedUser.instagramUsername} connected successfully for user ${user.id}`);
  return updatedUser;
};

/**
 * Step 3: Publish Video/Reels to Instagram via Media Container API
 */
export const uploadVideoToInstagram = async (user, videoUrl, caption = "", onHeartbeat = null) => {
  if (!user.instagramAccessToken) {
    throw new Error("Instagram account is not connected or token is missing.");
  }

  const token = decrypt(user.instagramAccessToken);
  const igUserId = user.instagramBusinessId || user.instagramId;

  if (!igUserId) {
    throw new Error("No Instagram Professional Account ID found. Please connect your Instagram Professional account.");
  }

  console.log(`📸 [Instagram] Initializing Reels upload for user ${user.id} on IG ID: ${igUserId}...`);

  // 1. Create Media Container for REELS (works on graph.instagram.com and graph.facebook.com)
  const createContainerUrl = `${INSTAGRAM_GRAPH_URL}/${igUserId}/media`;
  const containerParams = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption || "",
    share_to_feed: "true",
    access_token: token,
  });

  const containerRes = await fetch(`${createContainerUrl}?${containerParams.toString()}`, {
    method: "POST",
  });
  const containerData = await containerRes.json();

  if (containerData.error || !containerData.id) {
    throw new Error(`Instagram container creation failed: ${containerData.error?.message || "Unknown error"}`);
  }

  const creationId = containerData.id;
  console.log(`📸 [Instagram] Container created: ${creationId}. Polling processing status...`);

  // 2. Poll until container status is FINISHED (up to 2 minutes)
  let attempts = 0;
  const maxAttempts = 40; // 40 * 3s = 120s
  let ready = false;

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 3000));
    attempts++;

    // Refresh lock / touch worker heartbeat if provided
    if (typeof onHeartbeat === "function") {
      try {
        await onHeartbeat();
      } catch (_) {}
    }

    const statusRes = await fetch(
      `${INSTAGRAM_GRAPH_URL}/${creationId}?fields=status_code,status&access_token=${token}`
    );
    const statusData = await statusRes.json();
    const statusCode = statusData.status_code;

    console.log(`📸 [Instagram] Status check #${attempts}: ${statusCode}`);

    if (statusCode === "FINISHED") {
      ready = true;
      break;
    } else if (statusCode === "ERROR" || statusCode === "EXPIRED") {
      throw new Error(`Instagram video processing failed with status: ${statusCode}`);
    }
  }

  if (!ready) {
    throw new Error("Timed out waiting for Instagram to process the video container.");
  }

  // 3. Publish the container
  const publishUrl = `${INSTAGRAM_GRAPH_URL}/${igUserId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: token,
  });

  const publishRes = await fetch(`${publishUrl}?${publishParams.toString()}`, {
    method: "POST",
  });
  const publishData = await publishRes.json();

  if (publishData.error || !publishData.id) {
    throw new Error(`Instagram publishing failed: ${publishData.error?.message || "Unknown error"}`);
  }

  console.log(`✅ [Instagram] Reel published successfully with media ID: ${publishData.id}`);
  return {
    success: true,
    mediaId: publishData.id,
    containerId: creationId,
  };
};

/**
 * Step 4: Disconnect Instagram account
 */
export const disconnectInstagram = async (userId) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      instagramId: null,
      instagramUsername: null,
      instagramName: null,
      instagramProfilePic: null,
      instagramAccessToken: null,
      instagramTokenExpiry: null,
      instagramBusinessId: null,
      instagramPageId: null,
    },
  });
};

/**
 * Step 5: Fetch live performance metrics for an Instagram media item (Reel/Post).
 */
export const getInstagramMediaAnalytics = async (user, mediaId) => {
  if (!user || !user.instagramAccessToken || !mediaId) {
    return null;
  }

  const token = decrypt(user.instagramAccessToken);

  try {
    // 1. Fetch direct media object metrics (available with instagram_business_basic)
    const mediaUrl = `${INSTAGRAM_GRAPH_URL}/${mediaId}?` + new URLSearchParams({
      fields: "id,caption,media_type,media_product_type,like_count,comments_count,permalink,timestamp",
      access_token: token,
    });

    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      console.warn("Instagram media lookup notice:", mediaData.error.message);
      return null;
    }

    const stats = {
      mediaId,
      platform: "instagram",
      views: 0,
      reach: 0,
      likes: Number(mediaData.like_count) || 0,
      comments: Number(mediaData.comments_count) || 0,
      saved: 0,
      totalInteractions: (Number(mediaData.like_count) || 0) + (Number(mediaData.comments_count) || 0),
      permalink: mediaData.permalink || null,
      timestamp: mediaData.timestamp || null,
      mediaProductType: mediaData.media_product_type || mediaData.media_type || "REELS",
    };

    // 2. Attempt fetching in-depth insights (plays, reach, impressions, saved)
    try {
      // For Reels, Instagram supports: reach, plays, total_interactions, saved (or views)
      const insightsUrl = `${INSTAGRAM_GRAPH_URL}/${mediaId}/insights?` + new URLSearchParams({
        metric: "reach,plays,total_interactions,saved",
        access_token: token,
      });

      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      if (insightsData?.data && Array.isArray(insightsData.data)) {
        insightsData.data.forEach((metricItem) => {
          const val = metricItem.values?.[0]?.value ?? metricItem.total_value?.value ?? 0;
          if (metricItem.name === "plays" || metricItem.name === "views") {
            stats.views = Number(val) || 0;
          } else if (metricItem.name === "reach") {
            stats.reach = Number(val) || 0;
          } else if (metricItem.name === "saved") {
            stats.saved = Number(val) || 0;
          } else if (metricItem.name === "total_interactions") {
            stats.totalInteractions = Number(val) || stats.totalInteractions;
          }
        });
      } else {
        // Fallback metric set for non-reels or older API versions
        const altUrl = `${INSTAGRAM_GRAPH_URL}/${mediaId}/insights?` + new URLSearchParams({
          metric: "reach,impressions,saved",
          access_token: token,
        });
        const altRes = await fetch(altUrl);
        const altData = await altRes.json();
        if (altData?.data && Array.isArray(altData.data)) {
          altData.data.forEach((metricItem) => {
            const val = metricItem.values?.[0]?.value ?? metricItem.total_value?.value ?? 0;
            if (metricItem.name === "impressions" || metricItem.name === "reach") {
              stats.reach = Math.max(stats.reach, Number(val) || 0);
              if (stats.views === 0) stats.views = Number(val) || 0;
            } else if (metricItem.name === "saved") {
              stats.saved = Number(val) || 0;
            }
          });
        }
      }
    } catch (insightsErr) {
      console.warn("Instagram insights query notice (non-fatal):", insightsErr.message);
    }

    // If plays was 0 or not returned by insights, reach can serve as primary audience view metric
    if (stats.views === 0 && stats.reach > 0) {
      stats.views = stats.reach;
    }

    return stats;
  } catch (err) {
    console.warn("getInstagramMediaAnalytics error:", err.message);
    return null;
  }
};

/**
 * Verify whether an Instagram post/reel is still active or has been deleted off Instagram.
 */
export const checkInstagramMediaStatus = async (user, mediaId) => {
  if (!user || !user.instagramAccessToken || !mediaId) {
    return { exists: false, isDeleted: false, reason: "missing_credentials" };
  }

  const token = decrypt(user.instagramAccessToken);

  try {
    const mediaUrl = `${INSTAGRAM_GRAPH_URL}/${mediaId}?` + new URLSearchParams({
      fields: "id,permalink",
      access_token: token,
    });

    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      const msg = mediaData.error.message || "";
      const code = mediaData.error.code;
      const subcode = mediaData.error.error_subcode;
      // Code 100 / subcode 33 / subcode 2207008 or "does not exist" / "deleted" confirms media is deleted from Instagram
      if (
        code === 100 ||
        subcode === 33 ||
        subcode === 2207008 ||
        /does not exist|deleted|cannot be loaded|unsupported get request|object with id/i.test(msg)
      ) {
        return { exists: false, isDeleted: true, status: "deleted" };
      }
      return { exists: false, isDeleted: false, error: msg };
    }

    return {
      exists: true,
      isDeleted: false,
      status: "published",
      permalink: mediaData.permalink || null,
    };
  } catch (err) {
    console.warn("Instagram media status check error:", err.message);
    const msg = (err.message || "").toLowerCase();
    if (/does not exist|deleted|not found|404/i.test(msg)) {
      return { exists: false, isDeleted: true, status: "deleted", error: err.message };
    }
    return { exists: false, isDeleted: false, error: err.message };
  }
};

