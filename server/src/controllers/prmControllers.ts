import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logContactActivity } from "../utils/contactService";
import { getOrgScope, orgCreateData } from "../utils/orgScope";
import type { OrgScope } from "../utils/orgScope";

type SegmentCondition = {
  field: "tags" | "stage" | "lastActivity" | "campaignStatus" | "replyState" | "openState";
  operator: "equals" | "notEquals" | "contains" | "inLastDays" | "is";
  value: string | string[] | number | boolean;
};

type SegmentExpression = {
  op: "AND" | "OR";
  conditions: SegmentCondition[];
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STAGES = new Set(["NEW", "CONTACTED", "REPLIED", "INTERESTED", "MEETING_BOOKED", "CONVERTED", "NOT_A_FIT", "BOUNCED", "COLD", "WARM", "HOT"]);

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const UNDO_WINDOW_MS = 10 * 60 * 1000;

async function computeQualitySummary(scope: OrgScope) {
  const contacts = await prisma.contact.findMany({
    where: { ...scope },
    include: { tags: true },
  });

  const byEmail = new Map<string, number>();
  let invalidEmails = 0;
  let missingRequiredFields = 0;

  for (const contact of contacts) {
    const normalized = normalizeEmail(contact.email || "");
    byEmail.set(normalized, (byEmail.get(normalized) || 0) + 1);
    if (!emailRegex.test(normalized)) invalidEmails += 1;
    if (!contact.firstName || !contact.lastName) missingRequiredFields += 1;
  }

  const duplicateContacts = Array.from(byEmail.values())
    .filter((count) => count > 1)
    .reduce((acc, count) => acc + count, 0);

  return {
    totalContacts: contacts.length,
    duplicateContacts,
    missingRequiredFields,
    invalidEmails,
    launchBlocked: invalidEmails,
  };
}

async function evaluateSegment(scope: OrgScope, expression: SegmentExpression) {
  const contacts = await prisma.contact.findMany({
    where: { ...scope },
    include: { tags: true, activities: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const jobs = await prisma.emailJob.findMany({
    where: { campaign: { ...scope }, toEmail: { in: contacts.map((c) => c.email) } },
    select: {
      toEmail: true,
      status: true,
      isReplied: true,
      trackingEvents: { select: { eventType: true } },
    },
  });

  const jobMap = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const key = normalizeEmail(job.toEmail);
    const arr = jobMap.get(key) || [];
    arr.push(job);
    jobMap.set(key, arr);
  }

  const testCondition = (contact: (typeof contacts)[number], condition: SegmentCondition) => {
    const cj = jobMap.get(normalizeEmail(contact.email)) || [];
    const lastActivityAt = contact.activities[0]?.createdAt;
    switch (condition.field) {
      case "tags": {
        const tagNames = contact.tags.map((t) => t.name.toLowerCase());
        const value = Array.isArray(condition.value)
          ? condition.value.map((v) => String(v).toLowerCase())
          : [String(condition.value).toLowerCase()];
        return value.some((v) => tagNames.includes(v));
      }
      case "stage":
        return condition.operator === "notEquals"
          ? contact.stage !== condition.value
          : contact.stage === condition.value;
      case "lastActivity":
        if (!lastActivityAt || condition.operator !== "inLastDays") return false;
        return Date.now() - new Date(lastActivityAt).getTime() <= Number(condition.value) * 24 * 60 * 60 * 1000;
      case "campaignStatus": {
        const statuses = new Set(cj.map((j) => j.status));
        return statuses.has(String(condition.value) as any);
      }
      case "replyState": {
        const hasReply = cj.some((j) => j.isReplied);
        return Boolean(condition.value) ? hasReply : !hasReply;
      }
      case "openState": {
        const hasOpen = cj.some((j) => j.trackingEvents.some((e) => e.eventType === "OPEN"));
        return Boolean(condition.value) ? hasOpen : !hasOpen;
      }
      default:
        return false;
    }
  };

  const filtered = contacts.filter((contact) => {
    if (!expression.conditions?.length) return true;
    const checks = expression.conditions.map((condition) => testCondition(contact, condition));
    return expression.op === "OR" ? checks.some(Boolean) : checks.every(Boolean);
  });

  return filtered;
}

export const getPrmQualitySummary = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const summary = await computeQualitySummary(scope);
    return res.json(summary);
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const dedupePrmContacts = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { mode = "dry-run" } = req.body as { mode?: "dry-run" | "apply" };
    const contacts = await prisma.contact.findMany({
      where: { ...scope },
      orderBy: { createdAt: "asc" },
    });

    const keep = new Set<string>();
    const remove: string[] = [];
    const byEmail = new Map<string, string>();
    const removeByKeep = new Map<string, string[]>();
    for (const c of contacts) {
      const key = normalizeEmail(c.email);
      if (!byEmail.has(key)) {
        byEmail.set(key, c.id);
        keep.add(c.id);
      } else {
        const keepId = byEmail.get(key)!;
        remove.push(c.id);
        const list = removeByKeep.get(keepId) || [];
        list.push(c.id);
        removeByKeep.set(keepId, list);
      }
    }

    if (mode === "apply" && remove.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const [keepId, duplicateIds] of removeByKeep.entries()) {
          const [keptContact, duplicateContacts, duplicateMemberships] = await Promise.all([
            tx.contact.findFirst({
              where: { id: keepId, ...scope },
              include: { tags: true, lists: true },
            }),
            tx.contact.findMany({
              where: { ...scope, id: { in: duplicateIds } },
              include: { tags: true, lists: true },
            }),
            tx.prmSegmentContact.findMany({
              where: { contactId: { in: duplicateIds } },
              select: { segmentId: true },
            }),
          ]);

          if (!keptContact || duplicateContacts.length === 0) continue;

          const tagIds = new Set(keptContact.tags.map((t) => t.id));
          const listIds = new Set(keptContact.lists.map((l) => l.id));
          for (const dup of duplicateContacts) {
            for (const t of dup.tags) tagIds.add(t.id);
            for (const l of dup.lists) listIds.add(l.id);
          }

          await tx.contact.update({
            where: { id: keepId },
            data: {
              firstName: keptContact.firstName || duplicateContacts.find((d) => d.firstName)?.firstName || null,
              lastName: keptContact.lastName || duplicateContacts.find((d) => d.lastName)?.lastName || null,
              company: keptContact.company || duplicateContacts.find((d) => d.company)?.company || null,
              phone: keptContact.phone || duplicateContacts.find((d) => d.phone)?.phone || null,
              jobTitle: keptContact.jobTitle || duplicateContacts.find((d) => d.jobTitle)?.jobTitle || null,
              tags: { set: Array.from(tagIds).map((id) => ({ id })) },
              lists: { set: Array.from(listIds).map((id) => ({ id })) },
            },
          });

          await tx.callTask.updateMany({ where: { contactId: { in: duplicateIds } }, data: { contactId: keepId } });
          await tx.callSession.updateMany({ where: { contactId: { in: duplicateIds } }, data: { contactId: keepId } });
          await tx.note.updateMany({ where: { contactId: { in: duplicateIds } }, data: { contactId: keepId } });
          await tx.contactActivity.updateMany({ where: { contactId: { in: duplicateIds } }, data: { contactId: keepId } });

          await tx.prmSegmentContact.deleteMany({ where: { contactId: { in: duplicateIds } } });
          if (duplicateMemberships.length > 0) {
            await tx.prmSegmentContact.createMany({
              data: duplicateMemberships.map((m) => ({ segmentId: m.segmentId, contactId: keepId })),
              skipDuplicates: true,
            });
          }
        }

        await tx.contact.deleteMany({ where: { ...scope, id: { in: remove } } });
      });
    }

    return res.json({
      mode,
      total: contacts.length,
      duplicatesFound: remove.length,
      deletedCount: mode === "apply" ? remove.length : 0,
      keptCount: keep.size,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const createPrmSegment = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { name, expression, isAdhoc = false } = req.body as { name: string; expression: SegmentExpression; isAdhoc?: boolean };
    const normalizedName = (name || "").trim();
    if (!normalizedName || !expression || !Array.isArray(expression.conditions)) {
      return res.status(400).json({ message: "name and expression.conditions are required" });
    }

    const matched = await evaluateSegment(scope, expression);
    const segment = await (prisma as any).prmSegment.create({
      data: orgCreateData(req, {
        userId: req.user!.id,
        name: normalizedName,
        expression: expression as any,
        isAdhoc,
        contacts: {
          create: matched.map((c) => ({ contactId: c.id })),
        },
      }),
      include: {
        contacts: { select: { contactId: true } },
      },
    });

    return res.status(201).json({
      ...segment,
      previewCount: segment.contacts.length,
    });
  } catch (error: any) {
    if (error.code === "P2002") return res.status(400).json({ message: "Segment name already exists" });
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const listPrmSegments = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const segments = await (prisma as any).prmSegment.findMany({
      where: { ...scope },
      include: { contacts: { select: { contactId: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(segments.map((s: any) => ({ ...s, previewCount: s.contacts.length })));
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const updatePrmSegment = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;
    const { name, expression } = req.body as { name?: string; expression?: SegmentExpression };

    const existing = await (prisma as any).prmSegment.findFirst({ where: { id, ...scope } });
    if (!existing) return res.status(404).json({ message: "Segment not found" });

    const normalizedName = typeof name === "string" ? name.trim() : undefined;
    const expr = expression || (existing.expression as SegmentExpression);
    if (!Array.isArray(expr.conditions)) {
      return res.status(400).json({ message: "expression.conditions must be an array" });
    }
    const matched = await evaluateSegment(scope, expr);

    const updated = await (prisma as any).prmSegment.update({
      where: { id },
      data: {
        ...(normalizedName ? { name: normalizedName } : {}),
        ...(expression ? { expression: expression as any } : {}),
        contacts: {
          deleteMany: {},
          create: matched.map((c) => ({ contactId: c.id })),
        },
      },
      include: { contacts: { select: { contactId: true } } },
    });

    return res.json({ ...updated, previewCount: updated.contacts.length });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const previewPrmSegment = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { expression } = req.body as { expression: SegmentExpression };
    if (!expression) return res.status(400).json({ message: "expression is required" });
    const matched = await evaluateSegment(scope, expression);
    return res.json({ previewCount: matched.length, ids: matched.map((c) => c.id) });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const executePrmBulkAction = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const userId = (req as any).user.id as string;
    const { actionType, contactIds, stage, tagId, listId } = req.body as any;
    if (!actionType || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ message: "actionType and contactIds are required" });
    }

    const contacts = await prisma.contact.findMany({
      where: { ...scope, id: { in: contactIds } },
      include: { tags: true, lists: true },
    });
    const ids = contacts.map((c) => c.id);
    if (ids.length === 0) {
      return res.status(404).json({ message: "No valid contacts found for bulk action" });
    }
    const undoToken = `undo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    let affectedCount = 0;

    if (actionType === "add_to_list" && listId) {
      const ownsList = await prisma.contactList.findFirst({ where: { id: listId, ...scope } });
      if (!ownsList) return res.status(404).json({ message: "List not found" });
    }

    if ((actionType === "add_tag" || actionType === "remove_tag") && tagId) {
      const ownsTag = await prisma.tag.findFirst({ where: { id: tagId, ...scope }, select: { id: true } });
      if (!ownsTag) return res.status(404).json({ message: "Tag not found" });
    }

    if (
      !["update_stage", "add_tag", "remove_tag", "add_to_list"].includes(actionType) ||
      (actionType === "update_stage" && !stage) ||
      ((actionType === "add_tag" || actionType === "remove_tag") && !tagId) ||
      (actionType === "add_to_list" && !listId)
    ) {
      return res.status(400).json({ message: "Unsupported action" });
    }
    if (actionType === "update_stage" && !ALLOWED_STAGES.has(String(stage).toUpperCase())) {
      return res.status(400).json({ message: "Invalid stage value" });
    }

    await prisma.$transaction(async (tx) => {
      if (actionType === "update_stage") {
        await tx.contact.updateMany({ where: { id: { in: ids }, ...scope }, data: { stage } });
        affectedCount = ids.length;
      } else if (actionType === "add_tag" && tagId) {
        await Promise.all(ids.map((id) => tx.contact.update({ where: { id }, data: { tags: { connect: { id: tagId } } } })));
        affectedCount = ids.length;
      } else if (actionType === "remove_tag" && tagId) {
        await Promise.all(ids.map((id) => tx.contact.update({ where: { id }, data: { tags: { disconnect: { id: tagId } } } })));
        affectedCount = ids.length;
      } else if (actionType === "add_to_list" && listId) {
        await tx.contactList.update({
          where: { id: listId },
          data: { contacts: { connect: ids.map((id) => ({ id })) } },
        });
        affectedCount = ids.length;
      }

      await (tx as any).prmBulkActionLog.create({
        data: {
          userId: req.user!.id,
          actionType,
          affectedCount,
          undoToken,
          payload: {
            contactIds: ids,
            prev: contacts.map((c) => ({
              id: c.id,
              stage: c.stage,
              tags: c.tags.map((t) => t.id),
              lists: c.lists.map((l) => l.id),
            })),
            next: { stage, tagId, listId },
          } as any,
        },
      });
    });

    if (actionType === "update_stage") {
      await Promise.all(
        contacts.map((c) => logContactActivity(c.id, "STAGE_CHANGED", { from: c.stage, to: stage })),
      );
    }

    return res.json({
      actionType,
      affectedCount,
      undoToken,
      audit: { actor: userId, actionType, affectedCount, timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const undoPrmBulkAction = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const undoToken = req.params.undoToken as string;
    const log = await (prisma as any).prmBulkActionLog.findFirst({
      where: { userId: req.user!.id, undoToken },
    });
    if (!log || log.undoneAt) return res.status(404).json({ message: "Undo token not found or expired" });
    if (Date.now() - new Date(log.createdAt).getTime() > UNDO_WINDOW_MS) {
      return res.status(410).json({ message: "Undo window expired" });
    }
    const payload = log.payload as any;
    const previous = Array.isArray(payload?.prev) ? payload.prev : [];

    await prisma.$transaction(async (tx) => {
      for (const prev of previous) {
        const ownedContact = await tx.contact.findFirst({
          where: { id: prev.id, ...scope },
          select: { id: true },
        });
        if (!ownedContact) continue;

        await tx.contact.update({
          where: { id: ownedContact.id },
          data: {
            stage: prev.stage,
            tags: { set: (prev.tags || []).map((id: string) => ({ id })) },
            lists: { set: (prev.lists || []).map((id: string) => ({ id })) },
          },
        });
      }
      await (tx as any).prmBulkActionLog.update({
        where: { id: log.id },
        data: { undoneAt: new Date() },
      });
    });

    return res.json({ message: "Bulk action rolled back", affectedCount: previous.length });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};

export const getPrmLaunchGuardrails = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { segmentId, subject = "", body = "" } = req.query as any;
    let contacts: { id: string; email: string }[] = [];
    if (segmentId) {
      const segment = await (prisma as any).prmSegment.findFirst({
        where: { id: String(segmentId), ...scope },
        include: { contacts: { include: { contact: true } } },
      });
      contacts = (segment?.contacts || []).map((c: any) => ({ id: c.contact.id, email: c.contact.email }));
    }

    const invalidContacts = contacts.filter((c) => !emailRegex.test(normalizeEmail(c.email))).length;
    const unverifiedSenders = await prisma.sender.count({ where: { ...scope, isVerified: false } });
    const emptySubject = !String(subject).trim();
    const emptyBody = !String(body).trim();

    return res.json({
      invalidContacts,
      unverifiedSenderWarning: unverifiedSenders > 0,
      emptySubjectWarning: emptySubject,
      emptyBodyWarning: emptyBody,
      recipientCount: contacts.length,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: "Failed to process request" });
  }
};
