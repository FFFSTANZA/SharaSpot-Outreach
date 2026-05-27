import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { MCPContext } from "../types";
import { clampLimit, fail, mcpScopeWhere, ok, sanitizeOffset, sanitizeString } from "../helpers";

function sanitizeInt(value: unknown, min: number, max: number): number | null {
  const num = Number(value);
  if (!Number.isInteger(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

function sanitizeAltSubjects(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => sanitizeString(entry, 300))
    .filter(Boolean)
    .slice(0, 3);
}

function buildSequenceCondition(args: Record<string, unknown>): string | null {
  const rawCondition = sanitizeString(args.condition, 4000);
  const rules = typeof args.rules === "object" && args.rules !== null ? args.rules : undefined;
  const onMatchStepNumber = sanitizeInt(args.onMatchStepNumber, 1, 200);
  const onNoMatchStepNumber = sanitizeInt(args.onNoMatchStepNumber, 1, 200);
  const altSubjects = sanitizeAltSubjects(args.altSubjects);
  const sendHour = sanitizeInt(args.sendHour, -1, 23);
  const waitHours = sanitizeInt(args.waitHours, 0, 23);

  const hasExtended = altSubjects.length > 0 || sendHour !== null || waitHours !== null;
  const hasAdvanced = !!rules || onMatchStepNumber !== null || onNoMatchStepNumber !== null;

  if (hasAdvanced) {
    let normalizedRules = rules;
    if (!normalizedRules && rawCondition && rawCondition !== "none") {
      normalizedRules = { operator: "AND", operands: [{ type: rawCondition }] };
    }
    return JSON.stringify({
      v: 2,
      kind: "advanced",
      rules: normalizedRules ?? null,
      onMatchStepNumber,
      onNoMatchStepNumber,
      ...(hasExtended ? { altSubjects, ...(sendHour !== null ? { sendHour } : {}), ...(waitHours !== null ? { waitHours } : {}) } : {}),
    });
  }

  if (rawCondition && rawCondition.startsWith("{")) {
    return rawCondition;
  }

  if (hasExtended) {
    return JSON.stringify({
      v: 1,
      kind: "simple_extended",
      type: rawCondition || "none",
      altSubjects,
      ...(sendHour !== null ? { sendHour } : {}),
      ...(waitHours !== null ? { waitHours } : {}),
    });
  }

  return rawCondition || null;
}

async function setCampaignStatus(context: MCPContext, args: Record<string, unknown>, status: "PAUSED" | "SCHEDULED" | "CANCELLED") {
  const campaignId = sanitizeString(args.campaignId, 80);
  if (!campaignId) return fail("campaignId is required");
  const campaign = await prisma.emailCampaign.findFirst({ where: mcpScopeWhere(context, { id: campaignId }), select: { id: true, status: true } });
  if (!campaign) return fail("Campaign not found");
  if (status === "PAUSED" && campaign.status !== "SENDING" && campaign.status !== "SCHEDULED") return fail("Only sending or scheduled campaigns can be paused");
  if (status === "SCHEDULED" && campaign.status !== "PAUSED") return fail("Only paused campaigns can be resumed");
  if (status === "CANCELLED" && campaign.status === "COMPLETED") return fail("Completed campaigns cannot be cancelled");

  const updated = await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { status, ...(status === "PAUSED" ? { pauseReason: sanitizeString(args.reason, 300) || "Paused by MCP" } : {}) },
    select: { id: true, status: true, pauseReason: true },
  });
  if (status === "CANCELLED") {
    await prisma.emailJob.updateMany({ where: { campaignId: campaign.id, status: { in: ["PENDING", "SENDING"] } }, data: { status: "CANCELLED" } });
  }
  return ok({ campaign: updated }, `Campaign ${status.toLowerCase()}`);
}

async function pauseCampaign(context: MCPContext, args: Record<string, unknown>) {
  return setCampaignStatus(context, args, "PAUSED");
}

