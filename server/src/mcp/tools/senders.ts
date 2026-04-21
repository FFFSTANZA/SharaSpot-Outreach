import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";

async function listSenders(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { limit = 20, offset = 0 } = args;

  const senders = await prisma.sender.findMany({
    where: { userId: context.userId },
    take: Number(limit),
    skip: Number(offset),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      isVerified: true,
      dailyLimit: true,
      hourlyLimit: true,
      createdAt: true,
    },
  });

  return {
    senders: senders.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      isVerified: s.isVerified,
      dailyLimit: s.dailyLimit,
      hourlyLimit: s.hourlyLimit,
      createdAt: s.createdAt,
    })),
    total: senders.length,
  };
}

async function getSender(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { senderId } = args;

  const sender = await prisma.sender.findFirst({
    where: { id: String(senderId), userId: context.userId },
  });

  if (!sender) {
    return { success: false, message: "Sender not found" };
  }

  return {
    id: sender.id,
    email: sender.email,
    name: sender.name,
    isVerified: sender.isVerified,
    smtpHost: sender.smtpHost,
    smtpPort: sender.smtpPort,
    dailyLimit: sender.dailyLimit,
    hourlyLimit: sender.hourlyLimit,
    replyTo: sender.replyTo,
    createdAt: sender.createdAt,
  };
}

async function updateSender(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { senderId, name, dailyLimit, hourlyLimit, replyTo } = args;

  const sender = await prisma.sender.findFirst({
    where: { id: String(senderId), userId: context.userId },
  });

  if (!sender) {
    return { success: false, message: "Sender not found" };
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (dailyLimit !== undefined) updateData.dailyLimit = Number(dailyLimit);
  if (hourlyLimit !== undefined) updateData.hourlyLimit = Number(hourlyLimit);
  if (replyTo !== undefined) updateData.replyTo = replyTo;

  const updated = await prisma.sender.update({
    where: { id: String(senderId) },
    data: updateData,
  });

  return { success: true, senderId: updated.id };
}

export function registerSenderTools() {
  toolRegistry.register(
    {
      name: "sender_list",
      description: "List all senders/emails",
      inputSchema: {
        type: "object" as const,
        properties: {
          limit: { type: "number", description: "Max results" },
          offset: { type: "number", description: "Results offset" },
        },
      },
      handler: createToolHandler({ name: "sender_list", description: "", inputSchema: {} as never, handler: listSenders }),
    },
    "senders"
  );

  toolRegistry.register(
    {
      name: "sender_get",
      description: "Get sender details",
      inputSchema: {
        type: "object" as const,
        properties: {
          senderId: { type: "string", description: "Sender ID" },
        },
        required: ["senderId"],
      },
      handler: createToolHandler({ name: "sender_get", description: "", inputSchema: {} as never, handler: getSender }),
    },
    "senders"
  );

  toolRegistry.register(
    {
      name: "sender_update",
      description: "Update sender settings",
      inputSchema: {
        type: "object" as const,
        properties: {
          senderId: { type: "string", description: "Sender ID" },
          name: { type: "string", description: "Display name" },
          dailyLimit: { type: "number", description: "Daily send limit" },
          hourlyLimit: { type: "number", description: "Hourly send limit" },
          replyTo: { type: "string", description: "Reply-to email" },
        },
        required: ["senderId"],
      },
      handler: createToolHandler({ name: "sender_update", description: "", inputSchema: {} as never, handler: updateSender }),
    },
    "senders"
  );
}