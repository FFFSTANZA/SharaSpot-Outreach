import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { mcpCreateData, mcpScopeWhere } from "../scope";
import { campaignService, CampaignError } from "../../services/campaignService";
import { emailQueue } from "../../queues/emailQueue";
import { priorityQueue } from "../../queues/priorityQueue";
import { logger } from "../../utils/logger";

function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength).replace(/[\x00-\x1F\x7F]/g, "");
}

function sanitizeLimit(value: unknown, defaultVal = 20, maxVal = 100): number {
  const num = Number(value) || defaultVal;
  return Math.min(Math.max(num, 1), maxVal);
}

function sanitizeOffset(value: unknown): number {
  return Math.max(Number(value) || 0, 0);
}

async function createCampaign(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const subject = sanitizeString(args.subject, 200);
  const body = sanitizeString(args.body, 10000);

  if (!subject || !body) {
    return { success: false, message: "Subject and body are required" };
  }

  const senderId = sanitizeString(args.senderId, 50);
  const sender = senderId
    ? await prisma.sender.findFirst({
        where: mcpScopeWhere(context, { id: senderId }),
        select: { id: true, hourlyLimit: true },
      })
    : await prisma.sender.findFirst({
        where: mcpScopeWhere(context, { isVerified: true }),
        orderBy: { createdAt: "desc" },
        select: { id: true, hourlyLimit: true },
      });

  if (!sender) {
    return { success: false, message: "No verified sender found" };
  }

  const startTime = args.startTime ? new Date(String(args.startTime)) : new Date();
  if (isNaN(startTime.getTime())) {
    return { success: false, message: "Invalid start time" };
  }

  const emails = Array.isArray(args.emails) ? args.emails as Array<string | { email: string; columnData?: Record<string, string> }> : [];

  // New path: when recipients are provided, route through campaignService so MCP gets
  // the same advanced follow-up setup (graph/schedule/caps/state init) as API campaigns.
  if (emails.length > 0) {
    try {
      const result = await campaignService.createCampaign(context.userId, {
        senderIds: [sender.id],
        subject,
        body,
        startTime: startTime.toISOString(),
        delaySeconds: Math.max(Number(args.delaySeconds) || 0, 0),
        hourlyLimit: Math.max(Number(args.hourlyLimit) || sender.hourlyLimit || 50, 1),
        emails,
        steps: Array.isArray(args.steps) ? args.steps as any : undefined,
        sequenceGraph: (typeof args.sequenceGraph === "object" && args.sequenceGraph !== null) ? args.sequenceGraph as any : undefined,
        sequenceSchedule: (typeof args.sequenceSchedule === "object" && args.sequenceSchedule !== null) ? args.sequenceSchedule as any : undefined,
        frequencyCaps: (typeof args.frequencyCaps === "object" && args.frequencyCaps !== null) ? args.frequencyCaps as any : undefined,
        trackOpens: args.trackOpens !== false,
        trackClicks: args.trackClicks === true,
        timezone: sanitizeString(args.timezone, 50) || "UTC",
        businessStartHour: typeof args.businessStartHour === "number" ? args.businessStartHour : undefined,
        businessEndHour: typeof args.businessEndHour === "number" ? args.businessEndHour : undefined,
        isPriority: args.isPriority === true,
        replyTo: sanitizeString(args.replyTo, 254) || undefined,
      });

      const isPriority = args.isPriority === true;
      const queue = isPriority ? priorityQueue : emailQueue;
      const prefix = isPriority ? "priority" : "email";

      for (const emailJob of result.emailJobs) {
        const delay = Math.max(0, new Date(emailJob.scheduledAt).getTime() - Date.now());
        const jobData = isPriority
          ? { emailJobId: emailJob.id, userId: context.userId }
          : { emailJobId: emailJob.id };

        await queue.add(
          isPriority ? "send-priority-email" : "send-email",
          jobData,
          { jobId: `${prefix}-${emailJob.id}-${crypto.randomUUID()}`, delay },
        );
      }

      return {
        success: true,
        campaignId: result.campaignId,
        status: "SCHEDULED",
        queuedJobs: result.emailJobs.length,
        senderPool: result.senderPool,
        skippedCount: result.skippedCount,
        skipReasons: result.skipReasons,
      };
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        return { success: false, message: error.message, code: error.code, upgradeRequired: error.upgradeRequired };
      }
      const message = error instanceof Error ? error.message : "Failed to create campaign";
      return { success: false, message };
    }
  }

  // Backward-compatible lightweight create path (no recipients yet).
  const campaign = await prisma.emailCampaign.create({
    data: mcpCreateData(context, {
      senderId: sender.id,
      subject,
      body,
      startTime,
      delaySeconds: 0,
      hourlyLimit: sender.hourlyLimit || 50,
      totalRecipients: 0,
      timezone: sanitizeString(args.timezone, 50) || "UTC",
      trackOpens: args.trackOpens !== false,
      trackClicks: args.trackClicks === true,
      status: "SCHEDULED",
    }),
  });

  return {
    success: true,
    campaignId: campaign.id,
    subject: campaign.subject,
    status: campaign.status,
  };
}

