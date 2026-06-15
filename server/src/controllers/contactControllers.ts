import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logContactActivity, upsertContact } from "../utils/contactService";
import { getOrgScope, getOrgId } from "../utils/orgScope";
import { normalizeDomain, normalizeEmailAddress, normalizeWebsite } from "../utils/contactEnrichment";
import * as XLSX from "xlsx";
import fs from "fs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE_DEFAULT = 50;
const CONTACT_INCLUDE = {
  tags: true,
  lists: true,
  assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

const parseOptionalDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeOptionalText = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const normalizeTechStack = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 20);
};

async function resolveContactInputForSave(input: {
  email?: unknown;
  website?: unknown;
  companyDomain?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  company?: unknown;
  phone?: unknown;
  jobTitle?: unknown;
  stage?: unknown;
  nextAction?: unknown;
  nextActionDueAt?: unknown;
  assignedToId?: string | null | undefined;
  tags?: string[];
  techStack?: unknown;
}): Promise<{
  email: string | null;
  website: string | null;
  companyDomain: string | null;
  company: string | null;
  phone: string | null;
  techStack: string[];
  lastEnrichedAt: Date | null;
  enrichmentSources: {
    website: "direct" | "enriched" | "none";
    companyDomain: "direct" | "enriched" | "none";
    company: "direct" | "enriched" | "none";
    phone: "direct" | "enriched" | "none";
    techStack: "direct" | "enriched" | "none";
  };
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  stage?: string;
  nextAction?: string | null;
  nextActionDueAt?: Date | null | undefined;
  assignedToId?: string | null;
  tags?: string[];
}> {
  const directEmail = normalizeEmailAddress(input.email);
  const directWebsite = normalizeWebsite(input.website);
  const directDomain = normalizeDomain(input.companyDomain)
    ?? (directWebsite ? new URL(directWebsite).hostname.replace(/^www\./, "") : null)
    ?? (directEmail ? directEmail.split("@")[1] ?? null : null);

  return {
    email: directEmail,
    website: directWebsite,
    companyDomain: directDomain,
    company: normalizeOptionalText(input.company) ?? null,
    phone: normalizeOptionalText(input.phone) ?? null,
    techStack: normalizeTechStack(input.techStack) ?? [],
    lastEnrichedAt: null,
    enrichmentSources: {
      website: directWebsite ? "direct" : "none",
      companyDomain: directDomain ? "direct" : "none",
      company: normalizeOptionalText(input.company) ? "direct" : "none",
      phone: normalizeOptionalText(input.phone) ? "direct" : "none",
      techStack: normalizeTechStack(input.techStack)?.length ? "direct" : "none",
    },
    firstName: normalizeOptionalText(input.firstName) ?? undefined,
    lastName: normalizeOptionalText(input.lastName) ?? undefined,
    jobTitle: normalizeOptionalText(input.jobTitle) ?? undefined,
    stage: normalizeOptionalText(input.stage) ?? undefined,
    nextAction: normalizeOptionalText(input.nextAction),
    nextActionDueAt: parseOptionalDate(input.nextActionDueAt),
    assignedToId: input.assignedToId,
    tags: input.tags,
  };
}

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

