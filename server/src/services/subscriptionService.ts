import { prisma } from "../config/prisma";
import { dodo } from "../config/dodo";
import { logger } from "../utils/logger";
import {
  DODO_PRODUCT_ID_GLOBAL,
  DODO_PRODUCT_ID_INDIA,
  getReturnUrl,
  getCancelUrl,
} from "../config/subscription";
import { SubscriptionStatus, LogLevel } from "@prisma/client";
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

export async function logPaymentAuditEvent(
  eventType: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.systemAuditLog.create({
      data: {
        level: LogLevel.INFO,
        category: "PAYMENT",
        message: `[PAYMENT] ${eventType}: ${entityId}`,
        metadata: {
          eventType,
          entityId,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "[AUDIT] Failed to log payment event");
  }
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  userName: string | null,
  ipAddress?: string
): Promise<CreateCheckoutSessionResult> {
  const { isPremium } = await getSubscriptionStatus(userId);
  if (isPremium) {
    throw new Error("User already has an active premium subscription or trial.");
  }

  const countryCode = ipAddress ? await getCountryFromIp(ipAddress) : null;
  const productId = isIndia(countryCode) ? DODO_PRODUCT_ID_INDIA : DODO_PRODUCT_ID_GLOBAL;

  logger.info({ userId, productId, countryCode }, "[CHECKOUT] Creating session");

  // Local development fallback with placeholder API keys
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (process.env.NODE_ENV !== "production" && (!apiKey || apiKey.startsWith("local_placeholder") || apiKey.includes("placeholder"))) {
    logger.info({ userId }, "[CHECKOUT] Using local mock checkout session");
    const mockSessionId = `sess_mock_${Math.random().toString(36).substring(2, 15)}`;
    // Simulate webhook payment completion in the background in development
    setTimeout(async () => {
      try {
        await handleCheckoutCompleted(mockSessionId, userId, "sub_test_premium_demo", "cust_mock_123");
        logger.info({ userId }, "[MOCK-PAYMENT] Successfully activated local premium");
      } catch (err) {
        logger.error({ err }, "[MOCK-PAYMENT] Failed to activate local premium");
      }
    }, 1000);

    return {
      checkoutUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?subscription=success&userId=${userId}`,
      sessionId: mockSessionId,
    };
  }

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
    cancel_url: `${getCancelUrl(userId)}`,
    metadata: {
      userId,
    },
  });

  const sessionId = session.session_id;
  const checkoutUrl = session.checkout_url || "";

  if (!sessionId) {
    logger.error({ session }, "[CHECKOUT] No session_id returned from Dodo");
    throw new Error("Payment provider failed to create checkout session");
  }

  logger.info({ userId, sessionId }, "[CHECKOUT] Session created");

  return {
    checkoutUrl,
    sessionId,
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
      logger.error({ err }, "[SUBSCRIPTION] Dodo cancelation failed");
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
      logger.error({ err }, "[SUBSCRIPTION] Dodo reactivation failed");
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
  if (!dodoSubscriptionId) {
    logger.error("[WEBHOOK] updateSubscriptionFromWebhook called with no subscription ID");
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { dodoSubscriptionId },
  });

  if (!subscription) {
    logger.warn({ dodoSubscriptionId }, "[WEBHOOK] Subscription not found in local DB");
    await logPaymentAuditEvent("subscription.update.failed", dodoSubscriptionId, {
      reason: "subscription_not_found",
      dodoSubscriptionId,
    });
    return;
  }

  const statusMap: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    pending: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    cancelled: SubscriptionStatus.CANCELLED,
    expired: SubscriptionStatus.EXPIRED,
    on_hold: SubscriptionStatus.ON_HOLD,
    failed: SubscriptionStatus.PAST_DUE,
  };

  const previousStatus = subscription.status;
  const newStatus = data.status ? statusMap[data.status] || SubscriptionStatus.ACTIVE : undefined;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      currentPeriodStart: data.currentPeriodStart || undefined,
      currentPeriodEnd: data.currentPeriodEnd || undefined,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      cancelAt: data.cancelAt,
      trialEnd: data.trialEnd,
    },
  });

  await logPaymentAuditEvent("subscription.updated", subscription.userId, {
    dodoSubscriptionId,
    previousStatus,
    newStatus: newStatus?.toString() || previousStatus.toString(),
    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    periodEnd: data.currentPeriodEnd,
  });

  if (subscription.userId) {
    await redis.del(`${PREMIUM_CACHE_PREFIX}${subscription.userId}`).catch(() => { });
  }

  logger.info({ dodoSubscriptionId, previousStatus, newStatus }, "[WEBHOOK] Updated subscription");
}

export async function handleCheckoutCompleted(
  sessionId: string,
  userId: string,
  dodoSubscriptionId?: string,
  dodoCustomerId?: string
): Promise<void> {
  logger.info({ userId, sessionId, dodoSubscriptionId }, "[SUBSCRIPTION-SYNC] Finalizing checkout");

  if (!userId) {
    logger.error("[SUBSCRIPTION-SYNC] No userId provided");
    throw new Error("User ID is required for checkout completion");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    logger.error({ userId }, "[SUBSCRIPTION-SYNC] User not found");
    throw new Error(`User ${userId} not found`);
  }

  let dodoSubData: any = null;

  if (dodoSubscriptionId && dodoSubscriptionId !== "sub_test_premium_demo") {
    try {
      dodoSubData = await dodo.subscriptions.retrieve(dodoSubscriptionId);
      logger.info({ dodoSubscriptionId, status: dodoSubData?.status }, "[SUBSCRIPTION-SYNC] Fetched Dodo subscription");
    } catch (err: any) {
      logger.warn({ err, dodoSubscriptionId }, "[SUBSCRIPTION-SYNC] Could not fetch Dodo subscription");
    }
  }

  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (dodoSubData?.previous_billing_date) {
    periodStart = new Date(dodoSubData.previous_billing_date);
  } else if (dodoSubData?.next_billing_date) {
    periodStart = new Date(dodoSubData.next_billing_date);
    periodStart.setMonth(periodStart.getMonth() - 1);
  } else {
    periodStart = now;
  }

  if (dodoSubData?.next_billing_date) {
    periodEnd = new Date(dodoSubData.next_billing_date);
  } else {
    periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  let trialEnd: Date | null = null;
  if (dodoSubData?.trial_period_days && dodoSubData.trial_period_days > 0) {
    trialEnd = new Date(periodStart);
    trialEnd.setDate(trialEnd.getDate() + dodoSubData.trial_period_days);
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({ where: { userId } });

    const subscriptionData = {
      userId,
      status: SubscriptionStatus.ACTIVE,
      dodoCustomerId: dodoCustomerId || existing?.dodoCustomerId || null,
      dodoSubscriptionId: dodoSubscriptionId || existing?.dodoSubscriptionId || null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false, // Reset on new checkout/activation
      trialEnd: trialEnd,
    };

    if (existing) {
      await tx.subscription.update({
        where: { userId },
        data: subscriptionData,
      });
      logger.info({ userId }, "[SUBSCRIPTION-SYNC] Updated existing subscription");
    } else {
      await tx.subscription.create({
        data: subscriptionData,
      });
      logger.info({ userId }, "[SUBSCRIPTION-SYNC] Created new subscription");
    }

    await tx.systemAuditLog.create({
      data: {
        level: LogLevel.INFO,
        category: "PAYMENT",
        message: `[SUBSCRIPTION] Checkout completed for user ${userId}`,
        metadata: {
          sessionId,
          dodoSubscriptionId,
          dodoCustomerId,
          periodStart,
          periodEnd,
          trialEnd,
        },
      },
    });
  });

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`).catch(() => { });

  await logPaymentAuditEvent("subscription.created", userId, {
    sessionId,
    dodoSubscriptionId,
    dodoCustomerId,
  });

  logger.info({ userId }, "[SUBSCRIPTION-SYNC] Success");
}

export async function activateSubscriptionFromPayment(
  userId: string,
  dodoSubscriptionId?: string,
  dodoCustomerId?: string,
  sessionId?: string,
  paymentId?: string
): Promise<void> {
  logger.info({ userId, dodoSubscriptionId, paymentId }, "[SUBSCRIPTION-ACTIVATE] Activating");

  if (!userId) {
    throw new Error("User ID is required");
  }

  let dodoSubData: any = null;

  if (dodoSubscriptionId && dodoSubscriptionId !== "sub_test_premium_demo") {
    try {
      dodoSubData = await dodo.subscriptions.retrieve(dodoSubscriptionId);
    } catch (err: any) {
      logger.warn({ err, dodoSubscriptionId }, "[SUBSCRIPTION-ACTIVATE] Could not fetch Dodo subscription");
    }
  }

  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (dodoSubData?.previous_billing_date) {
    periodStart = new Date(dodoSubData.previous_billing_date);
  } else if (dodoSubData?.next_billing_date) {
    periodStart = new Date(dodoSubData.next_billing_date);
    periodStart.setMonth(periodStart.getMonth() - 1);
  } else {
    periodStart = now;
  }

  if (dodoSubData?.next_billing_date) {
    periodEnd = new Date(dodoSubData.next_billing_date);
  } else {
    periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  let trialEnd: Date | null = null;
  if (dodoSubData?.trial_period_days && dodoSubData.trial_period_days > 0) {
    trialEnd = new Date(periodStart);
    trialEnd.setDate(trialEnd.getDate() + dodoSubData.trial_period_days);
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({ where: { userId } });

    const subscriptionData = {
      userId,
      status: SubscriptionStatus.ACTIVE,
      dodoCustomerId: dodoCustomerId || existing?.dodoCustomerId || null,
      dodoSubscriptionId: dodoSubscriptionId || existing?.dodoSubscriptionId || null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false, // Reset on activation
      trialEnd: trialEnd,
    };

    if (existing) {
      await tx.subscription.update({
        where: { userId },
        data: subscriptionData,
      });
      logger.info({ userId }, "[SUBSCRIPTION-ACTIVATE] Updated subscription");
    } else {
      await tx.subscription.create({
        data: subscriptionData,
      });
      logger.info({ userId }, "[SUBSCRIPTION-ACTIVATE] Created subscription");
    }
  });

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`).catch(() => { });

  logger.info({ userId }, "[SUBSCRIPTION-ACTIVATE] Success");
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
  const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd) : null;

  const isActiveStatus = subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.ON_HOLD;
  const hasValidPeriod = currentPeriodEnd && currentPeriodEnd > now;
  const isSubscriptionActive = isActiveStatus && hasValidPeriod;
  const isTrialActive = trialEnd && trialEnd > now;

  const isPremium = isSubscriptionActive || isTrialActive;

  return { isPremium: !!isPremium, subscription };
}

export async function syncSubscriptionFromDodo(userId: string): Promise<{ synced: boolean; subscription: any | null }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.dodoSubscriptionId || subscription.dodoSubscriptionId === "sub_test_premium_demo") {
    return { synced: false, subscription };
  }

  try {
    const dodoSubRaw = await dodo.subscriptions.retrieve(subscription.dodoSubscriptionId);
    const dodoSub = dodoSubRaw as any;

    if (!dodoSub) {
      logger.warn({ dodoSubId: subscription.dodoSubscriptionId }, "[SYNC] No Dodo subscription found");
      return { synced: false, subscription };
    }

    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      pending: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      cancelled: SubscriptionStatus.CANCELLED,
      expired: SubscriptionStatus.EXPIRED,
      on_hold: SubscriptionStatus.ON_HOLD,
      failed: SubscriptionStatus.PAST_DUE,
    };

    let currentPeriodStart: Date | undefined;
    let currentPeriodEnd: Date | undefined;
    let trialEnd: Date | null = null;

    if (dodoSub.previous_billing_date) {
      currentPeriodStart = new Date(dodoSub.previous_billing_date);
    }
    if (dodoSub.next_billing_date) {
      currentPeriodEnd = new Date(dodoSub.next_billing_date);
    }
    if (dodoSub.trial_period_days && dodoSub.trial_period_days > 0) {
      trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + dodoSub.trial_period_days);
    }

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: statusMap[dodoSub.status] || subscription.status,
        currentPeriodStart: currentPeriodStart || undefined,
        currentPeriodEnd: currentPeriodEnd || undefined,
        cancelAtPeriodEnd: dodoSub.cancel_at_next_billing_date ?? false,
        trialEnd: trialEnd,
      },
    });

    await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`).catch(() => { });

    await logPaymentAuditEvent("subscription.synced", userId, {
      dodoSubscriptionId: subscription.dodoSubscriptionId,
      newStatus: dodoSub.status,
    });

    logger.info({ userId, status: dodoSub.status }, "[SYNC] Successfully synced subscription");

    const updatedSub = await prisma.subscription.findUnique({ where: { userId } });
    return { synced: true, subscription: updatedSub };
  } catch (err: any) {
    logger.error({ err, userId }, "[SYNC] Failed to sync subscription");
    return { synced: false, subscription };
  }
}
