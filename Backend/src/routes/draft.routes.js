import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  createDraft,
  getMyDrafts,
  getDraftById,
  updateDraft,
  toggleFavorite,
  deleteDraft,
} from "../controllers/draft.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createDraft);
router.get("/", getMyDrafts);
router.get("/:id", getDraftById);
router.put("/:id", updateDraft);
router.patch("/:id/favorite", toggleFavorite);
router.delete("/:id", deleteDraft);

export default router;
