import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";
import {
  createCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionStatus,
  logPaymentAuditEvent,
  syncSubscriptionFromDodo,
} from "../services/subscriptionService";
import { getCountryFromIp, isIndia } from "../utils/geoUtils";
import { SUBSCRIPTION_PRICE_USD, SUBSCRIPTION_INTERVAL } from "../config/subscription";
import { dodo } from "../config/dodo";

export async function getSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const countryCode = await getCountryFromIp(ipAddress);
    const region = isIndia(countryCode) ? "india" : "global";

    let { isPremium, subscription } = await getSubscriptionStatus(userId);

    // FAIL-SAFE: If not premium locally but has a Dodo subscription ID, sync from Dodo API
    if (!isPremium && subscription?.dodoSubscriptionId && subscription.dodoSubscriptionId !== "sub_test_premium_demo") {
      try {
        const { synced } = await syncSubscriptionFromDodo(userId);
        if (synced) {
          const refreshed = await getSubscriptionStatus(userId);
          isPremium = refreshed.isPremium;
          subscription = refreshed.subscription;
          logger.info({ userId }, "[SYNC-FAILSAFE] Synced from Dodo API");
        }
      } catch (syncErr) {
        logger.warn({ err: syncErr }, "[SYNC-FAILSAFE] Background sync failed");
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
    logger.error({ err: error }, "Error fetching subscription");
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
}

export async function createSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
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
    // Only block if they are actually PREMIUM (Active/Trial and not expired)
    if (existing.isPremium) {
      res.status(400).json({ message: "You already have an active premium subscription." });
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
    logger.error({ err: error }, "Error creating checkout session");
    res.status(500).json({
      message: "Failed to create checkout session",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

export async function cancelUserSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await cancelSubscription(userId);
    res.json({ message: "Subscription will be cancelled at end of billing period" });
  } catch (error) {
    logger.error({ err: error }, "Error cancelling subscription");
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
}

export async function reactivateUserSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await reactivateSubscription(userId);
    res.json({ message: "Subscription reactivated" });
  } catch (error) {
    logger.error({ err: error }, "Error reactivating subscription");
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
  const rawBody = req.rawBody;

  if (secret) {
    try {
      // Robustly extract the raw body string
      const body = Buffer.isBuffer(rawBody)
        ? rawBody.toString("utf8")
        : (typeof rawBody === "string" ? rawBody : JSON.stringify(req.body));

      const headers = {
        "svix-id": (req.headers["webhook-id"] || req.headers["svix-id"] || "") as string,
        "svix-timestamp": (req.headers["webhook-timestamp"] || req.headers["svix-timestamp"] || "") as string,
        "svix-signature": (req.headers["webhook-signature"] || req.headers["svix-signature"] || "") as string,
      };

      // Also include standard webhook headers if the SDK has been updated
      const svixHeaders: any = { ...headers };
      if (req.headers["webhook-id"]) svixHeaders["webhook-id"] = req.headers["webhook-id"];
      if (req.headers["webhook-timestamp"]) svixHeaders["webhook-timestamp"] = req.headers["webhook-timestamp"];
      if (req.headers["webhook-signature"]) svixHeaders["webhook-signature"] = req.headers["webhook-signature"];

      try {
        event = dodo.webhooks.unwrap(body, { headers: svixHeaders, key: secret });
      } catch (firstErr: any) {
        logger.warn({ err: firstErr }, "[WEBHOOK] Primary unwrap failed, trying fallback with raw headers");
        event = dodo.webhooks.unwrap(body, { headers: req.headers as any, key: secret });
      }
    } catch (error: any) {
      const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : "NOT_A_BUFFER";
      logger.error({ err: error }, "[WEBHOOK] Auth Failed Final");
      logger.error({
        bodyLength: bodyStr.length,
        bodyStart: bodyStr.substring(0, 20),
        secretPrefix: secret.substring(0, 10),
        headerKeys: Object.keys(req.headers).filter(k => k.toLowerCase().includes("webhook") || k.toLowerCase().includes("svix")),
      }, "[WEBHOOK-DIAGNOSIS]");
      res.status(401).json({
        error: "Unauthorized",
        details: error.message,
        hint: "Check signature and secret integrity"
      });
      return;
    }
  } else {
    event = req.body;
  }

  let prismaTx: any = null;

  try {
    const { type, data, id: eventId } = event;
    const dodoSubId = data.subscription_id || data.id;
    logger.info({
      type, eventId,
      subscriptionId: dodoSubId,
      sessionId: data.session_id,
      customerId: data.customer_id,
      status: data.status,
    }, `[WEBHOOK] Received ${type}`);

    if (!eventId) {
      logger.warn("[WEBHOOK] Missing event ID, processing anyway");
    } else {
      const existing = await prisma.$transaction(async (tx) => {
        const alreadyProcessed = await tx.processedWebhook.findUnique({
          where: { eventId },
        });
        if (alreadyProcessed) return alreadyProcessed;
        return null;
      }, { isolationLevel: "Serializable" });

      if (existing) {
        logger.info({ eventId }, "[WEBHOOK] Event already processed. Skipping.");
        res.json({ success: true, duplicated: true });
        return;
      }
    }

    const { updateSubscriptionFromWebhook, handleCheckoutCompleted: finalizeCheckout, activateSubscriptionFromPayment } = await import("../services/subscriptionService");

    if (type === "payment.succeeded") {
      const userId = data.metadata?.userId;
      const sessionId = data.session_id;
      const dodoSubscriptionId = data.subscription_id;
      const customerId = data.customer_id;
      const paymentId = data.id || data.payment_id;

      logger.info({
        userId, sessionId,
        dodoSubscriptionId,
        customerId,
        paymentId,
      }, "[WEBHOOK] Processing payment.succeeded");

      if (!userId) {
        logger.error({ data }, "[WEBHOOK] CRITICAL: No userId in payment metadata");

        if (customerId) {
          const existingSub = await prisma.subscription.findFirst({
            where: { dodoCustomerId: customerId },
            include: { user: true },
          });

          if (existingSub) {
            logger.info({ userId: existingSub.userId }, "[WEBHOOK] Found user via customer ID mapping");
          }
        }

        await logPaymentAuditEvent("payment.succeeded.error", paymentId || sessionId, {
          error: "No userId in metadata",
          customerId,
        });

        res.status(400).json({ error: "Missing userId in metadata" });
        return;
      }

      await activateSubscriptionFromPayment(userId, dodoSubscriptionId, customerId, sessionId, paymentId);

      await logPaymentAuditEvent("payment.succeeded", userId, {
        sessionId,
        dodoSubscriptionId,
        customerId,
        paymentId,
      });
    } else if (type === "subscription.active" || type === "subscription.updated" || type === "subscription.renewed") {
      if (!dodoSubId) {
        logger.warn({ type }, `[WEBHOOK] ${type} event missing subscription ID, skipping subscription update`);
      } else {
        await updateSubscriptionFromWebhook(dodoSubId, {
          status: data.status,
          currentPeriodStart: parseDodoDate(data.previous_billing_date),
          currentPeriodEnd: parseDodoDate(data.next_billing_date),
          cancelAtPeriodEnd: data.cancel_at_next_billing_date,
        });

        await logPaymentAuditEvent("subscription." + type.replace("subscription.", ""), dodoSubId, {
          status: data.status,
        });
      }
    } else if (type === "subscription.cancelled" || type === "subscription.expired" || type === "subscription.failed" || type === "subscription.on_hold") {
      if (dodoSubId) {
        await updateSubscriptionFromWebhook(dodoSubId, {
          status: data.status,
          currentPeriodStart: parseDodoDate(data.previous_billing_date),
          currentPeriodEnd: parseDodoDate(data.next_billing_date),
          cancelAtPeriodEnd: data.cancel_at_next_billing_date,
        });

        await logPaymentAuditEvent("subscription." + type.replace("subscription.", ""), dodoSubId, {
          status: data.status,
        });
      }
    } else if (type === "checkout.session.completed" || type === "checkout.completed") {
      const userId = data.metadata?.userId;
      const sessionId = data.session_id;
      const dodoSubscriptionId = data.subscription_id;
      const customerId = data.customer_id;

      logger.info({
        userId, sessionId,
        dodoSubscriptionId,
        customerId,
      }, "[WEBHOOK] Processing checkout completed");

      if (!userId) {
        logger.error({ data }, "[WEBHOOK] CRITICAL: No userId in checkout metadata");

        if (customerId) {
          const existingSub = await prisma.subscription.findFirst({
            where: { dodoCustomerId: customerId },
            include: { user: true },
          });

          if (existingSub) {
            logger.info({ userId: existingSub.userId }, "[WEBHOOK] Found user via customer ID mapping");
          } else {
            logger.error("[WEBHOOK] No subscription found for customer ID either");
          }
        }

        await logPaymentAuditEvent("checkout.completed.error", sessionId, {
          error: "No userId in metadata",
          customerId,
          data: JSON.stringify(data),
        });

        res.status(400).json({ error: "Missing userId in metadata" });
        return;
      }

      await finalizeCheckout(sessionId, userId, dodoSubscriptionId, customerId);

      await logPaymentAuditEvent("checkout.completed", userId, {
        sessionId,
        dodoSubscriptionId,
        customerId,
      });
    }

    if (eventId) {
      await prisma.processedWebhook.upsert({
        where: { eventId },
        create: {
          eventId,
          eventType: type,
        },
        update: {},
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ err: error }, "[WEBHOOK] Error processing webhook");
    res.status(500).json({ error: "Webhook failure", message: error.message });
  }
}
