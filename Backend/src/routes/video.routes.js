import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  getUploadSignature,
  createVideoProject,
  getMyProjects,
  getProjectById,
  deleteProject,
} from "../controllers/video.controller.js";

const router = Router();

router.use(authenticate);

router.get("/upload-signature", getUploadSignature);
router.post("/", createVideoProject);
router.get("/", getMyProjects);
router.get("/:id", getProjectById);
router.delete("/:id", deleteProject);

export default router;
