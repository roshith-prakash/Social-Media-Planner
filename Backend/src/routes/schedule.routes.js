import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  schedulePost,
  publishNowPost,
  getScheduledPosts,
  cancelScheduledPost,
  verifyPostStatus,
  verifyAllPosts,
} from "../controllers/schedule.controller.js";

const router = Router();

router.use(authenticate);

router.post("/now", publishNowPost);
router.post("/verify-all", verifyAllPosts);
router.post("/:id/verify", verifyPostStatus);
router.post("/", schedulePost);
router.get("/", getScheduledPosts);
router.delete("/:id", cancelScheduledPost);

export default router;
