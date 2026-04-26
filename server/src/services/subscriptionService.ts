import { prisma } from "../config/prisma";
import { dodo } from "../config/dodo";
import {
  DODO_PRODUCT_ID_GLOBAL,
  DODO_PRODUCT_ID_INDIA,
  getReturnUrl,
} from "../config/subscription";
import { SubscriptionStatus } from "@prisma/client";
import { isIndia, getCountryFromIp } from "../utils/geoUtils";
import { redis } from "../config/redis";
import { PREMIUM_CACHE_PREFIX } from "../config/subscription";

export interface CreateCheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
  trialEnd: Date | null;
  dodoSubscriptionId: string | null;
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  userName: string | null,
  ipAddress?: string
): Promise<CreateCheckoutSessionResult> {
  // Prevent duplicate subscriptions if already premium (Active or Trial)
  const { isPremium } = await getSubscriptionStatus(userId);
  if (isPremium) {
    throw new Error("User already has an active premium subscription or trial.");
  }

  // Detect country from IP
  const countryCode = ipAddress ? await getCountryFromIp(ipAddress) : null;
  const productId = isIndia(countryCode) ? DODO_PRODUCT_ID_INDIA : DODO_PRODUCT_ID_GLOBAL;

  const session = await dodo.checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
      },
    ],
    customer: {
      email: userEmail,
      name: userName || undefined,
    },
    return_url: getReturnUrl(userId),
    metadata: {
      userId,
    },
  });

  return {
    checkoutUrl: session.checkout_url || "",
    sessionId: session.session_id,
  };
}

export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || !subscription.dodoSubscriptionId) {
    throw new Error("No active subscription found");
  }

  // Handle demo/test subscriptions gracefully for UI testing
  if (subscription.dodoSubscriptionId !== "sub_test_premium_demo") {
    // Only update DB if Dodo API succeeds or if it's the demo ID
    try {
      await dodo.subscriptions.update(subscription.dodoSubscriptionId, {
        cancel_at_next_billing_date: true,
      });
    } catch (err: any) {
      console.error("[SUBSCRIPTION] Dodo cancelation failed:", err.message);
      throw new Error(`Failed to cancel subscription via payment provider: ${err.message}`);
    }
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      cancelAt: subscription.currentPeriodEnd,
    },
  });

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`).catch(() => { });
}

export async function reactivateSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.dodoSubscriptionId) {
    throw new Error("No subscription found");
  }

  if (subscription.dodoSubscriptionId !== "sub_test_premium_demo") {
    try {
      await dodo.subscriptions.update(subscription.dodoSubscriptionId, {
        cancel_at_next_billing_date: false,
      });
    } catch (err: any) {
      console.error("[SUBSCRIPTION] Dodo reactivation failed:", err.message);
      throw new Error(`Failed to reactivate subscription: ${err.message}`);
    }
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: false,
      cancelAt: null,
    },
  });

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`).catch(() => { });
}

export async function updateSubscriptionFromWebhook(
  dodoSubscriptionId: string,
  data: {
    status?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    cancelAt?: Date | null;
    trialEnd?: Date | null;
  }
): Promise<void> {
  const subscription = await prisma.subscription.findFirst({
    where: { dodoSubscriptionId },
  });

  if (!subscription) {
    console.warn(`[WEBHOOK] Subscription ${dodoSubscriptionId} not found in local DB.`);
    return;
  }

  const statusMap: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    cancelled: SubscriptionStatus.CANCELLED,
    expired: SubscriptionStatus.EXPIRED,
    on_hold: SubscriptionStatus.ON_HOLD,
  };

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: data.status ? statusMap[data.status] || SubscriptionStatus.ACTIVE : undefined,
      currentPeriodStart: data.currentPeriodStart || undefined,
      currentPeriodEnd: data.currentPeriodEnd || undefined,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      cancelAt: data.cancelAt,
      trialEnd: data.trialEnd,
    },
  });

  if (subscription.userId) {
    await redis.del(`${PREMIUM_CACHE_PREFIX}${subscription.userId}`).catch(() => { });
  }
}

export async function handleCheckoutCompleted(
  sessionId: string,
  userId: string,
  dodoSubscriptionId?: string,
  dodoCustomerId?: string
): Promise<void> {
  console.log(`[SUBSCRIPTION-SYNC] Finalizing checkout for user ${userId}, session ${sessionId}`);

  // Base dates for a new subscription
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Atomic sync or create
  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({ where: { userId } });

    const subscriptionData = {
      userId,
      status: SubscriptionStatus.ACTIVE,
      dodoCustomerId: dodoCustomerId || existing?.dodoCustomerId || null,
      dodoSubscriptionId: dodoSubscriptionId || existing?.dodoSubscriptionId || null,
      // Only set dates if not already present or if we are forced to
      currentPeriodStart: existing?.currentPeriodStart || periodStart,
      currentPeriodEnd: existing?.currentPeriodEnd || periodEnd,
      cancelAtPeriodEnd: existing?.cancelAtPeriodEnd ?? false,
      trialEnd: existing?.trialEnd || null,
    };

    if (existing) {
      await tx.subscription.update({
        where: { userId },
        data: subscriptionData,
      });
    } else {
      await tx.subscription.create({
        data: subscriptionData,
      });
    }
  });

  // Clear cache
  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`).catch(() => { });
  console.log(`[SUBSCRIPTION-SYNC] Success for ${userId}`);
}


export async function getSubscriptionStatus(
  userId: string
): Promise<{ isPremium: boolean; subscription: any | null }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return { isPremium: false, subscription: null };
  }

  const now = new Date();

  // Premium if subscription Active/Cancelled OR Trial is still active
  const isSubscriptionActive = (
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.CANCELLED
  ) && (
      subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now
    );

  const isTrialActive = subscription.trialEnd && new Date(subscription.trialEnd) > now;
  const isPremium = !!(isSubscriptionActive || isTrialActive);

  return { isPremium, subscription };
}