export const getContacts = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { search, stage, tag, listId, segmentId, invalidOnly, page: pageStr, limit: limitStr } = req.query;

    const page = Math.max(1, parseInt(pageStr as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(limitStr as string) || PAGE_SIZE_DEFAULT));
    const skip = (page - 1) * limit;

    const where: any = { ...scope };

    if (search) {
      const s = search as string;
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { website: { contains: s, mode: "insensitive" } },
        { companyDomain: { contains: s, mode: "insensitive" } },
        { techStack: { has: s } },
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { company: { contains: s, mode: "insensitive" } },
        { jobTitle: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
      ];
    }

    if (stage) where.stage = stage as string;
    if (tag) where.tags = { some: { id: tag as string } };
    if (listId) where.lists = { some: { id: listId as string } };
    if (segmentId) where.segmentMemberships = { some: { segmentId: segmentId as string } };

    if (invalidOnly === "true") {
      const allIds = await prisma.contact.findMany({ where, select: { id: true, email: true } });
      const filteredIds = allIds.filter((c) => !EMAIL_REGEX.test(c.email.trim().toLowerCase())).map((c) => c.id);
      const total = filteredIds.length;
      const pageIds = filteredIds.slice(skip, skip + limit);

      const contacts = await prisma.contact.findMany({
        where: { id: { in: pageIds }, ...scope },
        include: CONTACT_INCLUDE,
        orderBy: { updatedAt: "desc" },
      });

      const idOrder = new Map(pageIds.map((id, i) => [id, i]));
      contacts.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

      const contactEmails = contacts.map((c) => c.email);
      const jobs = await prisma.emailJob.findMany({
        where: { toEmail: { in: contactEmails }, campaign: { ...scope } },
        select: { toEmail: true, sentAt: true, status: true, isReplied: true, trackingEvents: { select: { eventType: true } } },
      });

      const jobsByEmail: Record<string, typeof jobs> = {};
      jobs.forEach((job) => {
        if (!jobsByEmail[job.toEmail]) jobsByEmail[job.toEmail] = [];
        jobsByEmail[job.toEmail].push(job);
      });

      const enriched = contacts.map((contact) => {
        const contactJobs = jobsByEmail[contact.email] || [];
        const sent = contactJobs.filter((j) => j.status === "SENT").length;
        const opened = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "OPEN")).length;
        const clicked = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "CLICK")).length;
        const replied = contactJobs.filter((j) => j.isReplied).length;
        const sentDates = contactJobs.filter((j) => j.sentAt).map((j) => j.sentAt!);
        const lastContactedAt = sentDates.length > 0 ? new Date(Math.max(...sentDates.map((d) => d.getTime()))).toISOString() : null;

        return {
          ...contact,
          engagementScore: sent * 20 + opened * 40 + clicked * 60 + replied * 100,
          lastContactedAt,
          _count: { emailsSent: sent, emailsOpened: opened, emailsClicked: clicked, emailsReplied: replied },
        };
      });

      return res.json({ contacts: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    const [total, rawContacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        include: CONTACT_INCLUDE,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const contactEmails = rawContacts.map((c) => c.email);
    const jobs = await prisma.emailJob.findMany({
      where: { toEmail: { in: contactEmails }, campaign: { ...scope } },
      select: { toEmail: true, sentAt: true, status: true, isReplied: true, trackingEvents: { select: { eventType: true } } },
    });

    const jobsByEmail: Record<string, typeof jobs> = {};
    jobs.forEach((job) => {
      if (!jobsByEmail[job.toEmail]) jobsByEmail[job.toEmail] = [];
      jobsByEmail[job.toEmail].push(job);
    });

    const enriched = rawContacts.map((contact) => {
      const contactJobs = jobsByEmail[contact.email] || [];
      const sent = contactJobs.filter((j) => j.status === "SENT").length;
      const opened = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "OPEN")).length;
      const clicked = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "CLICK")).length;
      const replied = contactJobs.filter((j) => j.isReplied).length;
      const sentDates = contactJobs.filter((j) => j.sentAt).map((j) => j.sentAt!);
      const lastContactedAt = sentDates.length > 0 ? new Date(Math.max(...sentDates.map((d) => d.getTime()))).toISOString() : null;

      return {
        ...contact,
        engagementScore: sent * 20 + opened * 40 + clicked * 60 + replied * 100,
        lastContactedAt,
        _count: { emailsSent: sent, emailsOpened: opened, emailsClicked: clicked, emailsReplied: replied },
      };
    });

    res.json({ contacts: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "An internal server error occurred" });
  }
};

