import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { mcpCreateData, mcpScopeWhere } from "../scope";

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
        select: { id: true, hourlyLimit: true },
      });

  if (!sender) {
    return { success: false, message: "No verified sender found" };
  }

  const startTime = args.startTime ? new Date(String(args.startTime)) : new Date();
  if (isNaN(startTime.getTime())) {
    return { success: false, message: "Invalid start time" };
  }

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
      trackClicks: args.trackClicks !== false,
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
    console.warn(`[MCP] Campaign ${campaignId}: ${totalMatching} total contacts found, but only sending to ${maxRecipients}. Use maxRecipients to increase the limit.`);
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
