import upload from "../utils/multer.js";
import { uploadVideo } from "../controllers/video.controller.js";
import { Router } from "express";

// Create a router.
const router = Router();

// Default route to check if auth routes are accessible.
router.get("/", (_, res) => {
    res.status(200).send({ data: "Auth Route" });
});

// ---------------------------------------------------------------------

// Video ROUTES

//.
router.post("/upload-video", upload.single("file"), uploadVideo);


export default router