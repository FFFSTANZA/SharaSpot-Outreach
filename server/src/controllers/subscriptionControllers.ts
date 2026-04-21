import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  createCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionStatus,
} from "../services/subscriptionService";
import { getCountryFromIp, isIndia } from "../utils/geoUtils";
import { SUBSCRIPTION_PRICE_USD, SUBSCRIPTION_INTERVAL } from "../config/subscription";
import { dodo } from "../config/dodo";

export async function getSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const countryCode = await getCountryFromIp(ipAddress);
    const region = isIndia(countryCode) ? "india" : "global";

    const { isPremium, subscription } = await getSubscriptionStatus(userId);

    res.json({
      isPremium,
      region,
      subscription: subscription
        ? {
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          trialEnd: subscription.trialEnd,
          dodoSubscriptionId: subscription.dodoSubscriptionId,
        }
        : null,
      pricing: {
        amount: SUBSCRIPTION_PRICE_USD,
        interval: SUBSCRIPTION_INTERVAL,
        currency: "USD",
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
}

export async function createSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const existing = await getSubscriptionStatus(userId);
    // Only block if they already have an active PAID subscription
    if (existing.subscription?.dodoSubscriptionId && existing.subscription.status === "ACTIVE") {
      res.status(400).json({ message: "Already subscribed to Pro Outreach Pro" });
      return;
    }

    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;

    const { checkoutUrl, sessionId } = await createCheckoutSession(
      userId,
      user.email,
      user.name,
      ipAddress
    );

    res.json({ checkoutUrl, sessionId });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      message: "Failed to create checkout session",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

export async function cancelUserSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await cancelSubscription(userId);
    res.json({ message: "Subscription will be cancelled at end of billing period" });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
}

export async function reactivateUserSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await reactivateSubscription(userId);
    res.json({ message: "Subscription reactivated" });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({ message: "Failed to reactivate subscription" });
  }
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  console.log("Dodo Webhook received:", req.body);

  const secret = process.env.DODO_WEBHOOK_SECRET;
  let event: any;

  if (secret) {
    try {
      const body = JSON.stringify(req.body);
      const headers = req.headers as Record<string, string>;
      event = dodo.webhooks.unwrap(body, { headers, key: secret });
      console.log(`[SUBSCRIPTION-WEBHOOK] Verified event: ${event.type}`);
    } catch (error) {
      console.error("[SUBSCRIPTION-WEBHOOK] Signature verification failed:", error);
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
  } else {
    console.warn("[SUBSCRIPTION-WEBHOOK] DODO_WEBHOOK_SECRET not set, skipping signature verification");
    event = req.body;
  }

  try {
    const { type, data } = event;

    switch (type) {
      case "checkout.session.completed":
        console.log(`[SUBSCRIPTION-WEBHOOK] Checkout completed: ${data.session_id}`);
        await handleCheckoutCompleted(
          data.session_id,
          data.metadata?.userId || data.customer_id,
          data.subscription_id,
          data.customer_id
        );
        break;

      case "subscription.active":
      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed":
      case "subscription.on_hold":
      case "subscription.renewed":
      case "subscription.updated":
        console.log(`[SUBSCRIPTION-WEBHOOK] Subscription updated: ${data.subscription_id || data.id} (${type})`);
        await handleSubscriptionUpdate(data);
        break;

      default:
        console.log(`[SUBSCRIPTION-WEBHOOK] Unhandled event type: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[SUBSCRIPTION-WEBHOOK] Error processing event:", error);
    res.status(500).json({ error: "Webhook handling failed" });
  }
}

async function handleCheckoutCompleted(
  sessionId: string,
  userId?: string,
  dodoSubscriptionId?: string,
  dodoCustomerId?: string
): Promise<void> {
  if (!userId) return;
  const { handleCheckoutCompleted: handleComplete } = await import("../services/subscriptionService");
  await handleComplete(sessionId, userId, dodoSubscriptionId, dodoCustomerId);
}

async function handleSubscriptionUpdate(data: any): Promise<void> {
  const { updateSubscriptionFromWebhook } = await import("../services/subscriptionService");
  await updateSubscriptionFromWebhook(data.id, {
    status: data.status,
    currentPeriodStart: data.current_period_start ? new Date(data.current_period_start * 1000) : undefined,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end * 1000) : undefined,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    cancelAt: data.cancel_at ? new Date(data.cancel_at * 1000) : null,
    trialEnd: data.trial_end ? new Date(data.trial_end * 1000) : null,
  });
}
