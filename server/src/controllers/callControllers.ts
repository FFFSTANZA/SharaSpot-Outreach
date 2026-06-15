import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logContactActivity } from "../utils/contactService";
import { getOrgId, getOrgScope, OrgScope } from "../utils/orgScope";
import { CALL_NEXT_ACTIONS, normalizeCallDisposition, STAGE_BY_DISPOSITION, TERMINAL_DISPOSITIONS } from "../utils/callDispositions";

const isValidDate = (val: string): boolean => {
  const d = new Date(val);
  return !isNaN(d.getTime());
};

const ASSIGNEE_SELECT = { id: true, name: true, email: true, avatarUrl: true } as const;

const resolveAssigneeId = async (req: Request, assignedToId: unknown): Promise<string | null | undefined> => {
  if (assignedToId === undefined) return undefined;
  if (assignedToId === null || assignedToId === "") return null;

  const userId = String(assignedToId);
  const orgId = getOrgId(req);
  if (!orgId) {
    return userId === req.user!.id ? userId : undefined;
  }

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
    select: { userId: true },
  });
  return member ? userId : undefined;
};

type DispositionInput = {
  userId: string;
  contactId: string;
  taskId?: string;
  outcome: string;
  note?: string;
  nextAction?: string;
  nextCallAt?: string;
  sessionId?: string;
};

const createOrUpdatePendingTask = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: {
    userId: string;
    contactId: string;
    dueAt: Date;
    priority?: number;
    lastOutcome?: string | null;
    lastDisposition?: string | null;
    lastNote?: string | null;
    assignedToId?: string | null;
    contactListId?: string | null;
    campaignId?: string | null;
    prmSegmentId?: string | null;
  },
  scope?: OrgScope,
) => {
  const existingPending = await tx.callTask.findFirst({
    where: { userId: input.userId, contactId: input.contactId, status: "PENDING", ...scope },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    select: { id: true, dueAt: true, priority: true, assignedToId: true, contactListId: true, campaignId: true, prmSegmentId: true },
  });

  if (existingPending) {
    const mergedDueAt = input.dueAt < existingPending.dueAt ? input.dueAt : existingPending.dueAt;
    const mergedPriority = Math.max(existingPending.priority, input.priority ?? 0);

    return tx.callTask.update({
      where: { id: existingPending.id },
      data: {
        dueAt: mergedDueAt,
        priority: mergedPriority,
        lastOutcome: input.lastOutcome ?? undefined,
        lastDisposition: input.lastDisposition ?? undefined,
        lastNote: input.lastNote ?? undefined,
        assignedToId: input.assignedToId !== undefined ? input.assignedToId : existingPending.assignedToId,
        contactListId: existingPending.contactListId ?? input.contactListId ?? undefined,
        campaignId: existingPending.campaignId ?? input.campaignId ?? undefined,
        prmSegmentId: existingPending.prmSegmentId ?? input.prmSegmentId ?? undefined,
      },
      select: { id: true },
    });
  }

  return tx.callTask.create({
    data: {
      userId: input.userId,
      contactId: input.contactId,
      status: "PENDING",
      dueAt: input.dueAt,
      priority: input.priority ?? 0,
      lastOutcome: input.lastOutcome ?? null,
      lastDisposition: input.lastDisposition ?? null,
      lastNote: input.lastNote ?? null,
      assignedToId: input.assignedToId ?? null,
      contactListId: input.contactListId ?? null,
      campaignId: input.campaignId ?? null,
      prmSegmentId: input.prmSegmentId ?? null,
      ...(scope?.organizationId ? { organizationId: scope.organizationId } : {}),
    },
    select: { id: true },
  });
};

