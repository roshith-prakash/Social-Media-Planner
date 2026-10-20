import Redis from "ioredis";

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: true,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn("⚠️  Redis: Max connection retry limit reached. Disabling Redis retries.");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on("connect", () => {
      console.log("⚡ [Redis] Connected successfully to Cloud/Local Redis");
    });

    redisClient.on("error", (err) => {
      console.warn("⚠️  [Redis] Client warning:", err.message);
    });
  } catch (err) {
    console.warn("⚠️  [Redis] Initialization failed:", err.message);
    redisClient = null;
  }
} else {
  console.log("ℹ️  [Redis] REDIS_URL not set. Running with MongoDB Atlas L2 cache only.");
}

/**
 * Checks if Redis is currently connected and operational
 */
export const isRedisConnected = () => {
  return redisClient && redisClient.status === "ready";
};

/**
 * Get cached JSON value by key
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export const redisGet = async (key) => {
  if (!redisClient) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Redis] Get failed for "${key}":`, err.message);
    return null;
  }
};

/**
 * Set key with JSON value and TTL in seconds
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - Default 7 days (604800s)
 * @returns {Promise<boolean>}
 */
export const redisSet = async (key, value, ttlSeconds = 604800) => {
  if (!redisClient) return false;
  try {
    const raw = JSON.stringify(value);
    await redisClient.set(key, raw, "EX", ttlSeconds);
    return true;
  } catch (err) {
    console.warn(`[Redis] Set failed for "${key}":`, err.message);
    return false;
  }
};

/**
 * Delete key from Redis
 * @param {string} key
 */
export const redisDel = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn(`[Redis] Del failed for "${key}":`, err.message);
  }
};

export default redisClient;