async function resumeCampaign(context: MCPContext, args: Record<string, unknown>) {
  return setCampaignStatus(context, args, "SCHEDULED");
}

async function cancelCampaign(context: MCPContext, args: Record<string, unknown>) {
  return setCampaignStatus(context, args, "CANCELLED");
}

async function throttleStatus(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  if (!campaignId) return fail("campaignId is required");
  const campaign = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
    include: {
      sender: { select: { id: true, email: true, hourlyLimit: true, dailyLimit: true } },
      campaignSenders: { include: { sender: { select: { id: true, email: true, hourlyLimit: true, dailyLimit: true } } } },
    },
  });
  if (!campaign) return fail("Campaign not found");
  const senders = campaign.campaignSenders.length
    ? campaign.campaignSenders.map((item) => item.sender)
    : campaign.sender ? [campaign.sender] : [];
  const counters = await prisma.rateLimitCounter.findMany({
    where: { senderId: { in: senders.map((sender) => sender.id) } },
    orderBy: { hourWindow: "desc" },
    take: 50,
  });
  return ok({
    campaign: { id: campaign.id, status: campaign.status, hourlyLimit: campaign.hourlyLimit, delaySeconds: campaign.delaySeconds },
    senders,
    counters,
  });
}

async function listSequence(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  if (!campaignId) return fail("campaignId is required");
  const campaign = await prisma.emailCampaign.findFirst({ where: mcpScopeWhere(context, { id: campaignId }), select: { id: true } });
  if (!campaign) return fail("Campaign not found");
  const steps = await prisma.sequenceStep.findMany({ where: { campaignId }, orderBy: { stepNumber: "asc" } });
  return ok({ steps });
}

async function upsertSequenceStep(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  const stepNumber = Number(args.stepNumber);
  const subject = sanitizeString(args.subject, 300);
  const body = sanitizeString(args.body, 20000);
  const waitDays = Math.max(Number(args.waitDays) || 0, 0);
  if (!campaignId || !Number.isFinite(stepNumber) || stepNumber < 1 || !subject || !body) {
    return fail("campaignId, stepNumber, subject, and body are required");
  }
  const campaign = await prisma.emailCampaign.findFirst({ where: mcpScopeWhere(context, { id: campaignId }), select: { id: true, status: true } });
  if (!campaign) return fail("Campaign not found");
  if (campaign.status !== "SCHEDULED" && campaign.status !== "PAUSED") return fail("Only scheduled or paused campaigns can be changed");
  const condition = buildSequenceCondition(args);
  const step = await prisma.sequenceStep.upsert({
    where: { campaignId_stepNumber: { campaignId, stepNumber } },
    create: { campaignId, stepNumber, subject, body, waitDays, condition },
    update: { subject, body, waitDays, condition },
  });
  return ok({ step }, "Sequence step saved");
}

async function getSequenceConfig(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  if (!campaignId) return fail("campaignId is required");
  const campaign = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
    select: { id: true, sequenceConfig: true },
  });
  if (!campaign) return fail("Campaign not found");
  return ok({ sequenceConfig: campaign.sequenceConfig ?? null });
}

async function updateSequenceConfig(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  if (!campaignId) return fail("campaignId is required");
  const campaign = await prisma.emailCampaign.findFirst({
    where: mcpScopeWhere(context, { id: campaignId }),
    select: { id: true, status: true, sequenceConfig: true },
  });
  if (!campaign) return fail("Campaign not found");
  if (campaign.status !== "SCHEDULED" && campaign.status !== "PAUSED") return fail("Only scheduled or paused campaigns can be changed");

  const schedule = typeof args.sequenceSchedule === "object" && args.sequenceSchedule !== null
    ? args.sequenceSchedule
    : null;
  const frequencyCaps = typeof args.frequencyCaps === "object" && args.frequencyCaps !== null
    ? args.frequencyCaps
    : null;

  const nextConfig = JSON.parse(JSON.stringify({ schedule, frequencyCaps }));

  const updated = await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { sequenceConfig: nextConfig as Prisma.InputJsonValue },
    select: { id: true, sequenceConfig: true },
  });
  return ok({ campaignId: updated.id, sequenceConfig: updated.sequenceConfig }, "Sequence config updated");
}

