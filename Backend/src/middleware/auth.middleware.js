import { verifyFirebaseToken } from "../config/firebase.js";
import { errorResponse } from "../utils/apiResponse.js";
import prisma from "../config/prisma.js";

/**
 * Middleware: verifies Firebase ID token and attaches user to req.
 * 1. Extracts Bearer token from Authorization header
 * 2. Verifies with Firebase REST API
 * 3. Loads user from MongoDB via Prisma
 * 4. Attaches req.firebaseUser (token data) and req.dbUser (MongoDB record)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(res, "No authorization token provided", 401);
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) {
      return errorResponse(res, "Invalid authorization header format", 401);
    }

    // Verify the token (Firebase REST API or dev bypass)
    const firebaseUser = await verifyFirebaseToken(idToken);
    req.firebaseUser = firebaseUser;

    // Load the user from MongoDB
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUID: firebaseUser.uid },
    });

    if (!dbUser) {
      return errorResponse(
        res,
        "User not found. Please complete registration.",
        404
      );
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    return errorResponse(res, error.message || "Authentication failed", 401);
  }
};

export default authenticate;
