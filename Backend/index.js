import "dotenv/config";
import http from "http";
import express from "express";
import helmet from "helmet";
import cors from "cors";

// Config & DB
import prisma from "./src/config/prisma.js";
import "./src/config/cloudinary.js";
import "./src/config/gemini.js";

// Middleware
import errorHandler from "./src/middleware/errorHandler.js";
import { generalLimiter } from "./src/middleware/rateLimiter.js";

// Routes
import authRouter from "./src/routes/auth.routes.js";
import userRouter from "./src/routes/user.routes.js";
import videoRouter from "./src/routes/video.routes.js";
import analysisRouter from "./src/routes/analysis.routes.js";
import draftRouter from "./src/routes/draft.routes.js";

// ── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.disable("x-powered-by");

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} is not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(generalLimiter);

// ── Health Check ─────────────────────────────────────────────────────────────

app.get("/api/v1", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Social Media Companion API v2 is running",
    version: "2.0.0",
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/analysis", analysisRouter);
app.use("/api/v1/drafts", draftRouter);

// ── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    // Verify Prisma/MongoDB connection on startup
    await prisma.$connect();
    console.log("✅ Database connected via Prisma");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Env: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

start();
