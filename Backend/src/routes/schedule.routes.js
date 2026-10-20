import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  schedulePost,
  publishNowPost,
  getScheduledPosts,
  cancelScheduledPost,
} from "../controllers/schedule.controller.js";

const router = Router();

router.use(authenticate);

router.post("/now", publishNowPost);
router.post("/", schedulePost);
router.get("/", getScheduledPosts);
router.delete("/:id", cancelScheduledPost);

export default router;
