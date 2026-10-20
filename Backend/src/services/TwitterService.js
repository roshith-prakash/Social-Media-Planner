import { TwitterApi } from "twitter-api-v2";
import { decrypt, encrypt } from "../utils/crypto.js";
import prisma from "../config/prisma.js";

const getTwitterConfig = () => ({
  clientId: process.env.TWITTER_CLIENT_ID || process.env.CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.CLIENT_SECRET,
});

export const getTwitterClientForUser = async (user) => {
  if (!user || !user.twitterAccessToken) {
    throw new Error("Twitter account not connected");
  }

  const rawAccessToken = decrypt(user.twitterAccessToken);
  const client = new TwitterApi(rawAccessToken);
  return { client, accessToken: rawAccessToken };
};

export const postToTwitter = async (user, text) => {
  if (!text || text.length > 280) {
    throw new Error("Invalid tweet text (must be 1-280 characters)");
  }

  const { client } = await getTwitterClientForUser(user);

  try {
    const tweet = await client.v2.tweet(text);
    return { success: true, tweetId: tweet.data.id };
  } catch (error) {
    // If 401 and refresh token available, attempt refresh
    if (error.code === 401 && user.twitterRefreshToken) {
      const { clientId, clientSecret } = getTwitterConfig();
      const rawRefreshToken = decrypt(user.twitterRefreshToken);
      const appClient = new TwitterApi({ clientId, clientSecret });
      const refreshed = await appClient.refreshOAuth2Token(rawRefreshToken);
      const newExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twitterAccessToken: encrypt(refreshed.accessToken),
          twitterRefreshToken: encrypt(refreshed.refreshToken),
          twitterExpiry: newExpiry,
        },
      });

      const retryClient = new TwitterApi(refreshed.accessToken);
      const tweet = await retryClient.v2.tweet(text);
      return { success: true, tweetId: tweet.data.id };
    }
    throw error;
  }
};