async function listCampaigns(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const status = sanitizeString(args.status, 20);
  const limit = sanitizeLimit(args.limit, 20, 100);
  const offset = sanitizeOffset(args.offset);

  const where: Record<string, unknown> = mcpScopeWhere(context);
  if (status) where.status = status;

  const [campaigns, total] = await Promise.all([
    prisma.emailCampaign.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.emailCampaign.count({ where }),
  ]);

  return {
    campaigns: campaigns.map((c) => ({
      id: c.id,
      subject: c.subject,
      status: c.status,
      senderId: c.senderId,
      totalRecipients: c.totalRecipients,
    })),
    total,
    limit,
    offset,
  };
}

async function getCampaign(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const campaignId = sanitizeString(args.campaignId, 50);
  if (!campaignId) {
    return { success: false, message: "Invalid campaign ID" };
  }

  const campaign = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
  });

  if (!campaign) {
    return { success: false, message: "Campaign not found" };
  }

  return {
    id: campaign.id,
    subject: campaign.subject,
    status: campaign.status,
    senderId: campaign.senderId,
    trackOpens: campaign.trackOpens,
    trackClicks: campaign.trackClicks,
    totalRecipients: campaign.totalRecipients,
  };
}

async function updateCampaign(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const campaignId = sanitizeString(args.campaignId, 50);
  if (!campaignId) {
    return { success: false, message: "Invalid campaign ID" };
  }

  const existing = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
    select: { status: true },
  });

  if (!existing) {
    return { success: false, message: "Campaign not found" };
  }

  if (existing.status !== "SCHEDULED" && existing.status !== "PAUSED") {
    return { success: false, message: "Can only update scheduled or paused campaigns" };
  }

  const updateData: Record<string, unknown> = {};
  if (args.subject) updateData.subject = sanitizeString(args.subject, 200);
  if (args.body) updateData.body = sanitizeString(args.body, 10000);

  const senderId = sanitizeString(args.senderId, 50);
  if (senderId) {
    const sender = await prisma.sender.findFirst({
      where: mcpScopeWhere(context, { id: senderId }),
      select: { id: true },
    });
    if (sender) updateData.senderId = sender.id;
  }

  const updated = await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: updateData,
  });

  return { success: true, campaignId: updated.id };
}

async function deleteCampaign(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const campaignId = sanitizeString(args.campaignId, 50);
  if (!campaignId) {
    return { success: false, message: "Invalid campaign ID" };
  }

  const existing = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
    select: { status: true },
  });

  if (!existing) {
    return { success: false, message: "Campaign not found" };
  }

  if (existing.status === "SENDING") {
    return { success: false, message: "Cannot delete a campaign that is sending" };
  }

  await prisma.emailCampaign.delete({
    where: { id: campaignId },
  });

  return { success: true, message: "Campaign deleted" };
}

async function launchCampaign(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const campaignId = sanitizeString(args.campaignId, 50);
  if (!campaignId) {
    return { success: false, message: "Invalid campaign ID" };
  }

  const campaign = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
  });

  if (!campaign) {
    return { success: false, message: "Campaign not found" };
  }

  if (campaign.status !== "SCHEDULED" && campaign.status !== "PAUSED") {
    return { success: false, message: "Can only launch scheduled or paused campaigns" };
  }

  const listId = sanitizeString(args.contactListId, 50);
  const maxRecipients = Math.min(Math.max(Number(args.maxRecipients) || 1000, 1), 5000);
  const contacts = listId
    ? await prisma.contact.findMany({
        where: mcpScopeWhere(context, { lists: { some: { id: listId } } }),
        take: maxRecipients,
      })
    : await prisma.contact.findMany({
        where: mcpScopeWhere(context),
        take: maxRecipients,
      });

  if (contacts.length === 0) {
    return { success: false, message: "No contacts to send to" };
  }

  const totalMatching = listId
    ? await prisma.contact.count({ where: mcpScopeWhere(context, { lists: { some: { id: listId } } }) })
    : await prisma.contact.count({ where: mcpScopeWhere(context) });

  if (totalMatching > maxRecipients) {
    logger.warn(`[MCP] Campaign ${campaignId}: ${totalMatching} total contacts found, but only sending to ${maxRecipients}. Use maxRecipients to increase the limit.`);
  }

  const existingJobs = await prisma.emailJob.count({
    where: { campaignId: campaign.id, status: "PENDING" },
  });

  if (existingJobs === 0) {
    await prisma.emailJob.createMany({
      data: contacts.map((contact) => ({
        campaignId: campaign.id,
        senderId: campaign.senderId,
        toEmail: contact.email,
        scheduledAt: campaign.startTime,
        status: "PENDING",
      })),
    });
  }

  const updated = await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SCHEDULED",
      totalRecipients: contacts.length,
    },
  });

  return {
    success: true,
    campaignId: updated.id,
    status: updated.status,
    recipients: contacts.length,
  };
}

