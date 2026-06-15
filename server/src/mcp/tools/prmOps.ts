import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { MCPContext } from "../types";
import { fail, mcpCreateData, mcpScopeWhere, ok, sanitizeString, sanitizeStringArray } from "../helpers";

type SegmentExpression = {
  op?: "AND" | "OR";
  conditions?: Array<{ field: string; operator?: string; value?: unknown }>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STAGES = new Set(["NEW", "CONTACTED", "REPLIED", "INTERESTED", "MEETING_BOOKED", "CONVERTED", "NOT_A_FIT", "BOUNCED", "COLD", "WARM", "HOT"]);

async function qualitySummary(context: MCPContext) {
  const contacts = await prisma.contact.findMany({ where: mcpScopeWhere(context), select: { email: true, firstName: true, lastName: true } });
  const byEmail = new Map<string, number>();
  let invalidEmails = 0;
  let missingRequiredFields = 0;
  for (const contact of contacts) {
    const email = contact.email.toLowerCase().trim();
    byEmail.set(email, (byEmail.get(email) || 0) + 1);
    if (!EMAIL_REGEX.test(email)) invalidEmails++;
    if (!contact.firstName || !contact.lastName) missingRequiredFields++;
  }
  const duplicateContacts = Array.from(byEmail.values()).filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
  return ok({ totalContacts: contacts.length, duplicateContacts, invalidEmails, missingRequiredFields, launchBlocked: invalidEmails });
}

async function evaluateSegment(context: MCPContext, expression: SegmentExpression) {
  const contacts = await prisma.contact.findMany({
    where: mcpScopeWhere(context),
    include: { tags: true, activities: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const op = expression.op === "OR" ? "OR" : "AND";
  const conditions = Array.isArray(expression.conditions) ? expression.conditions : [];
  if (!conditions.length) return contacts;

  return contacts.filter((contact) => {
    const checks = conditions.map((condition) => {
      const value = condition.value;
      if (condition.field === "stage") {
        return condition.operator === "notEquals" ? contact.stage !== value : contact.stage === value;
      }
      if (condition.field === "tags") {
        const values = Array.isArray(value) ? value.map((item) => String(item).toLowerCase()) : [String(value).toLowerCase()];
        const tags = contact.tags.map((tag) => tag.name.toLowerCase());
        return values.some((item) => tags.includes(item));
      }
      if (condition.field === "lastActivity") {
        const days = Number(value);
        const last = contact.activities[0]?.createdAt;
        return Number.isFinite(days) && last ? Date.now() - last.getTime() <= days * 24 * 60 * 60 * 1000 : false;
      }
      if (condition.field === "company") {
        const company = (contact.company || "").toLowerCase();
        return company.includes(String(value || "").toLowerCase());
      }
      return false;
    });
    return op === "OR" ? checks.some(Boolean) : checks.every(Boolean);
  });
}

async function listSegments(context: MCPContext) {
  const segments = await prisma.prmSegment.findMany({
    where: mcpScopeWhere(context),
    include: { contacts: { select: { contactId: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return ok({ segments: segments.map((segment) => ({ ...segment, previewCount: segment.contacts.length })) });
}

async function previewSegment(context: MCPContext, args: Record<string, unknown>) {
  const expression = args.expression as SegmentExpression | undefined;
  if (!expression || typeof expression !== "object") return fail("expression is required");
  const matched = await evaluateSegment(context, expression);
  return ok({ previewCount: matched.length, ids: matched.map((contact) => contact.id) });
}

async function createSegment(context: MCPContext, args: Record<string, unknown>) {
  const name = sanitizeString(args.name, 120);
  const expression = args.expression as SegmentExpression | undefined;
  if (!name || !expression || typeof expression !== "object") return fail("name and expression are required");
  const matched = await evaluateSegment(context, expression);
  const segment = await prisma.prmSegment.create({
    data: mcpCreateData(context, {
      name,
      expression: expression as Prisma.InputJsonObject,
      isAdhoc: args.isAdhoc === true,
      contacts: { create: matched.map((contact) => ({ contactId: contact.id })) },
    }),
    include: { contacts: { select: { contactId: true } } },
  });
  return ok({ ...segment, previewCount: segment.contacts.length }, "Segment created");
}

async function updateSegment(context: MCPContext, args: Record<string, unknown>) {
  const segmentId = sanitizeString(args.segmentId, 80);
  if (!segmentId) return fail("segmentId is required");
  const existing = await prisma.prmSegment.findFirst({ where: mcpScopeWhere(context, { id: segmentId }) });
  if (!existing) return fail("Segment not found");
  const name = sanitizeString(args.name, 120);
  const expression = (args.expression || existing.expression) as SegmentExpression;
  const matched = await evaluateSegment(context, expression);
  const segment = await prisma.prmSegment.update({
    where: { id: existing.id },
    data: {
      ...(name ? { name } : {}),
      ...(args.expression ? { expression: expression as Prisma.InputJsonObject } : {}),
      contacts: { deleteMany: {}, create: matched.map((contact) => ({ contactId: contact.id })) },
    },
    include: { contacts: { select: { contactId: true } } },
  });
  return ok({ ...segment, previewCount: segment.contacts.length }, "Segment updated");
}

async function bulkAction(context: MCPContext, args: Record<string, unknown>) {
  const mode = args.mode === "apply" ? "apply" : "dry-run";
  const actionType = sanitizeString(args.actionType, 50);
  const contactIds = sanitizeStringArray(args.contactIds, 1000, 80);
  if (!actionType || !contactIds.length) return fail("actionType and contactIds are required");
  const contacts = await prisma.contact.findMany({
    where: mcpScopeWhere(context, { id: { in: contactIds } }),
    include: { tags: true, lists: true },
  });
  if (!contacts.length) return fail("No scoped contacts found");

  if (mode === "dry-run") {
    return ok({ mode, actionType, affectedCount: contacts.length, contactIds: contacts.map((contact) => contact.id) });
  }

  const stage = sanitizeString(args.stage, 40).toUpperCase();
  const tagId = sanitizeString(args.tagId, 80);
  const listId = sanitizeString(args.listId, 80);
  if (actionType === "update_stage" && !ALLOWED_STAGES.has(stage)) return fail("Invalid stage value");
  if (["add_tag", "remove_tag"].includes(actionType)) {
    const tag = await prisma.tag.findFirst({ where: mcpScopeWhere(context, { id: tagId }), select: { id: true } });
    if (!tag) return fail("Tag not found");
  }
  if (actionType === "add_to_list") {
    const list = await prisma.contactList.findFirst({ where: mcpScopeWhere(context, { id: listId }), select: { id: true } });
    if (!list) return fail("List not found");
  }
  if (!["update_stage", "add_tag", "remove_tag", "add_to_list"].includes(actionType)) return fail("Unsupported action");

  const undoToken = `undo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await prisma.$transaction(async (tx) => {
    const ids = contacts.map((contact) => contact.id);
    if (actionType === "update_stage") {
      await tx.contact.updateMany({ where: mcpScopeWhere(context, { id: { in: ids } }), data: { stage } });
    } else if (actionType === "add_tag") {
      await Promise.all(ids.map((id) => tx.contact.update({ where: { id }, data: { tags: { connect: { id: tagId } } } })));
    } else if (actionType === "remove_tag") {
      await Promise.all(ids.map((id) => tx.contact.update({ where: { id }, data: { tags: { disconnect: { id: tagId } } } })));
    } else if (actionType === "add_to_list") {
      await tx.contactList.update({ where: { id: listId }, data: { contacts: { connect: ids.map((id) => ({ id })) } } });
    }
    await tx.prmBulkActionLog.create({
      data: {
        userId: context.userId,
        actionType,
        affectedCount: contacts.length,
        undoToken,
        payload: {
          contactIds: ids,
          prev: contacts.map((contact) => ({
            id: contact.id,
            stage: contact.stage,
            tags: contact.tags.map((tag) => tag.id),
            lists: contact.lists.map((list) => list.id),
          })),
          next: { stage, tagId, listId },
        } as Prisma.InputJsonObject,
      },
    });
  });

  return ok({ mode, actionType, affectedCount: contacts.length, undoToken }, "Bulk action applied");
}

async function bulkActionDryRun(context: MCPContext, args: Record<string, unknown>) {
  return bulkAction(context, { ...args, mode: "dry-run" });
}

async function bulkActionApply(context: MCPContext, args: Record<string, unknown>) {
  return bulkAction(context, { ...args, mode: "apply" });
}

async function undoBulkAction(context: MCPContext, args: Record<string, unknown>) {
  const undoToken = sanitizeString(args.undoToken, 120);
  if (!undoToken) return fail("undoToken is required");
  const log = await prisma.prmBulkActionLog.findFirst({ where: { userId: context.userId, undoToken } });
  if (!log || log.undoneAt) return fail("Undo token not found or already used");
  if (Date.now() - log.createdAt.getTime() > 10 * 60 * 1000) return fail("Undo window expired");
  const payload = log.payload as { prev?: Array<{ id: string; stage: string; tags: string[]; lists: string[] }> };
  const previous = Array.isArray(payload?.prev) ? payload.prev : [];
  await prisma.$transaction(async (tx) => {
    for (const prev of previous) {
      const contact = await tx.contact.findFirst({ where: mcpScopeWhere(context, { id: prev.id }), select: { id: true } });
      if (!contact) continue;
      await tx.contact.update({
        where: { id: contact.id },
        data: {
          stage: prev.stage,
          tags: { set: (prev.tags || []).map((id) => ({ id })) },
          lists: { set: (prev.lists || []).map((id) => ({ id })) },
        },
      });
    }
    await tx.prmBulkActionLog.update({ where: { id: log.id }, data: { undoneAt: new Date() } });
  });
  return ok({ affectedCount: previous.length }, "Bulk action rolled back");
}

export function registerPrmTools() {
  toolRegistry.register({ name: "prm_quality_summary", description: "Summarize PRM data quality", category: "prm", access: "read", inputSchema: { type: "object", properties: {} }, handler: createToolHandler({ name: "prm_quality_summary", description: "", inputSchema: {}, handler: qualitySummary }) });
  toolRegistry.register({ name: "prm_segment_list", description: "List PRM segments", category: "prm", access: "read", inputSchema: { type: "object", properties: {} }, handler: createToolHandler({ name: "prm_segment_list", description: "", inputSchema: {}, handler: listSegments }) });
  toolRegistry.register({ name: "prm_segment_preview", description: "Preview contacts matching a PRM segment expression", category: "prm", access: "read", inputSchema: { type: "object", properties: { expression: { type: "object" } }, required: ["expression"] }, handler: createToolHandler({ name: "prm_segment_preview", description: "", inputSchema: {}, handler: previewSegment }) });
  toolRegistry.register({ name: "prm_segment_create", description: "Create a PRM segment", category: "prm", access: "write", inputSchema: { type: "object", properties: { name: { type: "string" }, expression: { type: "object" }, isAdhoc: { type: "boolean" } }, required: ["name", "expression"] }, handler: createToolHandler({ name: "prm_segment_create", description: "", inputSchema: {}, handler: createSegment }) });
  toolRegistry.register({ name: "prm_segment_update", description: "Update and re-evaluate a PRM segment", category: "prm", access: "write", inputSchema: { type: "object", properties: { segmentId: { type: "string" }, name: { type: "string" }, expression: { type: "object" } }, required: ["segmentId"] }, handler: createToolHandler({ name: "prm_segment_update", description: "", inputSchema: {}, handler: updateSegment }) });
  toolRegistry.register({ name: "prm_bulk_action_dry_run", description: "Dry-run a PRM bulk action", category: "prm", access: "read", inputSchema: { type: "object", properties: { actionType: { type: "string" }, contactIds: { type: "array", items: { type: "string" } }, stage: { type: "string" }, tagId: { type: "string" }, listId: { type: "string" } }, required: ["actionType", "contactIds"] }, handler: createToolHandler({ name: "prm_bulk_action_dry_run", description: "", inputSchema: {}, handler: bulkActionDryRun }) });
  toolRegistry.register({ name: "prm_bulk_action_apply", description: "Apply a PRM bulk action", category: "prm", access: "write", destructive: true, inputSchema: { type: "object", properties: { actionType: { type: "string" }, contactIds: { type: "array", items: { type: "string" } }, stage: { type: "string" }, tagId: { type: "string" }, listId: { type: "string" } }, required: ["actionType", "contactIds"] }, handler: createToolHandler({ name: "prm_bulk_action_apply", description: "", inputSchema: {}, handler: bulkActionApply }) });
  toolRegistry.register({ name: "prm_bulk_action_undo", description: "Undo a recent PRM bulk action", category: "prm", access: "write", destructive: true, inputSchema: { type: "object", properties: { undoToken: { type: "string" } }, required: ["undoToken"] }, handler: createToolHandler({ name: "prm_bulk_action_undo", description: "", inputSchema: {}, handler: undoBulkAction }) });
}