export const getContactById = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;

    const contact = await prisma.contact.findFirst({
      where: { id, ...scope },
      include: {
        tags: true,
        lists: true,
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        notes: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const jobs = await prisma.emailJob.findMany({
      where: { toEmail: contact.email, campaign: { ...scope } },
      select: { sentAt: true, status: true, isReplied: true, trackingEvents: { select: { eventType: true } } },
    });

    const sent = jobs.filter((j) => j.status === "SENT").length;
    const opened = jobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "OPEN")).length;
    const clicked = jobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "CLICK")).length;
    const replied = jobs.filter((j) => j.isReplied).length;
    const sentDates = jobs.filter((j) => j.sentAt).map((j) => j.sentAt!);
    const lastContactedAt = sentDates.length > 0 ? new Date(Math.max(...sentDates.map((d) => d.getTime()))).toISOString() : null;

    res.json({
      ...contact,
      engagementScore: sent * 20 + opened * 40 + clicked * 60 + replied * 100,
      lastContactedAt,
      _count: { emailsSent: sent, emailsOpened: opened, emailsClicked: clicked, emailsReplied: replied },
    });
  } catch {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requirePremium } = await import("../utils/premiumCheck");
    const globalCheck = await requirePremium(userId);
    if (!globalCheck.allowed) {
      return res.status(403).json({
        message: globalCheck.message,
        upgradeRequired: true,
      });
    }
    const { email, website, companyDomain, firstName, lastName, company, phone, jobTitle, stage, tags, nextAction, nextActionDueAt, assignedToId } = req.body;
    const resolvedAssigneeId = await resolveAssigneeId(req, assignedToId);
    const prepared = await resolveContactInputForSave({
      email,
      website,
      companyDomain,
      firstName,
      lastName,
      company,
      phone,
      jobTitle,
      stage,
      tags,
      nextAction,
      nextActionDueAt,
      assignedToId: resolvedAssigneeId,
    });

    if (!prepared.email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const contact = await upsertContact(userId, prepared.email, {
      website: prepared.website,
      companyDomain: prepared.companyDomain,
      firstName: prepared.firstName,
      lastName: prepared.lastName,
      company: prepared.company,
      phone: prepared.phone,
      jobTitle: prepared.jobTitle,
      techStack: prepared.techStack,
      enrichmentSources: prepared.enrichmentSources,
      stage: prepared.stage,
      nextAction: prepared.nextAction,
      nextActionDueAt: prepared.nextActionDueAt,
      assignedToId: prepared.assignedToId,
      lastEnrichedAt: prepared.lastEnrichedAt,
      tags: prepared.tags,
      organizationId: getOrgId(req),
    });

    res.status(201).json(contact);
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "An internal server error occurred" });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;
    const { firstName, lastName, company, phone, jobTitle, stage, tags, nextAction, nextActionDueAt, assignedToId, website, companyDomain } = req.body;
    const resolvedAssigneeId = await resolveAssigneeId(req, assignedToId);

    const oldContact = await prisma.contact.findFirst({ where: { id, ...scope } });
    if (!oldContact) return res.status(404).json({ message: "Contact not found" });

    const prepared = await resolveContactInputForSave({
      email: oldContact.email,
      website,
      companyDomain,
      firstName,
      lastName,
      company,
      phone,
      jobTitle,
      stage,
      tags,
      nextAction,
      nextActionDueAt,
      assignedToId: resolvedAssigneeId,
    });

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        website: prepared.website,
        companyDomain: prepared.companyDomain,
        firstName: prepared.firstName,
        lastName: prepared.lastName,
        company: prepared.company,
        phone: prepared.phone,
        jobTitle: prepared.jobTitle,
        techStack: prepared.techStack,
        stage: prepared.stage,
        nextAction: prepared.nextAction,
        nextActionDueAt: prepared.nextActionDueAt,
        assignedToId: prepared.assignedToId,
        lastEnrichedAt: prepared.lastEnrichedAt,
        tags: tags ? { set: tags.map((tagId: string) => ({ id: tagId })) } : undefined,
      },
      include: CONTACT_INCLUDE,
    });

    if (stage && stage !== oldContact.stage) {
      await logContactActivity(id, "STAGE_CHANGED", { from: oldContact.stage, to: stage });
    }
    if (prepared.nextAction !== undefined && prepared.nextAction !== oldContact.nextAction) {
      await logContactActivity(id, "NEXT_ACTION_CHANGED", { from: oldContact.nextAction, to: prepared.nextAction });
    }
    if (resolvedAssigneeId !== undefined && resolvedAssigneeId !== oldContact.assignedToId) {
      await logContactActivity(id, "ASSIGNEE_CHANGED", { from: oldContact.assignedToId, to: resolvedAssigneeId });
    }

    res.json(contact);
  } catch (error: unknown) {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;

    const result = await prisma.contact.deleteMany({ where: { id, ...scope } });

    if (result.count === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error: unknown) {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const bulkUpdateContacts = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const { stage, tags } = data;

    const validContacts = await prisma.contact.findMany({
      where: { id: { in: ids }, ...scope },
      select: { id: true, stage: true },
    });

    const validIds = validContacts.map((c) => c.id);

    if (validIds.length === 0) {
      return res.status(404).json({ message: "No valid contacts found to update" });
    }

    if (stage) {
      await prisma.contact.updateMany({
        where: { id: { in: validIds }, ...scope },
        data: { stage },
      });
    }

    if (tags && Array.isArray(tags)) {
      for (const id of validIds) {
        await prisma.contact.update({
          where: { id },
          data: { tags: { set: tags.map((tagId: string) => ({ id: tagId })) } },
        });
      }
    }

    if (stage) {
      for (const contact of validContacts) {
        if (contact.stage !== stage) {
          await logContactActivity(contact.id, "STAGE_CHANGED", { from: contact.stage, to: stage });
        }
      }
    }

    res.json({ message: `${validIds.length} contacts updated` });
  } catch (error: unknown) {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const bulkDeleteContacts = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const result = await prisma.contact.deleteMany({ where: { id: { in: ids }, ...scope } });

    res.json({ message: `${result.count} contacts deleted` });
  } catch (error: unknown) {
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const exportContacts = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { search, stage, tag, listId, segmentId } = req.query;

    const where: any = { ...scope };

    if (search) {
      const s = search as string;
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { website: { contains: s, mode: "insensitive" } },
        { companyDomain: { contains: s, mode: "insensitive" } },
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { company: { contains: s, mode: "insensitive" } },
        { jobTitle: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
      ];
    }

    if (stage) where.stage = stage as string;
    if (tag) where.tags = { some: { id: tag as string } };
    if (listId) where.lists = { some: { id: listId as string } };
    if (segmentId) where.segmentMemberships = { some: { segmentId: segmentId as string } };

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        tags: true,
        assignedTo: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const contactEmails = contacts.map((c) => c.email);
    const jobs = await prisma.emailJob.findMany({
      where: { toEmail: { in: contactEmails }, campaign: { ...scope } },
      select: { toEmail: true, sentAt: true, status: true, isReplied: true, trackingEvents: { select: { eventType: true } } },
    });

    const jobsByEmail: Record<string, typeof jobs> = {};
    jobs.forEach((job) => {
      if (!jobsByEmail[job.toEmail]) jobsByEmail[job.toEmail] = [];
      jobsByEmail[job.toEmail].push(job);
    });

    const rows = contacts.map((contact) => {
      const contactJobs = jobsByEmail[contact.email] || [];
      const sent = contactJobs.filter((j) => j.status === "SENT").length;
      const opened = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "OPEN")).length;
      const clicked = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "CLICK")).length;
      const replied = contactJobs.filter((j) => j.isReplied).length;
      const sentDates = contactJobs.filter((j) => j.sentAt).map((j) => j.sentAt!);
      const lastContactedAt = sentDates.length > 0 ? new Date(Math.max(...sentDates.map((d) => d.getTime()))).toISOString() : "";

        return {
          Email: contact.email,
          Website: contact.website || "",
          "Company Domain": contact.companyDomain || "",
          "First Name": contact.firstName || "",
          "Last Name": contact.lastName || "",
          Company: contact.company || "",
          Phone: contact.phone || "",
          "Job Title": contact.jobTitle || "",
          "Tech Stack": contact.techStack.join("; "),
          "Relationship Stage": contact.stage,
        "Next Action": contact.nextAction || "",
        "Next Action Due": contact.nextActionDueAt ? contact.nextActionDueAt.toISOString() : "",
        Assignee: contact.assignedTo?.name || contact.assignedTo?.email || "",
        Tags: contact.tags.map((t) => t.name).join("; "),
        "Emails Sent": sent,
        "Emails Opened": opened,
        "Emails Clicked": clicked,
        "Emails Replied": replied,
        "Last Contacted": lastContactedAt,
        "Engagement Score": sent * 20 + opened * 40 + clicked * 60 + replied * 100,
        Created: contact.createdAt.toISOString(),
        Updated: contact.updatedAt.toISOString(),
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    const csv = XLSX.utils.sheet_to_csv(ws);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="contacts-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "An internal server error occurred" });
  }
};

