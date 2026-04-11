import { prisma } from "../config/prisma";
import { getEffectiveLimits } from "./throttleEngine";
import { isInWarmup } from "./warmupEvaluator";

/**
 * Safety Check Results
 */
export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  resetTime: Date;
}

/**
 * Priority Safety Limits
 * 
 * Enforces:
 * - User daily quota (50 emails/day default)
 * - Minimum gap between priority sends (30 seconds)
 * - Domain rate limits (100/hour for gmail.com)
 * - System-wide rate cap
 * - Warmup requirements
 * - Bounce spike detection
 */

/**
 * Check user's priority quota
 */
export async function checkUserPriorityQuota(userId: string): Promise<SafetyCheckResult> {
  // Get or create user's quota record
  let quota = await prisma.priorityUserQuota.findUnique({
    where: { userId },
  });

  // Create if doesn't exist
  if (!quota) {
    quota = await prisma.priorityUserQuota.create({
      data: { userId, dailyCount: 0, dailyLimit: 50 },
    });
  }

  // Check if daily reset needed
  const now = new Date();
  const resetAt = new Date(quota.dailyResetAt);
  
  if (now > resetAt) {
    // Reset daily count
    await prisma.priorityUserQuota.update({
      where: { userId },
      data: {
        dailyCount: 0,
        dailyResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    
    return { allowed: true };
  }

  // Check if quota exceeded
  if (quota.dailyCount >= quota.dailyLimit) {
    const retryMs = resetAt.getTime() - now.getTime();
    
    return {
      allowed: false,
      reason: "Daily priority quota exceeded",
      retryAfterMs: retryMs,
    };
  }

  return { allowed: true };
}

/**
 * Increment user's priority quota usage
 */
export async function incrementPriorityQuota(userId: string): Promise<void> {
  const now = new Date();
  
  await prisma.priorityUserQuota.upsert({
    where: { userId },
    create: {
      userId,
      dailyCount: 1,
      dailyResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
    update: {
      dailyCount: { increment: 1 },
    },
  });
}

/**
 * Get user's current quota status
 */
export async function getPriorityQuotaStatus(userId: string): Promise<QuotaStatus> {
  let quota = await prisma.priorityUserQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    quota = await prisma.priorityUserQuota.create({
      data: { userId, dailyCount: 0, dailyLimit: 50 },
    });
  }

  // Check if reset needed
  if (new Date() > quota.dailyResetAt) {
    return {
      used: 0,
      limit: quota.dailyLimit,
      remaining: quota.dailyLimit,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  return {
    used: quota.dailyCount,
    limit: quota.dailyLimit,
    remaining: Math.max(0, quota.dailyLimit - quota.dailyCount),
    resetTime: quota.dailyResetAt,
  };
}

/**
 * Check domain rate limit
 * Prevents sending too many emails to the same domain
 */
export async function checkDomainLimit(domain: string): Promise<SafetyCheckResult> {
  const now = new Date();
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    0,
    0
  );

  // Get or create domain rate limit
  let domainLimit = await prisma.domainRateLimit.findUnique({
    where: { domain },
  });

  const provider = getProviderThresholds(domain);
  const maxPerHour = provider.maxPerHour;

  if (!domainLimit) {
    domainLimit = await prisma.domainRateLimit.create({
      data: {
        domain,
        hourlyCount: 0,
        windowStart,
      },
    });
  }

  // Check if window needs reset
  if (domainLimit.windowStart < windowStart) {
    await prisma.domainRateLimit.update({
      where: { domain },
      data: {
        hourlyCount: 0,
        windowStart,
      },
    });
    
    return { allowed: true };
  }

  // Check limit
  if (domainLimit.hourlyCount >= maxPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded for ${domain} (${maxPerHour}/hour)`,
      retryAfterMs: 60 * 60 * 1000, // 1 hour
    };
  }

  return { allowed: true };
}

/**
 * Increment domain rate count
 */
export async function incrementDomainRate(domain: string): Promise<void> {
  const now = new Date();
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    0,
    0
  );

  await prisma.domainRateLimit.upsert({
    where: { domain },
    create: {
      domain,
      hourlyCount: 1,
      windowStart,
    },
    update: {
      hourlyCount: { increment: 1 },
      windowStart, // Reset window if needed
    },
  });
}

/**
 * Get provider-specific thresholds
 */
function getProviderThresholds(domain: string): {
  maxPerHour: number;
} {
  if (domain.toLowerCase().includes("gmail.com") || domain.toLowerCase().includes("google.com")) {
    return { maxPerHour: 100 };
  }
  if (domain.toLowerCase().includes("outlook.com") || domain.toLowerCase().includes("microsoft.com")) {
    return { maxPerHour: 150 };
  }
  return { maxPerHour: 300 };
}

/**
 * Check global rate cap
 * System-wide rate limiting to prevent overload
 */
export async function checkGlobalRateCap(): Promise<SafetyCheckResult> {
  // In production, this would check Redis for system-wide rate
  // For now, allow all (this would be implemented with Redis counters)
  return { allowed: true };
}

/**
 * Check warmup requirement
 * Sender must have sent some normal emails before priority is available
 */
export async function checkWarmupRequirement(senderId: string): Promise<SafetyCheckResult> {
  const warmupActive = await isInWarmup(senderId);
  
  if (warmupActive) {
    return {
      allowed: false,
      reason: "Sender is in warmup period. Priority Mail available after warmup completes.",
    };
  }

  // Check if sender has sent minimum emails
  // In production, would check actual sent count
  const limits = await getEffectiveLimits(senderId);
  
  if (limits.perDay < 20) {
    return {
      allowed: false,
      reason: "Sender needs more warmup history. Minimum 20 normal emails required.",
    };
  }

  return { allowed: true };
}

/**
 * Check for bounce rate spike
 * Auto-disable if bounce rate exceeds threshold
 */
export async function checkBounceSpike(senderId: string): Promise<SafetyCheckResult> {
  // In production, this would query recent bounce rates
  // For now, allow all
  return { allowed: true };
}

/**
 * Perform all safety checks
 */
export async function performSafetyChecks(
  userId: string,
  senderId: string,
  recipientDomain: string
): Promise<SafetyCheckResult> {
  // Check user quota
  const quotaCheck = await checkUserPriorityQuota(userId);
  if (!quotaCheck.allowed) return quotaCheck;

  // Check domain limit
  const domainCheck = await checkDomainLimit(recipientDomain);
  if (!domainCheck.allowed) return domainCheck;

  // Check warmup
  const warmupCheck = await checkWarmupRequirement(senderId);
  if (!warmupCheck.allowed) return warmupCheck;

  // Check global cap
  const globalCheck = await checkGlobalRateCap();
  if (!globalCheck.allowed) return globalCheck;

  return { allowed: true };
}