export function registerCampaignTools() {
  toolRegistry.register(
    {
      name: "campaign_create",
      description: "Create a new campaign",
      inputSchema: {
        type: "object" as const,
        properties: {
          subject: { type: "string", description: "Subject line" },
          body: { type: "string", description: "Email body" },
          senderId: { type: "string", description: "Sender ID" },
          startTime: { type: "string", description: "Start time" },
          timezone: { type: "string", description: "Timezone" },
          trackOpens: { type: "boolean", description: "Track opens" },
          trackClicks: { type: "boolean", description: "Track clicks" },
          emails: { type: "array", description: "Recipient list. If provided, uses full campaign service with advanced follow-ups." },
          delaySeconds: { type: "number", description: "Inter-email delay in seconds" },
          hourlyLimit: { type: "number", description: "Hourly send rate" },
          steps: { type: "array", description: "Legacy follow-up steps" },
          sequenceGraph: { type: "object", description: "Advanced follow-up graph" },
          sequenceSchedule: { type: "object", description: "Follow-up daily schedule settings" },
          frequencyCaps: { type: "object", description: "Follow-up frequency limits" },
          businessStartHour: { type: "number", description: "Preferred local send window start hour" },
          businessEndHour: { type: "number", description: "Preferred local send window end hour" },
          isPriority: { type: "boolean", description: "Use priority send pipeline" },
          replyTo: { type: "string", description: "Reply-to address override" },
        },
        required: ["subject", "body"],
      },
      handler: createToolHandler({ name: "campaign_create", description: "", inputSchema: {} as never, handler: createCampaign }),
    },
    "campaigns"
  );

  toolRegistry.register(
    {
      name: "campaign_list",
      description: "List campaigns",
      inputSchema: {
        type: "object" as const,
        properties: {
          status: { type: "string", description: "Filter by status" },
          limit: { type: "number", description: "Max results" },
          offset: { type: "number", description: "Results offset" },
        },
      },
      handler: createToolHandler({ name: "campaign_list", description: "", inputSchema: {} as never, handler: listCampaigns }),
    },
    "campaigns"
  );

  toolRegistry.register(
    {
      name: "campaign_get",
      description: "Get campaign",
      inputSchema: {
        type: "object" as const,
        properties: { campaignId: { type: "string", description: "Campaign ID" } },
        required: ["campaignId"],
      },
      handler: createToolHandler({ name: "campaign_get", description: "", inputSchema: {} as never, handler: getCampaign }),
    },
    "campaigns"
  );

  toolRegistry.register(
    {
      name: "campaign_update",
      description: "Update campaign",
      inputSchema: {
        type: "object" as const,
        properties: {
          campaignId: { type: "string", description: "Campaign ID" },
          subject: { type: "string", description: "New subject" },
          body: { type: "string", description: "New body" },
          senderId: { type: "string", description: "New sender ID" },
        },
        required: ["campaignId"],
      },
      handler: createToolHandler({ name: "campaign_update", description: "", inputSchema: {} as never, handler: updateCampaign }),
    },
    "campaigns"
  );

  toolRegistry.register(
    {
      name: "campaign_delete",
      description: "Delete campaign",
      inputSchema: {
        type: "object" as const,
        properties: { campaignId: { type: "string", description: "Campaign ID" } },
        required: ["campaignId"],
      },
      handler: createToolHandler({ name: "campaign_delete", description: "", inputSchema: {} as never, handler: deleteCampaign }),
    },
    "campaigns"
  );

  toolRegistry.register(
    {
      name: "campaign_launch",
      description: "Launch campaign",
      inputSchema: {
        type: "object" as const,
        properties: {
          campaignId: { type: "string", description: "Campaign ID" },
          contactListId: { type: "string", description: "Contact list ID" },
          maxRecipients: { type: "number", description: "Max recipients (default 1000, max 5000)" },
        },
        required: ["campaignId"],
      },
      handler: createToolHandler({ name: "campaign_launch", description: "", inputSchema: {} as never, handler: launchCampaign }),
    },
    "campaigns"
  );
}