async function deleteSequenceStep(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  const stepNumber = Number(args.stepNumber);
  if (!campaignId || !Number.isFinite(stepNumber)) return fail("campaignId and stepNumber are required");
  const campaign = await prisma.emailCampaign.findFirst({ where: mcpScopeWhere(context, { id: campaignId }), select: { id: true } });
  if (!campaign) return fail("Campaign not found");
  await prisma.sequenceStep.deleteMany({ where: { campaignId, stepNumber } });
  return ok({ deleted: true }, "Sequence step deleted");
}

async function searchCampaignEmails(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  if (!campaignId) return fail("campaignId is required");
  const campaign = await prisma.emailCampaign.findFirst({ where: mcpScopeWhere(context, { id: campaignId }), select: { id: true } });
  if (!campaign) return fail("Campaign not found");
  const search = sanitizeString(args.search, 200);
  const status = sanitizeString(args.status, 20);
  const where: Prisma.EmailJobWhereInput = { campaignId };
  if (status) where.status = status as any;
  if (search) where.toEmail = { contains: search, mode: "insensitive" };
  const limit = clampLimit(args.limit, 50, 100);
  const offset = sanitizeOffset(args.offset);
  const [emails, total] = await Promise.all([
    prisma.emailJob.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    prisma.emailJob.count({ where }),
  ]);
  return ok({ emails, total, limit, offset });
}

async function updateRecipientStatus(context: MCPContext, args: Record<string, unknown>) {
  const campaignId = sanitizeString(args.campaignId, 80);
  const emailJobId = sanitizeString(args.emailJobId, 80);
  const toEmail = sanitizeString(args.toEmail, 254).toLowerCase();
  const status = sanitizeString(args.status, 20).toUpperCase();
  if (!campaignId || (!emailJobId && !toEmail) || !["PENDING", "SENDING", "SENT", "FAILED", "CANCELLED"].includes(status)) {
    return fail("campaignId, status, and emailJobId or toEmail are required");
  }
  const campaign = await prisma.emailCampaign.findFirst({ where: mcpScopeWhere(context, { id: campaignId }), select: { id: true } });
  if (!campaign) return fail("Campaign not found");
  const result = await prisma.emailJob.updateMany({
    where: { campaignId, ...(emailJobId ? { id: emailJobId } : { toEmail }) },
    data: { status: status as any },
  });
  return ok({ affectedCount: result.count }, "Recipient status updated");
}

