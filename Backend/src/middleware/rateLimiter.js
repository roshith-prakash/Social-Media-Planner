import rateLimit from "express-rate-limit";

/**
 * General API rate limiter: 100 req / 15 min per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many requests. Please try again later." },
  },
});

/**
 * Analysis rate limiter: 10 analysis requests / hour per IP
 * Prevents abuse of the expensive Gemini multi-agent pipeline.
 */
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Analysis limit reached (10/hour). Please try again later.",
    },
  },
});
