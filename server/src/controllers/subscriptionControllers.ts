import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";
import {
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionStatus,
  logPaymentAuditEvent,
  syncSubscriptionFromDodo,
  updateSubscriptionFromWebhook,
  deriveDodoSubscriptionDates,
  parseDodoDate,
  handleCheckoutCompleted as finalizeCheckout,
  activateSubscriptionFromPayment,
  invalidatePremiumCacheForUserAndInheritedMembers,
} from "../services/subscriptionService";
import { extractClientIp, getCountryFromIp, isIndia } from "../utils/geoUtils";
import { SubscriptionStatus } from "@prisma/client";
import { SUBSCRIPTION_PRICE_USD, SUBSCRIPTION_PRICE_INR, SUBSCRIPTION_INTERVAL, SUBSCRIPTION_TRIAL_DAYS } from "../config/subscription";
import { dodo } from "../config/dodo";

export async function getSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Persist region on first detection only — subsequent requests use stored value
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { region: true } });
    let region = user?.region;
    if (!region) {
      const ipAddress = extractClientIp(req);
      const countryCode = await getCountryFromIp(ipAddress);
      region = isIndia(countryCode) ? "india" : "global";
      await prisma.user.update({ where: { id: userId }, data: { region } }).catch(() => {});
    }

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
          hasDodoCustomerId: !!subscription.dodoCustomerId,
        }
        : null,
      pricing: {
        amount: region === "india" ? SUBSCRIPTION_PRICE_INR : SUBSCRIPTION_PRICE_USD,
        interval: SUBSCRIPTION_INTERVAL,
        currency: region === "india" ? "INR" : "USD",
        trialDays: SUBSCRIPTION_TRIAL_DAYS,
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, region: true, activeOrganizationId: true },
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Org members should not create their own subscription — the org owner handles billing
    if (user.activeOrganizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: user.activeOrganizationId, userId } },
      });
      if (membership && membership.role !== "OWNER") {
        res.status(403).json({ message: "Your workspace owner manages the subscription. Contact them to upgrade." });
        return;
      }
    }

    const existing = await getSubscriptionStatus(userId);
    if (existing.isPremium) {
      res.status(400).json({ message: "You already have an active premium subscription." });
      return;
    }

    const ipAddress = extractClientIp(req);

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

