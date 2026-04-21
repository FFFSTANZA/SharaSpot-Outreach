import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logContactActivity, upsertContact } from "../utils/contactService";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import fs from "fs";

export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { search, stage, tag, listId } = req.query;

    const where: Prisma.ContactWhereInput = { userId };

    if (search) {
      const s = search as string;
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { company: { contains: s, mode: "insensitive" } },
        { jobTitle: { contains: s, mode: "insensitive" } },
      ];
    }

    if (stage) where.stage = stage as string;
    if (tag) where.tags = { some: { id: tag as string } };
    if (listId) where.lists = { some: { id: listId as string } };

    const contacts = await prisma.contact.findMany({
      where,
      include: { tags: true, lists: true },
      orderBy: { updatedAt: "desc" },
    });

    const contactEmails = contacts.map((c) => c.email);
    const jobs = await prisma.emailJob.findMany({
      where: { toEmail: { in: contactEmails }, campaign: { userId } },
      select: { toEmail: true, status: true, isReplied: true, trackingEvents: { select: { eventType: true } } },
    });

    const jobsByEmail: Record<string, typeof jobs> = {};
    jobs.forEach((job) => {
      if (!jobsByEmail[job.toEmail]) jobsByEmail[job.toEmail] = [];
      jobsByEmail[job.toEmail].push(job);
    });

    const contactsWithStats = contacts.map((contact) => {
      const contactJobs = jobsByEmail[contact.email] || [];
      const sent = contactJobs.filter((j) => j.status === "SENT").length;
      const opened = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "OPEN")).length;
      const clicked = contactJobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "CLICK")).length;
      const replied = contactJobs.filter((j) => j.isReplied).length;
      const engagementScore = sent * 20 + opened * 40 + clicked * 60 + replied * 100;

      return {
        ...contact,
        engagementScore,
        _count: {
          emailsSent: sent,
          emailsOpened: opened,
          emailsClicked: clicked,
          emailsReplied: replied,
        },
      };
    });

    res.json(contactsWithStats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getContactById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const contact = await prisma.contact.findFirst({
      where: { id, userId },
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
      where: { toEmail: contact.email, campaign: { userId } },
      select: { status: true, isReplied: true, trackingEvents: { select: { eventType: true } } },
    });

    const sent = jobs.filter((j) => j.status === "SENT").length;
    const opened = jobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "OPEN")).length;
    const clicked = jobs.filter((j) => j.trackingEvents.some((e) => e.eventType === "CLICK")).length;
    const replied = jobs.filter((j) => j.isReplied).length;
    const engagementScore = sent * 20 + opened * 40 + clicked * 60 + replied * 100;

    res.json({
      ...contact,
      engagementScore,
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
    const { email, firstName, lastName, company, jobTitle, stage, tags } = req.body;

    const contact = await upsertContact(userId, email, {
      firstName,
      lastName,
      company,
      jobTitle,
      stage,
      tags,
    });

    res.status(201).json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { firstName, lastName, company, jobTitle, stage, tags } = req.body;

    // Check if stage changed to log activity
    const oldContact = await prisma.contact.findFirst({ where: { id, userId } });
    if (!oldContact) return res.status(404).json({ message: "Contact not found" });

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        firstName,
        lastName,
        company,
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
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const result = await prisma.contact.deleteMany({ where: { id, userId } });

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
    const userId = (req as any).user.id;
    const { ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const { stage, tags } = data;

    // Verify ownership and get valid IDs
    const validContacts = await prisma.contact.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, stage: true },
    });

    const validIds = validContacts.map((c) => c.id);

    if (validIds.length === 0) {
      return res.status(404).json({ message: "No valid contacts found to update" });
    }

    const result = await prisma.contact.updateMany({
      where: { id: { in: validIds }, userId },
      data: { stage },
    });

    if (tags && Array.isArray(tags)) {
      const tagConnections = tags.map((tagId: string) => ({ id: tagId }));
      for (const id of validIds) {
        await prisma.contact.update({
          where: { id },
          data: { tags: { set: tagConnections } },
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

    res.json({ message: `${result.count} contacts updated` });
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const bulkDeleteContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const result = await prisma.contact.deleteMany({ where: { id: { in: ids }, userId } });

    res.json({ message: `${result.count} contacts deleted` });
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const importContacts = async (req: Request, res: Response) => {
  try {
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

    // If no mapping provided, return headers for the frontend to show mapping UI
    if (!mapping) {
      // Clean up file if we're just returning headers
      // But actually, we might want to keep it in a temp session? 
      // No, let's just return headers and have the frontend send the file again with mapping.
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

        // Map fields based on user's mapping
        // mapping example: { email: "Email Address", firstName: "First Name" }
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
          jobTitle: contactData.jobTitle,
          stage: contactData.stage || "COLD",
        });

        results.push(contact);
      } catch (err: any) {
        errors.push({ row, error: err.message });
      }
    }

    // Final cleanup
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.json({
      message: `Import completed: ${results.length} contacts imported, ${errors.length} errors.`,
      count: results.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};
