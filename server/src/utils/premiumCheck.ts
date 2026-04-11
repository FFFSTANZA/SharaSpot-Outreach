import { prisma } from "../config/prisma";
import { SubscriptionStatus } from "@prisma/client";

export interface PremiumCheckResult {
  isPremium: boolean;
  subscription: { status: SubscriptionStatus; currentPeriodEnd: Date } | null;
}

export async function checkPremiumStatus(userId: string): Promise<PremiumCheckResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const isPremium =
    subscription?.status === SubscriptionStatus.ACTIVE &&
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date();

  return { isPremium, subscription };
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
        ? `${featureName} is a premium feature. Please upgrade to access.`
        : "Premium subscription required. Please upgrade to access this feature.",
    };
  }

  return { allowed: true };
}
