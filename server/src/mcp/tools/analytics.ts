import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { mcpScopeWhere } from "../scope";

function sanitizeLimit(value: unknown, defaultVal = 30, maxVal = 365): number {
  const num = Number(value) || defaultVal;
  return Math.min(Math.max(num, 1), maxVal);
}

function sanitizeDays(value: unknown, defaultVal = 30): number {
  return sanitizeLimit(value, defaultVal, 365);
}

async function getCampaignAnalytics(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const campaignId = String(args.campaignId).slice(0, 50);
  if (!campaignId) {
    return { success: false, message: "Invalid campaign ID" };
  }

  const campaign = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
    select: { id: true, subject: true },
  });

  if (!campaign) {
    return { success: false, message: "Campaign not found" };
  }

  const [total, sent, opened, clicked, failed] = await Promise.all([
    prisma.emailJob.count({ where: { campaignId: campaign.id } }),
    prisma.emailJob.count({ where: { campaignId: campaign.id, status: "SENT" } }),
    prisma.trackingEvent.count({
      where: { emailJob: { campaignId: campaign.id }, eventType: "OPEN" },
    }),
    prisma.trackingEvent.count({
      where: { emailJob: { campaignId: campaign.id }, eventType: "CLICK" },
    }),
    prisma.emailJob.count({ where: { campaignId: campaign.id, status: "FAILED" } }),
  ]);

  const openRate = sent > 0 ? (opened / sent) * 100 : 0;
  const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

  return {
    campaignId: campaign.id,
    subject: campaign.subject,
    totals: { total, sent, opened, clicked, failed },
    rates: {
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
    },
  };
}

async function getSenderAnalytics(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const senderId = String(args.senderId).slice(0, 50);
  const days = sanitizeDays(args.days);

  if (!senderId) {
    return { success: false, message: "Invalid sender ID" };
  }

  const sender = await prisma.sender.findFirst({
    where: mcpScopeWhere(context, { id: senderId }),
    select: { id: true, email: true },
  });

  if (!sender) {
    return { success: false, message: "Sender not found" };
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [total, sent, opened, clicked] = await Promise.all([
    prisma.emailJob.count({
      where: { senderId: sender.id, createdAt: { gte: startDate } },
    }),
    prisma.emailJob.count({
      where: { senderId: sender.id, status: "SENT", createdAt: { gte: startDate } },
    }),
    prisma.trackingEvent.count({
      where: { emailJob: { senderId: sender.id }, eventType: "OPEN", createdAt: { gte: startDate } },
    }),
    prisma.trackingEvent.count({
      where: { emailJob: { senderId: sender.id }, eventType: "CLICK", createdAt: { gte: startDate } },
    }),
  ]);

  const openRate = sent > 0 ? (opened / sent) * 100 : 0;
  const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

  return {
    senderId: sender.id,
    email: sender.email,
    period: { days },
    totals: { total, sent, opened, clicked },
    rates: {
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
    },
  };
}

async function getOverallAnalytics(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const days = sanitizeDays(args.days);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [campaigns, contacts, totalEmails, sent, opened, clicked] = await Promise.all([
    prisma.emailCampaign.count({ where: mcpScopeWhere(context) }),
    prisma.contact.count({ where: mcpScopeWhere(context) }),
    prisma.emailJob.count({
      where: { campaign: mcpScopeWhere(context), createdAt: { gte: startDate } },
    }),
    prisma.emailJob.count({
      where: { campaign: mcpScopeWhere(context), status: "SENT", createdAt: { gte: startDate } },
    }),
    prisma.trackingEvent.count({
      where: { emailJob: { campaign: mcpScopeWhere(context) }, eventType: "OPEN", createdAt: { gte: startDate } },
    }),
    prisma.trackingEvent.count({
      where: { emailJob: { campaign: mcpScopeWhere(context) }, eventType: "CLICK", createdAt: { gte: startDate } },
    }),
  ]);

  const openRate = sent > 0 ? (opened / sent) * 100 : 0;
  const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

  return {
    period: { days },
    totals: { campaigns, contacts, emails: totalEmails, sent, opened, clicked },
    rates: {
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
    },
  };
}

export function registerAnalyticsTools() {
  toolRegistry.register(
    {
      name: "analytics_campaign",
      description: "Get campaign analytics",
      inputSchema: {
        type: "object" as const,
        properties: {
          campaignId: { type: "string", description: "Campaign ID" },
        },
        required: ["campaignId"],
      },
      handler: createToolHandler({ name: "analytics_campaign", description: "", inputSchema: {} as never, handler: getCampaignAnalytics }),
    },
    "analytics"
  );

  toolRegistry.register(
    {
      name: "analytics_sender",
      description: "Get sender analytics",
      inputSchema: {
        type: "object" as const,
        properties: {
          senderId: { type: "string", description: "Sender ID" },
          days: { type: "number", description: "Days" },
        },
        required: ["senderId"],
      },
      handler: createToolHandler({ name: "analytics_sender", description: "", inputSchema: {} as never, handler: getSenderAnalytics }),
    },
    "analytics"
  );

  toolRegistry.register(
    {
      name: "analytics_overall",
      description: "Get overall analytics",
      inputSchema: {
        type: "object" as const,
        properties: {
          days: { type: "number", description: "Days" },
        },
      },
      handler: createToolHandler({ name: "analytics_overall", description: "", inputSchema: {} as never, handler: getOverallAnalytics }),
    },
    "analytics"
  );
}
