import { prisma } from "../config/prisma";

const WEBHOOK_TIMEOUT_MS = 10000;

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

async function deliverWebhook(url: string, payload: WebhookPayload, secret?: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "SharaSpot-Webhook/1.0",
  };

  if (secret) {
    const crypto = require("crypto");
    const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return { success: response.ok, statusCode: response.status };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function triggerWebhook(
  userId: string,
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId, isActive: true, events: { has: eventType } },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const webhook of webhooks) {
      const result = await deliverWebhook(webhook.url, payload, webhook.secret || undefined);
      
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: payload as any,
          responseStatus: result.statusCode || null,
          responseBody: result.statusCode ? JSON.stringify(result) : null,
          errorMessage: result.error || null,
          deliveredAt: result.success ? new Date() : null,
          attempts: 1,
        },
      });
    }
  } catch (error) {
    console.error("[Webhook] Trigger error:", error);
  }
}

export async function retryFailedWebhooks(): Promise<void> {
  try {
    const failed = await prisma.webhookDelivery.findMany({
      where: {
        deliveredAt: null,
        attempts: { lt: 3 },
      },
      take: 100,
      orderBy: { createdAt: "asc" },
    });

    for (const delivery of failed) {
      const webhook = await prisma.webhook.findUnique({
        where: { id: delivery.webhookId },
      });
      if (!webhook) continue;

      const result = await deliverWebhook(webhook.url, delivery.payload as any, webhook.secret || undefined);
      
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: delivery.attempts + 1,
          responseStatus: result.statusCode || null,
          responseBody: result.statusCode ? JSON.stringify(result) : null,
          errorMessage: result.error || null,
          deliveredAt: result.success ? new Date() : null,
        },
      });
    }
  } catch (error) {
    console.error("[Webhook] Retry error:", error);
  }
}

export async function getEventWebhookPayload(
  eventType: string,
  emailJobId: string,
  metadata?: Record<string, any>
): Promise<Record<string, any>> {
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: emailJobId },
    include: { campaign: { include: { user: true } }, sender: true },
  });

  if (!emailJob) return {};

  return {
    eventId: emailJobId,
    eventType,
    timestamp: new Date().toISOString(),
    email: {
      to: emailJob.toEmail,
      subject: emailJob.campaign.subject,
      messageId: emailJob.messageId,
    },
    campaign: {
      id: emailJob.campaignId,
      name: emailJob.campaign.subject,
    },
    sender: emailJob.sender ? {
      email: emailJob.sender.email,
      name: emailJob.sender.name,
    } : null,
    user: {
      id: emailJob.campaign.userId,
      email: emailJob.campaign.user.email,
    },
    metadata: metadata || {},
  };
}