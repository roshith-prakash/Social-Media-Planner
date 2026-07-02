import UserRepository from "../repositories/UserRepository.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

/**
 * POST /api/v1/auth/register
 * Called after Firebase sign-up. Syncs the Firebase user to MongoDB.
 */
export const register = asyncWrapper(async (req, res) => {
  const { firebaseUID, email, name, photoURL } = req.body;

  if (!firebaseUID || !email) {
    return errorResponse(res, "firebaseUID and email are required", 400);
  }

  // Upsert: create if not exists
  let user = await UserRepository.findByFirebaseUID(firebaseUID);
  if (!user) {
    user = await UserRepository.create({
      firebaseUID,
      email: email.toLowerCase(),
      name: name || "",
      photoURL: photoURL || "",
    });
  }

  return successResponse(res, { user }, "User registered successfully", 201);
});

/**
 * POST /api/v1/auth/login
 * Called after Firebase sign-in. Returns the MongoDB user record.
 */
export const login = asyncWrapper(async (req, res) => {
  const { firebaseUID } = req.body;
  if (!firebaseUID) {
    return errorResponse(res, "firebaseUID is required", 400);
  }

  const user = await UserRepository.findByFirebaseUID(firebaseUID);
  if (!user) {
    return errorResponse(res, "User not found. Please register first.", 404);
  }

  return successResponse(res, { user }, "Login successful");
});
