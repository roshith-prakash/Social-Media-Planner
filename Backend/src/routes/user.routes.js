import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  getMe,
  updateMe,
  deleteMe,
  completeOnboarding,
  checkUsername,
  uploadAvatar,
} from "../controllers/user.controller.js";

const router = Router();

// Public
router.post("/check-username", checkUsername);

// Protected
router.use(authenticate);
router.get("/me", getMe);
router.put("/me", updateMe);
router.delete("/me", deleteMe);
router.post("/me/onboarding", completeOnboarding);
router.post("/me/avatar", uploadAvatar);

export default router;