export const importContacts = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const userId = (req as any).user.id;
    const { requirePremium } = await import("../utils/premiumCheck");
    const globalCheck = await requirePremium(userId);
    if (!globalCheck.allowed) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        message: globalCheck.message,
        upgradeRequired: true,
      });
    }
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { mapping } = req.body;

    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];

    if (!mapping || (typeof mapping === "string" && mapping.trim() === "{}")) {
      fs.unlinkSync(file.path);
      return res.json({ headers });
    }

    let fieldMapping: Record<string, string> = {};
    try {
      fieldMapping = typeof mapping === "string" ? JSON.parse(mapping) : mapping;
      if (!fieldMapping || Object.keys(fieldMapping).length === 0) {
        fs.unlinkSync(file.path);
        return res.json({ headers });
      }
    } catch (e) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Invalid field mapping" });
    }

    const results = [];
    const errors = [];

    for (const row of data as any[]) {
      try {
        const contactData: any = {};

        for (const [systemField, fileField] of Object.entries(fieldMapping)) {
          if (fileField && row[fileField] !== undefined) {
            contactData[systemField] = String(row[fileField]).trim();
          }
        }

        const prepared = await resolveContactInputForSave({
          email: contactData.email,
          website: contactData.website,
          companyDomain: contactData.companyDomain,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          company: contactData.company,
          phone: contactData.phone,
          jobTitle: contactData.jobTitle,
          stage: contactData.stage || "COLD",
          nextAction: contactData.nextAction,
          nextActionDueAt: contactData.nextActionDueAt,
        });

        if (!prepared.email) {
          errors.push({ row, error: "Missing email field" });
          continue;
        }

        const contact = await upsertContact(userId, prepared.email, {
          website: prepared.website,
          companyDomain: prepared.companyDomain,
          firstName: prepared.firstName,
          lastName: prepared.lastName,
          company: prepared.company,
          phone: prepared.phone,
          jobTitle: prepared.jobTitle,
          techStack: prepared.techStack,
          enrichmentSources: prepared.enrichmentSources,
          stage: prepared.stage || "COLD",
          nextAction: prepared.nextAction,
          nextActionDueAt: prepared.nextActionDueAt,
          lastEnrichedAt: prepared.lastEnrichedAt,
          organizationId: getOrgId(req),
        });

        results.push(contact);
      } catch (err: any) {
        errors.push({ row, error: err.message });
      }
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const allContacts = await prisma.contact.findMany({
      where: { ...scope },
      select: { email: true, firstName: true, lastName: true },
    });
    const normalized = new Map<string, number>();
    let invalidEmails = 0;
    let missingRequiredFields = 0;
    for (const c of allContacts) {
      const key = c.email.trim().toLowerCase();
      normalized.set(key, (normalized.get(key) || 0) + 1);
      if (!EMAIL_REGEX.test(key)) invalidEmails += 1;
      if (!c.firstName || !c.lastName) missingRequiredFields += 1;
    }
    const duplicateContacts = Array.from(normalized.values())
      .filter((count) => count > 1)
      .reduce((acc, count) => acc + count, 0);

    res.json({
      message: `Import completed: ${results.length} contacts imported, ${errors.length} errors.`,
      count: results.length,
      errors: errors.length > 0 ? errors : undefined,
      qualitySummary: {
        duplicateContacts,
        invalidEmails,
        missingRequiredFields,
      },
      fixNowLinks: {
        qualityCenter: "/dashboard/prm?panel=quality",
      },
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ status: "error", message: "An internal server error occurred" });
  }
};