export function registerCampaignOperatorTools() {
  const campaignIdSchema = { type: "object" as const, properties: { campaignId: { type: "string" } }, required: ["campaignId"] };
  toolRegistry.register({ name: "campaign_pause", description: "Pause a sending or scheduled campaign", category: "campaigns", access: "write", inputSchema: { type: "object", properties: { campaignId: { type: "string" }, reason: { type: "string" } }, required: ["campaignId"] }, handler: createToolHandler({ name: "campaign_pause", description: "", inputSchema: {}, handler: pauseCampaign }) });
  toolRegistry.register({ name: "campaign_resume", description: "Resume a paused campaign", category: "campaigns", access: "write", inputSchema: campaignIdSchema, handler: createToolHandler({ name: "campaign_resume", description: "", inputSchema: {}, handler: resumeCampaign }) });
  toolRegistry.register({ name: "campaign_cancel", description: "Cancel a campaign and pending recipients", category: "campaigns", access: "write", destructive: true, inputSchema: campaignIdSchema, handler: createToolHandler({ name: "campaign_cancel", description: "", inputSchema: {}, handler: cancelCampaign }) });
  toolRegistry.register({ name: "campaign_throttle_status", description: "Inspect campaign sender throttle counters", category: "campaigns", access: "read", inputSchema: campaignIdSchema, handler: createToolHandler({ name: "campaign_throttle_status", description: "", inputSchema: {}, handler: throttleStatus }) });
  toolRegistry.register({ name: "campaign_sequence_list", description: "List campaign sequence steps", category: "campaigns", access: "read", inputSchema: campaignIdSchema, handler: createToolHandler({ name: "campaign_sequence_list", description: "", inputSchema: {}, handler: listSequence }) });
  toolRegistry.register({ name: "campaign_sequence_upsert", description: "Create or update a campaign sequence step", category: "campaigns", access: "write", inputSchema: { type: "object", properties: { campaignId: { type: "string" }, stepNumber: { type: "number" }, subject: { type: "string" }, body: { type: "string" }, waitDays: { type: "number" }, condition: { type: "string", description: "Simple condition or serialized JSON condition." }, rules: { type: "object", description: "Advanced branching rule group." }, onMatchStepNumber: { type: "number", description: "Branch target step number when rules match." }, onNoMatchStepNumber: { type: "number", description: "Branch target step number when rules do not match." }, altSubjects: { type: "array", description: "Up to 3 A/B subject alternatives." }, sendHour: { type: "number", description: "Step-level send hour override (-1..23)." }, waitHours: { type: "number", description: "Step-level extra wait hours (0..23)." } }, required: ["campaignId", "stepNumber", "subject", "body"] }, handler: createToolHandler({ name: "campaign_sequence_upsert", description: "", inputSchema: {}, handler: upsertSequenceStep }) });
  toolRegistry.register({ name: "campaign_sequence_config_get", description: "Get campaign follow-up schedule/cap config", category: "campaigns", access: "read", inputSchema: campaignIdSchema, handler: createToolHandler({ name: "campaign_sequence_config_get", description: "", inputSchema: {}, handler: getSequenceConfig }) });
  toolRegistry.register({ name: "campaign_sequence_config_update", description: "Update campaign follow-up schedule/cap config", category: "campaigns", access: "write", inputSchema: { type: "object", properties: { campaignId: { type: "string" }, sequenceSchedule: { type: "object" }, frequencyCaps: { type: "object" } }, required: ["campaignId"] }, handler: createToolHandler({ name: "campaign_sequence_config_update", description: "", inputSchema: {}, handler: updateSequenceConfig }) });
  toolRegistry.register({ name: "campaign_sequence_delete", description: "Delete a campaign sequence step", category: "campaigns", access: "write", destructive: true, inputSchema: { type: "object", properties: { campaignId: { type: "string" }, stepNumber: { type: "number" } }, required: ["campaignId", "stepNumber"] }, handler: createToolHandler({ name: "campaign_sequence_delete", description: "", inputSchema: {}, handler: deleteSequenceStep }) });
  toolRegistry.register({ name: "campaign_email_search", description: "Search campaign recipient email jobs", category: "campaigns", access: "read", inputSchema: { type: "object", properties: { campaignId: { type: "string" }, search: { type: "string" }, status: { type: "string" }, limit: { type: "number" }, offset: { type: "number" } }, required: ["campaignId"] }, handler: createToolHandler({ name: "campaign_email_search", description: "", inputSchema: {}, handler: searchCampaignEmails }) });
  toolRegistry.register({ name: "campaign_recipient_status_update", description: "Update one campaign recipient status", category: "campaigns", access: "write", inputSchema: { type: "object", properties: { campaignId: { type: "string" }, emailJobId: { type: "string" }, toEmail: { type: "string" }, status: { type: "string" } }, required: ["campaignId", "status"] }, handler: createToolHandler({ name: "campaign_recipient_status_update", description: "", inputSchema: {}, handler: updateRecipientStatus }) });
}
