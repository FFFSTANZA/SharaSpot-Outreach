import { prisma } from "../config/prisma";
import { dodo } from "../config/dodo";
import {
  DODO_PRODUCT_ID_MONTHLY,
  getReturnUrl,
} from "../config/subscription";
import { SubscriptionStatus } from "@prisma/client";

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
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  userName: string | null
): Promise<CreateCheckoutSessionResult> {
  const session = await dodo.checkoutSessions.create({
    product_cart: [
      {
        product_id: DODO_PRODUCT_ID_MONTHLY,
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

  if (!subscription?.dodoSubscriptionId) {
    throw new Error("No active subscription found");
  }

  await dodo.subscriptions.update(subscription.dodoSubscriptionId, {
    cancel_at_next_billing_date: true,
  });

  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      cancelAt: subscription.currentPeriodEnd,
    },
  });
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
}

export async function handleCheckoutCompleted(
  sessionId: string,
  userId: string
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
    dodoCustomerId: null as string | null,
    dodoSubscriptionId: null as string | null,
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

  // Subscription is active if status is ACTIVE and currentPeriodEnd is in the future
  const isSubscriptionActive =
    subscription?.status === SubscriptionStatus.ACTIVE &&
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > now;

  const isPremium = !!(isTrialActive || isSubscriptionActive);

  return { isPremium, subscription };
}
