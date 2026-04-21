import { getSubscriptionStatus } from "../services/subscriptionService";
import { redis } from "../config/redis";
import { PREMIUM_CACHE_PREFIX, PREMIUM_CACHE_TTL } from "../config/subscription";

export interface PremiumCheckResult {
  isPremium: boolean;
  subscription: any | null;
}

const CACHE_TTL = PREMIUM_CACHE_TTL;

export async function checkPremiumStatus(userId: string): Promise<PremiumCheckResult> {
  const cacheKey = `${PREMIUM_CACHE_PREFIX}${userId}`;

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error(`[premium-cache] Error reading from Redis: ${error}`);
  }

  // Cache miss - hit DB
  const result = await getSubscriptionStatus(userId);

  try {
    // Store in cache
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
  } catch (error) {
    console.error(`[premium-cache] Error writing to Redis: ${error}`);
  }

  return result;
}

export async function invalidatePremiumCache(userId: string): Promise<void> {
  const cacheKey = `${PREMIUM_CACHE_PREFIX}${userId}`;
  try {
    await redis.del(cacheKey);
  } catch (error) {
    console.error(`[premium-cache] Error invalidating Redis: ${error}`);
  }
}

export async function requirePremium(
  userId: string,
  featureName?: string
): Promise<{ allowed: boolean; message?: string }> {
  const { isPremium } = await checkPremiumStatus(userId);

  if (!isPremium) {
    return {
      allowed: false,
      message: featureName
        ? `${featureName} is a premium feature. Please subscribe to access.`
        : "Premium subscription required. Please subscribe to access this feature.",
    };
  }

  return { allowed: true };
}
