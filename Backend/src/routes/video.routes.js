import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  getUploadSignature,
  createVideoProject,
  getMyProjects,
  getProjectById,
  deleteProject,
  getSignedUrl,
} from "../controllers/video.controller.js";
import { validate } from "../middleware/validate.js";
import { createVideoSchema } from "../schemas/video.schema.js";

const router = Router();

router.use(authenticate);

router.get("/upload-signature", getUploadSignature);
router.post("/", validate(createVideoSchema), createVideoProject);
router.get("/", getMyProjects);
router.get("/signed/:publicId", getSignedUrl);
router.get("/:id", getProjectById);
router.delete("/:id", deleteProject);

export default router;

