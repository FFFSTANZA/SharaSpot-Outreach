import { prisma } from "../config/prisma";
import { dodo } from "../config/dodo";
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
    console.error("[AUDIT] Failed to log payment event:", err);
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

  console.log(`[CHECKOUT] Creating session for user ${userId}, product: ${productId}, country: ${countryCode}`);

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
    console.error("[CHECKOUT] CRITICAL: No session_id returned from Dodo!", session);
    throw new Error("Payment provider failed to create checkout session");
  }

  console.log(`[CHECKOUT] Session created: ${sessionId} for user ${userId}`);

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
  if (!dodoSubscriptionId) {
    console.error("[WEBHOOK] updateSubscriptionFromWebhook called with no subscription ID");
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { dodoSubscriptionId },
  });

  if (!subscription) {
    console.warn(`[WEBHOOK] Subscription ${dodoSubscriptionId} not found in local DB.`);
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

  console.log(`[WEBHOOK] Updated subscription ${dodoSubscriptionId}: ${previousStatus} -> ${newStatus || previousStatus}`);
}

export async function handleCheckoutCompleted(
  sessionId: string,
  userId: string,
  dodoSubscriptionId?: string,
  dodoCustomerId?: string
): Promise<void> {
  console.log(`[SUBSCRIPTION-SYNC] Finalizing checkout for user ${userId}, session ${sessionId}, subId: ${dodoSubscriptionId}`);

  if (!userId) {
    console.error("[SUBSCRIPTION-SYNC] CRITICAL: No userId provided!");
    throw new Error("User ID is required for checkout completion");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`[SUBSCRIPTION-SYNC] CRITICAL: User ${userId} not found!`);
    throw new Error(`User ${userId} not found`);
  }

  let dodoSubData: any = null;

  if (dodoSubscriptionId && dodoSubscriptionId !== "sub_test_premium_demo") {
    try {
      dodoSubData = await dodo.subscriptions.retrieve(dodoSubscriptionId);
      console.log(`[SUBSCRIPTION-SYNC] Fetched Dodo subscription ${dodoSubscriptionId}:`, {
        status: dodoSubData?.status,
        nextBillingDate: dodoSubData?.next_billing_date,
        trialPeriodDays: dodoSubData?.trial_period_days,
      });
    } catch (err: any) {
      console.warn(`[SUBSCRIPTION-SYNC] Could not fetch Dodo subscription ${dodoSubscriptionId}:`, err.message);
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
      console.log(`[SUBSCRIPTION-SYNC] Updated existing subscription for ${userId}`);
    } else {
      await tx.subscription.create({
        data: subscriptionData,
      });
      console.log(`[SUBSCRIPTION-SYNC] Created new subscription for ${userId}`);
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

  console.log(`[SUBSCRIPTION-SYNC] Success for user ${userId}`);
}

export async function activateSubscriptionFromPayment(
  userId: string,
  dodoSubscriptionId?: string,
  dodoCustomerId?: string,
  sessionId?: string,
  paymentId?: string
): Promise<void> {
  console.log(`[SUBSCRIPTION-ACTIVATE] Activating for user ${userId}, subId: ${dodoSubscriptionId}, paymentId: ${paymentId}`);

  if (!userId) {
    throw new Error("User ID is required");
  }

  let dodoSubData: any = null;

  if (dodoSubscriptionId && dodoSubscriptionId !== "sub_test_premium_demo") {
    try {
      dodoSubData = await dodo.subscriptions.retrieve(dodoSubscriptionId);
    } catch (err: any) {
      console.warn(`[SUBSCRIPTION-ACTIVATE] Could not fetch Dodo subscription ${dodoSubscriptionId}:`, err.message);
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
      console.log(`[SUBSCRIPTION-ACTIVATE] Updated subscription for ${userId}`);
    } else {
      await tx.subscription.create({
        data: subscriptionData,
      });
      console.log(`[SUBSCRIPTION-ACTIVATE] Created subscription for ${userId}`);
    }
  });

  await redis.del(`${PREMIUM_CACHE_PREFIX}${userId}`).catch(() => { });

  console.log(`[SUBSCRIPTION-ACTIVATE] Success for user ${userId}`);
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
      console.warn(`[SYNC] No Dodo subscription found for ${subscription.dodoSubscriptionId}`);
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

    console.log(`[SYNC] Successfully synced subscription for user ${userId}: ${dodoSub.status}`);

    const updatedSub = await prisma.subscription.findUnique({ where: { userId } });
    return { synced: true, subscription: updatedSub };
  } catch (err: any) {
    console.error(`[SYNC] Failed to sync subscription for user ${userId}:`, err.message);
    return { synced: false, subscription };
  }
}
