import "server-only";
import Redis from "ioredis";
import { logger } from "@/lib/logger/logger";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    redisClient.on("error", (error) => {
      logger.error({ err: error }, "Redis connection error (rate limiter)");
    });
  }
  return redisClient;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
}

/**
 * Fixed-window rate limiter sederhana berbasis Redis INCR + EXPIRE.
 * Dipakai di Route Handler sensitif (login, export, backup trigger) untuk
 * mencegah brute-force dan penyalahgunaan resource-intensive endpoint.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);

  try {
    const redis = getRedisClient();
    const redisKey = `ratelimit:${key}`;

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }

    const ttl = await redis.pttl(redisKey);
    const resetAtMs = Date.now() + Math.max(ttl, 0);

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(maxRequests - count, 0),
      resetAtMs,
    };
  } catch (error) {
    // Jika Redis tidak tersedia, fail-open (izinkan request) supaya downtime Redis
    // tidak melumpuhkan seluruh aplikasi. Dicatat sebagai warning untuk observability.
    logger.warn({ err: error, key }, "Rate limiter fallback (Redis unavailable) - request diizinkan");
    return { allowed: true, remaining: 1, resetAtMs: Date.now() + windowMs };
  }
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
