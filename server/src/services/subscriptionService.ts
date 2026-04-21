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
  if (subscription.dodoSubscriptionId === "sub_test_premium_demo") {
    console.log("Demo subscription cancellation - Skipping Dodo API call");
  } else {
    await dodo.subscriptions.update(subscription.dodoSubscriptionId, {
      cancel_at_next_billing_date: true,
    });
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      cancelAt: subscription.currentPeriodEnd,
    },
  });

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`);
}

export async function reactivateSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.dodoSubscriptionId) {
    throw new Error("No subscription found");
  }

  await dodo.subscriptions.update(subscription.dodoSubscriptionId, {
    cancel_at_next_billing_date: false,
  });

  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: false,
      cancelAt: null,
    },
  });

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`);
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
    await redis.del(`${PREMIUM_CACHE_PREFIX}${subscription.userId}`);
  }
}

export async function handleCheckoutCompleted(
  sessionId: string,
  userId: string,
  dodoSubscriptionId?: string,
  dodoCustomerId?: string
): Promise<void> {
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscriptionData = {
    userId,
    status: "ACTIVE" as SubscriptionStatus,
    currentPeriodStart: new Date(),
    currentPeriodEnd: periodEnd,
    dodoCustomerId: dodoCustomerId || null,
    dodoSubscriptionId: dodoSubscriptionId || null,
    cancelAtPeriodEnd: false,
    cancelAt: null,
    trialEnd: null,
  };

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { userId },
      data: subscriptionData,
    });
  } else {
    await prisma.subscription.create({
      data: subscriptionData,
    });
  }

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`);
}

export async function getSubscriptionStatus(
  userId: string
): Promise<{ isPremium: boolean; subscription: SubscriptionInfo | null }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const now = new Date();

  // Trial is active if trialEnd is in the future
  const isTrialActive = subscription?.trialEnd && new Date(subscription.trialEnd) > now;

  // Subscription is active if status is ACTIVE/CANCELLED and currentPeriodEnd is in the future
  const isSubscriptionActive =
    (subscription?.status === SubscriptionStatus.ACTIVE || subscription?.status === SubscriptionStatus.CANCELLED) &&
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > now;

  const isPremium = !!(isTrialActive || isSubscriptionActive);

  return { isPremium, subscription };
}