const applyDisposition = async (input: DispositionInput, scope?: OrgScope) => {
  const { userId, contactId, taskId, outcome, note, nextAction, nextCallAt, sessionId } = input;

  const normalizedOutcome = normalizeCallDisposition(outcome);
  if (!normalizedOutcome) {
    const err = new Error("Invalid outcome");
    (err as any).statusCode = 400;
    throw err;
  }

  const normalizedNextAction = (nextAction || "").trim().toUpperCase();
  const isTerminal = TERMINAL_DISPOSITIONS.has(normalizedOutcome);

  if (normalizedNextAction && !(CALL_NEXT_ACTIONS as readonly string[]).includes(normalizedNextAction)) {
    const err = new Error("Invalid nextAction");
    (err as any).statusCode = 400;
    throw err;
  }

  if (!isTerminal && !normalizedNextAction) {
    const err = new Error("nextAction is required for non-terminal outcomes");
    (err as any).statusCode = 400;
    throw err;
  }

  const contact = await prisma.contact.findFirst({ where: { id: contactId, ...scope } });
  if (!contact) {
    const err = new Error("Contact not found");
    (err as any).statusCode = 404;
    throw err;
  }

    return prisma.$transaction(async (tx) => {
    let existingTask: {
      id: string;
      status: "PENDING" | "COMPLETED" | "SKIPPED";
      contactListId: string | null;
      campaignId: string | null;
      prmSegmentId: string | null;
      assignedToId: string | null;
      priority: number;
    } | null = null;
    let newTask: { id: string } | null = null;

    if (taskId) {
      existingTask = await tx.callTask.findFirst({
        where: { id: taskId, contactId, ...scope },
        select: { id: true, status: true, contactListId: true, campaignId: true, prmSegmentId: true, assignedToId: true, priority: true },
      });
      if (!existingTask) {
        const err = new Error("Call task not found for contact");
        (err as any).statusCode = 404;
        throw err;
      }

      if (existingTask.status !== "PENDING") {
        const err = new Error("Call task is already closed");
        (err as any).statusCode = 409;
        throw err;
      }

      await tx.callTask.update({
        where: { id: existingTask.id },
        data: {
          status: isTerminal ? (normalizedOutcome === "DO_NOT_CALL" ? "SKIPPED" : "COMPLETED") : "COMPLETED",
          lastOutcome: normalizedOutcome,
          lastDisposition: normalizedOutcome,
          lastNote: note?.trim() || null,
        },
      });
    }

    if (!isTerminal) {
      let dueAt: Date;
      if (nextCallAt && isValidDate(nextCallAt)) {
        dueAt = new Date(nextCallAt);
      } else if (nextCallAt && !isValidDate(nextCallAt)) {
        const err = new Error("Invalid nextCallAt date");
        (err as any).statusCode = 400;
        throw err;
      } else {
        dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      newTask = await createOrUpdatePendingTask(tx, {
        userId,
        contactId,
        dueAt,
        priority: existingTask?.priority ?? 0,
        lastOutcome: normalizedOutcome,
        lastDisposition: normalizedOutcome,
        lastNote: note?.trim() || null,
        assignedToId: existingTask?.assignedToId ?? contact.assignedToId ?? null,
        contactListId: existingTask?.contactListId || null,
        campaignId: existingTask?.campaignId || null,
        prmSegmentId: existingTask?.prmSegmentId || null,
      }, scope);
    }

    const nextStage = STAGE_BY_DISPOSITION[normalizedOutcome];
    if (nextStage && nextStage !== contact.stage) {
      await tx.contact.update({ where: { id: contactId }, data: { stage: nextStage } });
    }

    const endedAt = new Date();
    let finalSessionId: string | null = null;
    if (sessionId) {
      const existingSession = await tx.callSession.findFirst({
        where: { id: sessionId, ...scope },
        select: { id: true, contactId: true, taskId: true, startedAt: true, metadata: true, durationSeconds: true, endedAt: true },
      });
      if (!existingSession) {
        const err = new Error("Session not found");
        (err as any).statusCode = 404;
        throw err;
      }
      if (existingSession.contactId && existingSession.contactId !== contactId) {
        const err = new Error("Session/contact mismatch");
        (err as any).statusCode = 400;
        throw err;
      }
      if (existingSession.taskId && taskId && existingSession.taskId !== taskId) {
        const err = new Error("Session/task mismatch");
        (err as any).statusCode = 400;
        throw err;
      }

      const durationSeconds = existingSession.durationSeconds ?? Math.max(0, Math.floor((endedAt.getTime() - existingSession.startedAt.getTime()) / 1000));
      await tx.callSession.update({
        where: { id: existingSession.id },
        data: {
          contactId,
          taskId: taskId || existingSession.taskId || null,
          outcome: normalizedOutcome,
          note: note?.trim() || null,
          endedAt,
          durationSeconds,
          metadata: {
            ...((existingSession.metadata as Record<string, unknown> | null) || {}),
            nextAction: normalizedNextAction || null,
            nextCallAt: nextCallAt || null,
            followUpTaskId: newTask?.id || null,
          },
        },
      });
      finalSessionId = existingSession.id;
    } else {
      const session = await tx.callSession.create({
        data: {
          userId,
          contactId,
          taskId: taskId || null,
          mode: "MANUAL",
          direction: "OUTBOUND",
          ...(scope?.organizationId ? { organizationId: scope.organizationId } : {}),
          outcome: normalizedOutcome,
          note: note?.trim() || null,
          endedAt,
          metadata: {
            nextAction: normalizedNextAction || null,
            nextCallAt: nextCallAt || null,
            followUpTaskId: newTask?.id || null,
          },
        },
        select: { id: true },
      });
      finalSessionId = session.id;
    }

    await tx.contactActivity.create({
      data: {
        contactId,
        type: "CALL_LOGGED",
        ...(scope?.organizationId ? { organizationId: scope.organizationId } : {}),
        metadata: {
          outcome: normalizedOutcome,
          note: note?.trim() || null,
          nextAction: normalizedNextAction || null,
          nextCallAt: nextCallAt || null,
          taskId: taskId || null,
          followUpTaskId: newTask?.id || null,
          sessionId: finalSessionId,
        },
      },
    });

    return { followUpTaskId: newTask?.id || null, sessionId: finalSessionId };
  });
};

export const getCallQueue = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const status = (req.query.status as string | undefined) || "ALL";
    const due = (req.query.due as string | undefined) || "all";
    const search = (req.query.search as string | undefined) || "";
    const listId = (req.query.listId as string | undefined) || "";
    const assignedToId = (req.query.assignedToId as string | undefined) || "";
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;

    const where: any = { ...scope };
    if (["PENDING", "COMPLETED", "SKIPPED"].includes(status)) where.status = status;

    const now = new Date();
    if (due === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      where.dueAt = { gte: start, lte: end };
    } else if (due === "overdue") {
      where.dueAt = { lt: now };
      where.status = "PENDING";
    }

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

    if (listId === "__none") {
      where.contactListId = null;
    } else if (listId) {
      where.contactListId = listId;
    }

    if (assignedToId === "__unassigned") {
      where.assignedToId = null;
    } else if (assignedToId) {
      const resolvedAssigneeId = await resolveAssigneeId(req, assignedToId);
      if (resolvedAssigneeId === undefined) {
        return res.status(400).json({ message: "Invalid assignee" });
      }
      where.assignedToId = resolvedAssigneeId;
    }

    const [tasks, total] = await Promise.all([
      prisma.callTask.findMany({
        where,
        include: {
          assignedTo: { select: ASSIGNEE_SELECT },
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              company: true,
              phone: true,
              stage: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
        skip,
        take: limit,
      }),
      prisma.callTask.count({ where }),
    ]);

    res.json({ tasks, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const createCallTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { contactId, dueAt, priority = 0, contactListId, assignedToId } = req.body as {
      contactId?: string;
      dueAt?: string;
      priority?: number;
      contactListId?: string;
      assignedToId?: string | null;
    };

    if (!contactId || !dueAt) {
      return res.status(400).json({ message: "contactId and dueAt are required" });
    }

    const dueDate = new Date(dueAt);
    if (isNaN(dueDate.getTime())) {
      return res.status(400).json({ message: "Invalid dueAt date" });
    }

    const scope = getOrgScope(req);
    const contact = await prisma.contact.findFirst({ where: { id: contactId, ...scope }, select: { id: true, assignedToId: true } });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    const resolvedAssigneeId = assignedToId === undefined ? contact.assignedToId : await resolveAssigneeId(req, assignedToId);
    if (resolvedAssigneeId === undefined) {
      return res.status(400).json({ message: "Invalid assignee" });
    }

    const task = await prisma.$transaction(async (tx) =>
      createOrUpdatePendingTask(tx, {
        userId,
        contactId,
        dueAt: dueDate,
        priority,
        assignedToId: resolvedAssigneeId,
        contactListId: contactListId || null,
      }, scope),
    );

    const hydratedTask = await prisma.callTask.findUnique({
      where: { id: task.id },
      include: { assignedTo: { select: ASSIGNEE_SELECT } },
    });
    if (!hydratedTask) {
      return res.status(500).json({ message: "Failed to load saved task" });
    }

    await logContactActivity(contactId, "CALL_TASK_CREATED", { dueAt: dueDate.toISOString(), priority });

    res.status(201).json(hydratedTask);
  } catch (error: unknown) {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const updateCallTask = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = String(req.params.id || "");
    const { assignedToId } = req.body as { assignedToId?: string | null };

    const task = await prisma.callTask.findFirst({ where: { id, ...scope }, select: { id: true } });
    if (!task) return res.status(404).json({ message: "Call task not found" });

    const resolvedAssigneeId = await resolveAssigneeId(req, assignedToId);
    if (resolvedAssigneeId === undefined) {
      return res.status(400).json({ message: "Invalid assignee" });
    }

    const updated = await prisma.callTask.update({
      where: { id },
      data: { assignedToId: resolvedAssigneeId },
      include: { assignedTo: { select: ASSIGNEE_SELECT } },
    });

    res.json(updated);
  } catch (error: unknown) {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const logCall = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const {
      contactId,
      outcome,
      note,
      nextAction,
      nextCallAt,
      taskId,
    } = req.body as {
      contactId?: string;
      outcome?: string;
      note?: string;
      nextAction?: string;
      nextCallAt?: string;
      taskId?: string;
    };

    if (!contactId || !outcome) {
      return res.status(400).json({ message: "contactId and outcome are required" });
    }

    const scope = getOrgScope(req);
    const updated = await applyDisposition({ userId, contactId, taskId, outcome, note, nextAction, nextCallAt }, scope);

    res.json({ success: true, ...updated });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message || "Request failed" });
    }
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const submitCallDisposition = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, taskId, contactId, outcome, note, nextAction, nextCallAt } = req.body as {
      sessionId?: string;
      taskId?: string;
      contactId?: string;
      outcome?: string;
      note?: string;
      nextAction?: string;
      nextCallAt?: string;
    };

    if (!contactId || !outcome) {
      return res.status(400).json({ message: "contactId and outcome are required" });
    }

    const scope = getOrgScope(req);
    const updated = await applyDisposition({ userId, contactId, taskId, outcome, note, nextAction, nextCallAt, sessionId }, scope);
    return res.json({ success: true, ...updated });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message || "Request failed" });
    }
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
