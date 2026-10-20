import axios from "axios";
import { decrypt } from "../utils/crypto.js";

export const getUserData = async (accessToken) => {
  const decryptedToken = decrypt(accessToken);
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${decryptedToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`LinkedIn userinfo failed: ${response.statusText}`);
  }

  return response.json();
};

export const postData = async (text, accessToken, authorURN) => {
  if (!text || !accessToken || !authorURN) {
    throw new Error("Missing required fields: text, accessToken, authorURN");
  }

  const decryptedToken = decrypt(accessToken);
  const postBody = {
    author: authorURN.startsWith("urn:li:person:") ? authorURN : `urn:li:person:${authorURN}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text,
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const response = await axios.post("https://api.linkedin.com/v2/ugcPosts", postBody, {
    headers: {
      Authorization: `Bearer ${decryptedToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  return {
    success: true,
    data: response.data,
    message: "Post published successfully",
  };
};

export const postToLinkedIn = async (user, text) => {
  if (!user.linkedinToken) {
    throw new Error("LinkedIn is not connected for this user");
  }
  return postData(text, user.linkedinToken, user.linkedinId);
};