export async function createBillingPortalSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { portalUrl } = await createCustomerPortalSession(userId);
    res.json({ portalUrl });
  } catch (error: any) {
    logger.error({ err: error }, "Error creating billing portal session");
    res.status(500).json({
      message: "Failed to open billing portal",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

async function resolveWebhookUserId(
  metadataUserId: string | undefined,
  customerId: string | undefined
): Promise<string | null> {
  if (metadataUserId) return metadataUserId;
  if (!customerId) return null;

  const existingSub = await prisma.subscription.findFirst({
    where: { dodoCustomerId: customerId },
    include: { user: true },
  });

  return existingSub?.userId || null;
}

function getDodoCustomerId(data: any): string | undefined {
  return data.customer_id || data.customer?.customer_id || data.customer?.id;
}

async function claimActivationMarker(markerId: string, sourceEventType: string): Promise<boolean> {
  try {
    await prisma.processedWebhook.create({
      data: {
        eventId: markerId,
        eventType: `activation:${sourceEventType}`,
      },
    });
    return true;
  } catch (error: unknown) {
    const maybeCode = (error as { code?: string } | null)?.code;
    if (maybeCode === "P2002") {
      return false;
    }
    throw error;
  }
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.DODO_WEBHOOK_SECRET?.trim();
  let event: any;
  const rawBody = req.rawBody;

  if (!secret) {
    logger.error("[WEBHOOK] DODO_WEBHOOK_SECRET is not configured");
    res.status(500).json({ error: "Webhook processing unavailable" });
    return;
  }

  try {
    const body = Buffer.isBuffer(rawBody)
      ? rawBody.toString("utf8")
      : (typeof rawBody === "string" ? rawBody : JSON.stringify(req.body));

    const headers = {
      "svix-id": (req.headers["webhook-id"] || req.headers["svix-id"] || "") as string,
      "svix-timestamp": (req.headers["webhook-timestamp"] || req.headers["svix-timestamp"] || "") as string,
      "svix-signature": (req.headers["webhook-signature"] || req.headers["svix-signature"] || "") as string,
    };

    const webhookTimestamp = Number(headers["svix-timestamp"]);
    if (!Number.isFinite(webhookTimestamp)) {
      throw new Error("Missing or invalid webhook timestamp");
    }
    if (process.env.NODE_ENV !== "test" && Math.abs(Date.now() - webhookTimestamp * 1000) > 5 * 60 * 1000) {
      throw new Error("Webhook timestamp outside allowed tolerance");
    }

    event = dodo.webhooks.unwrap(body, { headers, key: secret });
  } catch (error: any) {
    logger.error({ err: error }, "[WEBHOOK] Authentication failed");
    res.status(401).json({ error: "Unauthorized webhook signature" });
    return;
  }

  try {
    const { type, data } = event;
    const rawEventId = event.id || req.headers["webhook-id"] || req.headers["svix-id"];
    const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
    const dodoSubId = data.subscription_id || data.id;
    const customerId = getDodoCustomerId(data);
    logger.info({
      type, eventId,
      subscriptionId: dodoSubId,
      sessionId: data.checkout_session_id || data.session_id,
      customerId,
      status: data.status,
    }, `[WEBHOOK] Received ${type}`);

    if (eventId) {
      try {
        await prisma.processedWebhook.create({
          data: { eventId, eventType: type },
        });
      } catch (error: unknown) {
        const maybeCode = (error as { code?: string } | null)?.code;
        if (maybeCode === "P2002") {
          logger.info({ eventId }, "[WEBHOOK] Event already processed. Skipping.");
          res.json({ success: true, duplicated: true });
          return;
        }
        throw error;
      }
    } else {
      logger.warn("[WEBHOOK] Missing event ID, processing anyway");
    }

    if (type === "payment.succeeded") {
      const userId = await resolveWebhookUserId(data.metadata?.userId, customerId);
      const sessionId = data.checkout_session_id || data.session_id;
      const dodoSubscriptionId = data.subscription_id;
      const paymentId = data.payment_id || data.id;
      const activationMarker = `activation:${dodoSubscriptionId || sessionId || paymentId || eventId || "unknown"}`;

      logger.info({
        userId, sessionId,
        dodoSubscriptionId,
        customerId,
        paymentId,
      }, "[WEBHOOK] Processing payment.succeeded");

      if (!userId) {
        logger.error({ data }, "[WEBHOOK] CRITICAL: No userId in payment metadata");

        await logPaymentAuditEvent("payment.succeeded.error", paymentId || sessionId, {
          error: "No userId in metadata",
          customerId,
        });

        res.status(400).json({ error: "Missing userId in metadata" });
        return;
      }

      const shouldProcessActivation = await claimActivationMarker(activationMarker, type);
      if (!shouldProcessActivation) {
        logger.info({ activationMarker, type }, "[WEBHOOK] Activation already processed. Skipping duplicate activation event.");
      } else {
        await activateSubscriptionFromPayment(userId, dodoSubscriptionId, customerId, sessionId, paymentId);

        await logPaymentAuditEvent("payment.succeeded", userId, {
          sessionId,
          dodoSubscriptionId,
          customerId,
          paymentId,
        });
      }
    } else if (type === "payment.failed" || type === "payment.cancelled" || type === "payment.processing") {
      const paymentId = data.payment_id || data.id;
      await logPaymentAuditEvent(type, paymentId || "unknown", {
        subscriptionId: data.subscription_id,
        customerId,
        status: data.status,
        errorCode: data.error_code,
        errorMessage: data.error_message,
      });

      if (type !== "payment.processing" && data.subscription_id) {
        const sub = await prisma.subscription.findFirst({
          where: { dodoSubscriptionId: data.subscription_id },
          select: { id: true, userId: true },
        });
        if (sub?.userId) {
          const targetStatus = type === "payment.cancelled"
            ? SubscriptionStatus.ON_HOLD
            : SubscriptionStatus.PAST_DUE;
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: targetStatus },
          });
          await invalidatePremiumCacheForUserAndInheritedMembers(sub.userId);
          logger.info({ dodoSubId: data.subscription_id, targetStatus }, "[WEBHOOK] Downgraded after failed payment");
        }
      }
    } else if (type === "subscription.active" || type === "subscription.updated" || type === "subscription.renewed" || type === "subscription.plan_changed") {
      if (!dodoSubId) {
        logger.warn({ type }, `[WEBHOOK] ${type} event missing subscription ID, skipping subscription update`);
      } else {
        if (type === "subscription.active") {
          const userId = await resolveWebhookUserId(data.metadata?.userId, customerId);
          if (userId) {
            const activationMarker = `activation:${dodoSubId}`;
            const shouldProcessActivation = await claimActivationMarker(activationMarker, type);
            if (shouldProcessActivation) {
              await finalizeCheckout(`subscription:${eventId || dodoSubId}`, userId, dodoSubId, customerId);
            } else {
              logger.info({ activationMarker, type }, "[WEBHOOK] Activation already processed. Applying subscription update only.");
            }
          }
        }

        const { periodStart, periodEnd, trialEnd } = deriveDodoSubscriptionDates(data);
        await updateSubscriptionFromWebhook(dodoSubId, {
          status: data.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: data.cancel_at_next_billing_date,
          cancelAt: parseDodoDate(data.cancelled_at) || null,
          trialEnd,
        });

        await logPaymentAuditEvent("subscription." + type.replace("subscription.", ""), dodoSubId, {
          status: data.status,
        });
      }
    } else if (type === "subscription.cancelled" || type === "subscription.expired" || type === "subscription.failed" || type === "subscription.on_hold") {
      if (dodoSubId) {
        const { periodStart, periodEnd, trialEnd } = deriveDodoSubscriptionDates(data);
        await updateSubscriptionFromWebhook(dodoSubId, {
          status: data.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: data.cancel_at_next_billing_date,
          cancelAt: parseDodoDate(data.cancelled_at) || null,
          trialEnd,
        });

        await logPaymentAuditEvent("subscription." + type.replace("subscription.", ""), dodoSubId, {
          status: data.status,
        });
      }
    } else if (type === "checkout.session.completed" || type === "checkout.completed") {
      const userId = await resolveWebhookUserId(data.metadata?.userId, customerId);
      const sessionId = data.checkout_session_id || data.session_id;
      const dodoSubscriptionId = data.subscription_id;
      const activationMarker = `activation:${dodoSubscriptionId || sessionId || eventId}`;

      logger.info({
        userId, sessionId,
        dodoSubscriptionId,
        customerId,
      }, "[WEBHOOK] Processing checkout completed");

      if (!userId) {
        logger.error({ data }, "[WEBHOOK] CRITICAL: No userId in checkout metadata");

        await logPaymentAuditEvent("checkout.completed.error", sessionId, {
          error: "No userId in metadata",
          customerId,
          data: JSON.stringify(data),
        });

        res.status(400).json({ error: "Missing userId in metadata" });
        return;
      }

      const shouldProcessActivation = await claimActivationMarker(activationMarker, type);
      if (!shouldProcessActivation) {
        logger.info({ activationMarker, type }, "[WEBHOOK] Activation already processed. Skipping duplicate activation event.");
      } else {
        await finalizeCheckout(sessionId, userId, dodoSubscriptionId, customerId);

        await logPaymentAuditEvent("checkout.completed", userId, {
          sessionId,
          dodoSubscriptionId,
          customerId,
        });
      }
    } else {
      logger.warn({ type, data }, `[WEBHOOK] Unhandled event type`);
      await logPaymentAuditEvent("webhook.unhandled", eventId || "unknown", {
        type,
        subscriptionId: dodoSubId,
        customerId,
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ err: error }, "[WEBHOOK] Error processing webhook");
    res.status(500).json({ error: "Webhook failure" });
  }
}
