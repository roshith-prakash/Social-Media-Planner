import axios from "axios";

/**
 * Verifies a Firebase ID Token using Firebase's REST API.
 * This approach requires only FIREBASE_WEB_API_KEY (safe, client-facing key) —
 * NO service account / private key needed.
 *
 * When you get your service account JSON later, swap this for firebase-admin
 * verifyIdToken() for better performance (no external HTTP call per request).
 *
 * In DEV mode (SKIP_AUTH=true), verification is bypassed entirely.
 */
export const verifyFirebaseToken = async (idToken) => {
  // Dev bypass: set SKIP_AUTH=true in .env to skip token verification
  if (process.env.SKIP_AUTH === "true") {
    console.warn("⚠️  [DEV] Auth verification is DISABLED (SKIP_AUTH=true)");
    return { uid: "dev-user", email: "dev@localhost.com" };
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    throw new Error("FIREBASE_WEB_API_KEY is not set in environment variables");
  }

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { idToken },
      { headers: { "Content-Type": "application/json" } }
    );

    const user = response.data?.users?.[0];
    if (!user) throw new Error("No user found for this token");

    return {
      uid: user.localId,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    const msg =
      error.response?.data?.error?.message || error.message || "Invalid token";
    throw new Error(`Firebase token verification failed: ${msg}`);
  }
};
