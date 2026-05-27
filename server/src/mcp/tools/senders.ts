import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { mcpCreateData, mcpScopeWhere } from "../scope";
import { clampLimit, fail, ok, sanitizeOffset, sanitizeString } from "../helpers";

async function listSenders(context: MCPContext, args: Record<string, unknown>): Promise<unknown> {
  const limit = clampLimit(args.limit, 20, 100);
  const offset = sanitizeOffset(args.offset);

  const senders = await prisma.sender.findMany({
    where: mcpScopeWhere(context),
    take: limit,
    skip: offset,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      smtpHost: true,
      isVerified: true,
      dailyLimit: true,
      hourlyLimit: true,
      replyTo: true,
      createdAt: true,
    },
  });

  return {
    senders: senders.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      smtpHost: s.smtpHost,
      isVerified: s.isVerified,
      dailyLimit: s.dailyLimit,
      hourlyLimit: s.hourlyLimit,
      replyTo: s.replyTo,
      createdAt: s.createdAt,
    })),
    total: senders.length,
    limit,
    offset,
  };
}

async function getSender(context: MCPContext, args: Record<string, unknown>): Promise<unknown> {
  const senderId = sanitizeString(args.senderId, 80);
  if (!senderId) return fail("senderId is required");

  const sender = await prisma.sender.findFirst({
    where: mcpScopeWhere(context, { id: senderId }),
  });

  if (!sender) return fail("Sender not found");

  return ok({
    id: sender.id,
    email: sender.email,
    name: sender.name,
    smtpHost: sender.smtpHost,
    smtpPort: sender.smtpPort,
    isVerified: sender.isVerified,
    dailyLimit: sender.dailyLimit,
    hourlyLimit: sender.hourlyLimit,
    replyTo: sender.replyTo,
    connectionType: sender.connectionType,
    createdAt: sender.createdAt,
  });
}

async function getSenderDetail(context: MCPContext, args: Record<string, unknown>): Promise<unknown> {
  const senderId = sanitizeString(args.senderId, 80);
  if (!senderId) return fail("senderId is required");

  const sender = await prisma.sender.findFirst({
    where: mcpScopeWhere(context, { id: senderId }),
  });
  if (!sender) return fail("Sender not found");

  const now = new Date();
  const hourWindow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0));

  const [hourlyAgg, warmupSchedule, cooldown] = await Promise.all([
    prisma.rateLimitCounter.aggregate({
      where: { senderId, hourWindow },
      _sum: { count: true },
    }),
    prisma.warmupSchedule.findUnique({ where: { senderId } }),
    prisma.senderCooldown.findUnique({ where: { senderId } }),
  ]);

  const currentHourlyCount = hourlyAgg._sum.count ?? 0;
  const isInWarmup = warmupSchedule?.isActive && !warmupSchedule?.optedOut;
  const warmupStatus = warmupSchedule?.optedOut ? "opted-out" : isInWarmup ? "active" : "inactive";
  const cooldownState = cooldown?.cooldownUntil && cooldown.cooldownUntil > now ? "active" : "inactive";

  return ok({
    id: sender.id,
    email: sender.email,
    name: sender.name,
    smtpHost: sender.smtpHost,
    smtpPort: sender.smtpPort,
    isVerified: sender.isVerified,
    dailyLimit: sender.dailyLimit,
    hourlyLimit: sender.hourlyLimit,
    replyTo: sender.replyTo,
    createdAt: sender.createdAt,
    currentHourlyCount,
    warmupStatus,
    cooldownState: {
      status: cooldownState,
      expiresAt: cooldown?.cooldownUntil ?? null,
    },
  });
}

async function createSender(context: MCPContext, args: Record<string, unknown>): Promise<unknown> {
  const email = sanitizeString(args.email, 254).toLowerCase();
  const name = sanitizeString(args.name, 200);
  const smtpHost = sanitizeString(args.smtpHost, 200) || "smtp.gmail.com";
  const smtpPort = Math.max(Number(args.smtpPort) || 465, 1);
  const replyTo = sanitizeString(args.replyTo, 254) || null;

  if (!email || !name) return fail("email and name are required");

  const existing = await prisma.sender.findFirst({
    where: mcpScopeWhere(context, { email }),
    select: { id: true },
  });
  if (existing) return fail("A sender with this email already exists");

  const sender = await prisma.sender.create({
    data: mcpCreateData(context, {
      name,
      email,
      smtpHost,
      smtpPort,
      replyTo,
      isVerified: false,
    }),
  });

  return ok({ senderId: sender.id, email: sender.email }, "Sender created (not yet verified)");
}

