import { getSubscriptionStatus } from "../services/subscriptionService";

export interface PremiumCheckResult {
  isPremium: boolean;
  subscription: any | null;
}

export async function checkPremiumStatus(userId: string): Promise<PremiumCheckResult> {
  return await getSubscriptionStatus(userId);
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
