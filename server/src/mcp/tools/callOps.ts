import { prisma } from "../../config/prisma";
import { CALL_NEXT_ACTIONS, normalizeCallDisposition, STAGE_BY_DISPOSITION, TERMINAL_DISPOSITIONS } from "../../utils/callDispositions";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { MCPContext } from "../types";
import {
  clampLimit,
  fail,
  mcpCreateData,
  mcpScopeWhere,
  ok,
  sanitizeDate,
  sanitizeOffset,
  sanitizeString,
} from "../helpers";

async function listQueue(context: MCPContext, args: Record<string, unknown>) {
  const status = sanitizeString(args.status, 20).toUpperCase();
  const search = sanitizeString(args.search, 200);
  const limit = clampLimit(args.limit, 50, 100);
  const offset = sanitizeOffset(args.offset);
  const where: any = mcpScopeWhere(context);
  if (["PENDING", "COMPLETED", "SKIPPED"].includes(status)) where.status = status;
  if (search) {
    where.contact = {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  const [tasks, total] = await Promise.all([
    prisma.callTask.findMany({
      where,
      include: { contact: true },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.callTask.count({ where }),
  ]);
  return ok({ tasks, total, limit, offset });
}

async function createTask(context: MCPContext, args: Record<string, unknown>) {
  const contactId = sanitizeString(args.contactId, 80);
  const dueAt = sanitizeDate(args.dueAt);
  if (!contactId || !dueAt) return fail("contactId and valid dueAt are required");
  const contact = await prisma.contact.findFirst({ where: mcpScopeWhere(context, { id: contactId }), select: { id: true } });
  if (!contact) return fail("Contact not found");
  const priority = Math.max(Number(args.priority) || 0, 0);
  const task = await prisma.callTask.create({
    data: mcpCreateData(context, {
      contactId,
      dueAt,
      priority,
      contactListId: sanitizeString(args.contactListId, 80) || null,
      campaignId: sanitizeString(args.campaignId, 80) || null,
      prmSegmentId: sanitizeString(args.prmSegmentId, 80) || null,
    }),
  });
  await prisma.contactActivity.create({ data: { contactId, type: "CALL_TASK_CREATED", metadata: { dueAt: dueAt.toISOString(), priority } } });
  return ok({ task }, "Call task created");
}

async function submitDisposition(context: MCPContext, args: Record<string, unknown>) {
  const contactId = sanitizeString(args.contactId, 80);
  const outcome = normalizeCallDisposition(sanitizeString(args.outcome, 80));
  if (!contactId || !outcome) return fail("contactId and valid outcome are required");
  const contact = await prisma.contact.findFirst({ where: mcpScopeWhere(context, { id: contactId }), select: { id: true, stage: true } });
  if (!contact) return fail("Contact not found");

  const taskId = sanitizeString(args.taskId, 80);
  const sessionId = sanitizeString(args.sessionId, 80);
  const note = sanitizeString(args.note, 5000) || null;
  const nextAction = sanitizeString(args.nextAction, 50).toUpperCase();
  const nextCallAt = sanitizeDate(args.nextCallAt);
  const isTerminal = TERMINAL_DISPOSITIONS.has(outcome);
  if (!isTerminal && nextAction && !(CALL_NEXT_ACTIONS as readonly string[]).includes(nextAction)) {
    return fail("Invalid nextAction");
  }

  const result = await prisma.$transaction(async (tx) => {
    let closedTaskId: string | null = null;
    let followUpTaskId: string | null = null;
    if (taskId) {
      const task = await tx.callTask.findFirst({ where: mcpScopeWhere(context, { id: taskId, contactId }), select: { id: true, status: true, priority: true } });
      if (!task) throw new Error("Call task not found");
      if (task.status !== "PENDING") throw new Error("Call task is already closed");
      await tx.callTask.update({
        where: { id: task.id },
        data: {
          status: outcome === "DO_NOT_CALL" ? "SKIPPED" : "COMPLETED",
          lastOutcome: outcome,
          lastDisposition: outcome,
          lastNote: note,
        },
      });
      closedTaskId = task.id;
      if (!isTerminal) {
        const followUp = await tx.callTask.create({
          data: mcpCreateData(context, {
            contactId,
            status: "PENDING",
            dueAt: nextCallAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
            priority: task.priority,
            lastOutcome: outcome,
            lastDisposition: outcome,
            lastNote: note,
          }),
          select: { id: true },
        });
        followUpTaskId = followUp.id;
      }
    }

    const nextStage = STAGE_BY_DISPOSITION[outcome];
    if (nextStage && nextStage !== contact.stage) {
      await tx.contact.update({ where: { id: contactId }, data: { stage: nextStage } });
    }

    const endedAt = new Date();
    let finalSessionId = sessionId || null;
    if (sessionId) {
      const session = await tx.callSession.findFirst({ where: { id: sessionId, userId: context.userId }, select: { id: true } });
      if (!session) throw new Error("Session not found");
      await tx.callSession.update({
        where: { id: session.id },
        data: { contactId, taskId: closedTaskId, outcome, note, endedAt, metadata: { nextAction: nextAction || null, followUpTaskId } },
      });
    } else {
      const session = await tx.callSession.create({
        data: {
          userId: context.userId,
          contactId,
          taskId: closedTaskId,
          mode: "MANUAL",
          direction: "OUTBOUND",
          outcome,
          note,
          endedAt,
          metadata: { nextAction: nextAction || null, followUpTaskId },
        },
        select: { id: true },
      });
      finalSessionId = session.id;
    }

    await tx.contactActivity.create({
      data: { contactId, type: "CALL_LOGGED", metadata: { outcome, note, nextAction: nextAction || null, followUpTaskId, sessionId: finalSessionId } },
    });

    return { sessionId: finalSessionId, closedTaskId, followUpTaskId };
  });

  return ok(result, "Call disposition saved");
}

export function registerCallTools() {
  toolRegistry.register({ name: "calls_queue_list", description: "List call queue tasks", category: "calls", access: "read", inputSchema: { type: "object", properties: { status: { type: "string" }, search: { type: "string" }, limit: { type: "number" }, offset: { type: "number" } } }, handler: createToolHandler({ name: "calls_queue_list", description: "", inputSchema: {}, handler: listQueue }) });
  toolRegistry.register({ name: "calls_task_create", description: "Create a call task", category: "calls", access: "write", inputSchema: { type: "object", properties: { contactId: { type: "string" }, dueAt: { type: "string" }, priority: { type: "number" }, contactListId: { type: "string" }, campaignId: { type: "string" }, prmSegmentId: { type: "string" } }, required: ["contactId", "dueAt"] }, handler: createToolHandler({ name: "calls_task_create", description: "", inputSchema: {}, handler: createTask }) });
  toolRegistry.register({ name: "calls_disposition_submit", description: "Log a call disposition and update the contact/task", category: "calls", access: "write", destructive: true, inputSchema: { type: "object", properties: { contactId: { type: "string" }, outcome: { type: "string" }, note: { type: "string" }, nextAction: { type: "string" }, nextCallAt: { type: "string" }, taskId: { type: "string" }, sessionId: { type: "string" } }, required: ["contactId", "outcome"] }, handler: createToolHandler({ name: "calls_disposition_submit", description: "", inputSchema: {}, handler: submitDisposition }) });
}
