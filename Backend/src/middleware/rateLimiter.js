import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.js";

const createStore = (prefix) => {
  if (redisClient) {
    try {
      return new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${prefix}:`,
      });
    } catch (err) {
      console.warn(`[RateLimiter] Failed to initialize RedisStore for "${prefix}":`, err.message);
    }
  }
  return undefined; // Falls back to express-rate-limit MemoryStore
};

const isDev = process.env.NODE_ENV !== "production";

/**
 * General API rate limiter: 100 req / 15 min per IP in production, 5000 in dev
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 100,
  skip: (req) => isDev && (req.ip === "::1" || req.ip === "127.0.0.1"),
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("general"),
  message: {
    success: false,
    error: { message: "Too many requests. Please try again later." },
  },
});

/**
 * Analysis rate limiter: 10 analysis requests / hour per IP in production, 100 in dev
 */
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 100 : 10,
  skip: (req) => isDev && (req.ip === "::1" || req.ip === "127.0.0.1"),
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("analysis"),
  message: {
    success: false,
    error: {
      message: "Analysis limit reached. Please try again later.",
    },
  },
});
