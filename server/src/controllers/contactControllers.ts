import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logContactActivity, upsertContact } from "../utils/contactService";
import { getOrgScope, getOrgId } from "../utils/orgScope";
import * as XLSX from "xlsx";
import fs from "fs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE_DEFAULT = 50;

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
        include: { tags: true, lists: true },
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
        include: { tags: true, lists: true },
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
    res.status(500).json({ message: error.message });
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
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
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
    const { email, firstName, lastName, company, phone, jobTitle, stage, tags } = req.body;

    const contact = await upsertContact(userId, email, {
      firstName,
      lastName,
      company,
      phone,
      jobTitle,
      stage,
      tags,
      organizationId: getOrgId(req),
    });

    res.status(201).json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;
    const { firstName, lastName, company, phone, jobTitle, stage, tags } = req.body;

    const oldContact = await prisma.contact.findFirst({ where: { id, ...scope } });
    if (!oldContact) return res.status(404).json({ message: "Contact not found" });

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        firstName,
        lastName,
        company,
        phone,
        jobTitle,
        stage,
        tags: tags ? { set: tags.map((tagId: string) => ({ id: tagId })) } : undefined,
      },
      include: { tags: true },
    });

    if (stage && stage !== oldContact.stage) {
      await logContactActivity(id, "STAGE_CHANGED", { from: oldContact.stage, to: stage });
    }

    res.json(contact);
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
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
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
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
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
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
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
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
      include: { tags: true },
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
        "First Name": contact.firstName || "",
        "Last Name": contact.lastName || "",
        Company: contact.company || "",
        Phone: contact.phone || "",
        "Job Title": contact.jobTitle || "",
        Stage: contact.stage,
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
    res.status(500).json({ message: error.message });
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

    if (!mapping) {
      fs.unlinkSync(file.path);
      return res.json({ headers });
    }

    let fieldMapping: Record<string, string> = {};
    try {
      fieldMapping = typeof mapping === "string" ? JSON.parse(mapping) : mapping;
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

        if (!contactData.email) {
          errors.push({ row, error: "Missing email field" });
          continue;
        }

        const contact = await upsertContact(userId, contactData.email, {
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          company: contactData.company,
          phone: contactData.phone,
          jobTitle: contactData.jobTitle,
          stage: contactData.stage || "COLD",
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
    res.status(500).json({ message: error.message });
  }
};
