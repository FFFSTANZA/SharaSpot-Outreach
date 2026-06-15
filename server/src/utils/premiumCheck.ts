import { getSubscriptionStatus } from "../services/subscriptionService";
import { redis } from "../config/redis";
import { PREMIUM_CACHE_PREFIX, PREMIUM_CACHE_TTL } from "../config/subscription";
import { logger } from "./logger";

export interface PremiumCheckResult {
  isPremium: boolean;
  subscription: any | null;
}

const CACHE_TTL = PREMIUM_CACHE_TTL;

function getDirectPremiumExpiry(subscription: any | null): Date | null {
  if (!subscription) return null;

  const candidates = [subscription.currentPeriodEnd, subscription.trialEnd]
    .map((value) => (value ? new Date(value) : null))
    .filter((value): value is Date => !!value && !Number.isNaN(value.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return candidates[0] || null;
}

function getCacheTtlSeconds(result: PremiumCheckResult): number {
  if (!result.isPremium) return Math.min(CACHE_TTL, 60);

  const directExpiry = getDirectPremiumExpiry(result.subscription);
  if (!directExpiry) return CACHE_TTL;

  const secondsUntilExpiry = Math.ceil((directExpiry.getTime() - Date.now()) / 1000);
  return Math.max(1, Math.min(CACHE_TTL, secondsUntilExpiry));
}

export async function checkPremiumStatus(userId: string): Promise<PremiumCheckResult> {
  const cacheKey = `${PREMIUM_CACHE_PREFIX}${userId}`;

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as PremiumCheckResult;
      if (!parsed.isPremium) {
        return parsed;
      }

      const directExpiry = getDirectPremiumExpiry(parsed.subscription);
      const hasAnyDirectPremiumWindow = !!parsed.subscription?.currentPeriodEnd || !!parsed.subscription?.trialEnd;
      if (!hasAnyDirectPremiumWindow || !directExpiry || directExpiry.getTime() > Date.now()) {
        return parsed;
      }

      await redis.del(cacheKey);
    }
  } catch (error) {
    logger.error(`[premium-cache] Error reading from Redis: ${error}`);
  }

  // Cache miss - hit DB
  const result = await getSubscriptionStatus(userId);

  try {
    // Store in cache
    await redis.set(cacheKey, JSON.stringify(result), "EX", getCacheTtlSeconds(result));
  } catch (error) {
    logger.error(`[premium-cache] Error writing to Redis: ${error}`);
  }

  return result;
}

export async function invalidatePremiumCache(userId: string): Promise<void> {
  const cacheKey = `${PREMIUM_CACHE_PREFIX}${userId}`;
  try {
    await redis.del(cacheKey);
  } catch (error) {
    logger.error(`[premium-cache] Error invalidating Redis: ${error}`);
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
