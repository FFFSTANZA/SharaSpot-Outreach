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

    let { isPremium, subscription } = await getSubscriptionStatus(userId);

    // FAIL-SAFE: If not premium locally but has a Dodo record, try one-time sync from Dodo API
    if (!isPremium && subscription?.dodoSubscriptionId) {
      try {
        const dodoSub = await dodo.subscriptions.retrieve(subscription.dodoSubscriptionId);
        if (dodoSub) {
          const { updateSubscriptionFromWebhook } = await import("../services/subscriptionService");
          const s = dodoSub as any;
          await updateSubscriptionFromWebhook(s.subscription_id, {
            status: s.status,
            currentPeriodStart: new Date(s.current_period_start),
            currentPeriodEnd: new Date(s.current_period_end),
            cancelAtPeriodEnd: s.cancel_at_next_billing_date,
            trialEnd: s.trial_period_end ? new Date(s.trial_period_end) : null,
          });
          // Re-fetch after sync
          const refreshed = await getSubscriptionStatus(userId);
          isPremium = refreshed.isPremium;
          subscription = refreshed.subscription;
          console.log(`[SYNC-FAILSAFE] Synced ${userId} from Dodo API`);
        }
      } catch (syncErr) {
        console.warn("[SYNC-FAILSAFE] Background sync failed:", syncErr);
      }
    }

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
          dodoCustomerId: subscription.dodoCustomerId,
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

/**
 * Safely parse dates from Dodo Payments (handles seconds vs milliseconds vs ISO strings)
 */
function parseDodoDate(dateInput: any): Date | undefined {
  if (!dateInput) return undefined;
  if (typeof dateInput === 'number') {
    return new Date(dateInput < 10000000000 ? dateInput * 1000 : dateInput);
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.DODO_WEBHOOK_SECRET?.trim();
  let event: any;

  if (secret) {
    try {
      const rawBody = (req as any).rawBody;
      const body = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : (typeof rawBody === "string" ? rawBody : JSON.stringify(req.body));
      const headers = {
        "svix-id": req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      };

      event = dodo.webhooks.unwrap(body, { headers, key: secret });
    } catch (error: any) {
      console.error("[WEBHOOK] Auth Failed:", error.message);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } else {
    event = req.body;
  }

  try {
    const { type, data, id: eventId } = event;
    console.log(`[WEBHOOK] Received ${type} (ID: ${eventId})`);

    // Webhook Idempotency: Check if we already processed this event
    const alreadyProcessed = await prisma.processedWebhook.findUnique({
      where: { eventId },
    });

    if (alreadyProcessed) {
      console.log(`[WEBHOOK] Event ${eventId} already processed. Skipping.`);
      res.json({ success: true, duplicated: true });
      return;
    }

    const { updateSubscriptionFromWebhook, handleCheckoutCompleted: finalizeCheckout } = await import("../services/subscriptionService");

    if (type.startsWith("subscription.")) {
      console.log(`[WEBHOOK-DEBUG] Sub Status: ${data.status}, End: ${data.current_period_end}`);
      await updateSubscriptionFromWebhook(data.subscription_id || data.id, {
        status: data.status,
        currentPeriodStart: parseDodoDate(data.current_period_start),
        currentPeriodEnd: parseDodoDate(data.current_period_end),
        cancelAtPeriodEnd: data.cancel_at_next_billing_date,
        trialEnd: parseDodoDate(data.trial_period_end) || null,
      });
    } else if (type === "checkout.session.completed" || type === "checkout.completed") {
      const uId = data.metadata?.userId || data.customer_id;
      console.log(`[WEBHOOK-DEBUG] Checkout Success for ${uId}. Sub: ${data.subscription_id}`);
      if (uId) {
        await finalizeCheckout(data.session_id, uId, data.subscription_id, data.customer_id);
      }
    }

    // Mark as processed
    await prisma.processedWebhook.create({
      data: {
        eventId,
        eventType: type,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    res.status(500).json({ error: "Webhook failure" });
  }
}
