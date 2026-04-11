import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  createCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionStatus,
} from "../services/subscriptionService";
import { SUBSCRIPTION_PRICE_USD, SUBSCRIPTION_INTERVAL } from "../config/subscription";

export async function getSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { isPremium, subscription } = await getSubscriptionStatus(userId);

    res.json({
      isPremium,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialEnd: subscription.trialEnd,
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
    const userId = req.user?.id;
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
    if (existing.isPremium) {
      res.status(400).json({ message: "Already subscribed to premium" });
      return;
    }

    const { checkoutUrl, sessionId } = await createCheckoutSession(
      userId,
      user.email,
      user.name
    );

    res.json({ checkoutUrl, sessionId });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
}

export async function cancelUserSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
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
    const userId = req.user?.id;
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
  try {
    const event = req.body;

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.session_id, event.data.metadata?.userId);
        break;
      case "subscription.active":
      case "subscription.updated":
      case "subscription.cancelled":
      case "subscription.on_hold":
      case "subscription.expired":
        await handleSubscriptionUpdate(event.data);
        break;
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
}

async function handleCheckoutCompleted(sessionId: string, userId?: string): Promise<void> {
  if (!userId) return;
  const { handleCheckoutCompleted: handleComplete } = await import("../services/subscriptionService");
  await handleComplete(sessionId, userId);
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