async function deleteSender(context: MCPContext, args: Record<string, unknown>): Promise<unknown> {
  const senderId = sanitizeString(args.senderId, 80);
  if (!senderId) return fail("senderId is required");

  const sender = await prisma.sender.findFirst({
    where: mcpScopeWhere(context, { id: senderId }),
  });
  if (!sender) return fail("Sender not found");

  await prisma.$transaction(async (tx) => {
    await tx.emailCampaign.updateMany({
      where: {
        OR: [
          { senderId },
          { campaignSenders: { some: { senderId } } },
        ],
        status: { in: ["SCHEDULED", "SENDING"] },
      },
      data: {
        status: "PAUSED",
        pauseReason: `Sender ${sender.email} removed`,
      },
    });

    await tx.emailCampaign.updateMany({
      where: { senderId },
      data: { senderId: null },
    });

    await tx.emailJob.updateMany({
      where: { senderId },
      data: { senderId: null },
    });

    await tx.campaignSender.deleteMany({ where: { senderId } });
    await tx.warmupSchedule.deleteMany({ where: { senderId } });
    await tx.senderCooldown.deleteMany({ where: { senderId } });
    await tx.sender.delete({ where: { id: senderId } });
  });

  return ok({ deleted: true }, "Sender deleted");
}

async function updateSender(context: MCPContext, args: Record<string, unknown>): Promise<unknown> {
  const senderId = sanitizeString(args.senderId, 80);
  if (!senderId) return fail("senderId is required");

  const sender = await prisma.sender.findFirst({
    where: mcpScopeWhere(context, { id: senderId }),
  });
  if (!sender) return fail("Sender not found");

  const updateData: Record<string, unknown> = {};
  if (args.name !== undefined) updateData.name = sanitizeString(args.name, 200);
  if (args.dailyLimit !== undefined) updateData.dailyLimit = Math.max(Number(args.dailyLimit), 1);
  if (args.hourlyLimit !== undefined) updateData.hourlyLimit = Math.max(Number(args.hourlyLimit), 1);
  if (args.replyTo !== undefined) updateData.replyTo = sanitizeString(args.replyTo, 254) || null;

  const updated = await prisma.sender.update({
    where: { id: senderId },
    data: updateData,
  });

  return ok({ senderId: updated.id }, "Sender updated");
}

export function registerSenderTools() {
  toolRegistry.register({
    name: "sender_list",
    description: "List all senders/emails",
    category: "senders",
    access: "read",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results" },
        offset: { type: "number", description: "Results offset" },
      },
    },
    handler: createToolHandler({ name: "sender_list", description: "", inputSchema: {}, handler: listSenders }),
  });

  toolRegistry.register({
    name: "sender_get",
    description: "Get sender basic details",
    category: "senders",
    access: "read",
    inputSchema: {
      type: "object",
      properties: { senderId: { type: "string" } },
      required: ["senderId"],
    },
    handler: createToolHandler({ name: "sender_get", description: "", inputSchema: {}, handler: getSender }),
  });

  toolRegistry.register({
    name: "sender_get_detail",
    description: "Get sender with throttle, warmup, and cooldown state",
    category: "senders",
    access: "read",
    inputSchema: {
      type: "object",
      properties: { senderId: { type: "string" } },
      required: ["senderId"],
    },
    handler: createToolHandler({ name: "sender_get_detail", description: "", inputSchema: {}, handler: getSenderDetail }),
  });

  toolRegistry.register({
    name: "sender_create",
    description: "Create a new sender (SMTP credentials should be added via UI or sender_verify)",
    category: "senders",
    access: "write",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Sender email address" },
        name: { type: "string", description: "Display name" },
        smtpHost: { type: "string", description: "SMTP host (default: smtp.gmail.com)" },
        smtpPort: { type: "number", description: "SMTP port (default: 465)" },
        replyTo: { type: "string", description: "Reply-to address" },
      },
      required: ["email", "name"],
    },
    handler: createToolHandler({ name: "sender_create", description: "", inputSchema: {}, handler: createSender }),
  });

  toolRegistry.register({
    name: "sender_update",
    description: "Update sender settings",
    category: "senders",
    access: "write",
    inputSchema: {
      type: "object",
      properties: {
        senderId: { type: "string" },
        name: { type: "string" },
        dailyLimit: { type: "number" },
        hourlyLimit: { type: "number" },
        replyTo: { type: "string" },
      },
      required: ["senderId"],
    },
    handler: createToolHandler({ name: "sender_update", description: "", inputSchema: {}, handler: updateSender }),
  });

  toolRegistry.register({
    name: "sender_delete",
    description: "Delete a sender (pauses active campaigns, cascades cleanup)",
    category: "senders",
    access: "write",
    destructive: true,
    inputSchema: {
      type: "object",
      properties: { senderId: { type: "string" } },
      required: ["senderId"],
    },
    handler: createToolHandler({ name: "sender_delete", description: "", inputSchema: {}, handler: deleteSender }),
  });
}
