import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logContactActivity, upsertContact } from "../utils/contactService";

const prisma = new PrismaClient();

export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { search, stage, tag } = req.query;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: "insensitive" } },
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { company: { contains: search as string, mode: "insensitive" } },
        { jobTitle: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (stage) {
      where.stage = stage;
    }

    if (tag) {
      where.tags = {
        some: {
          id: tag as string,
        },
      };
    }

    const contacts = await (prisma as any).contact.findMany({
      where,
      include: {
        tags: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const contactEmails = contacts.map((c: any) => c.email);
    const jobs = await prisma.emailJob.findMany({
      where: {
        toEmail: { in: contactEmails },
        campaign: { userId }
      },
      include: {
        trackingEvents: true,
      },
    });

    const jobsByEmail: Record<string, any[]> = {};
    jobs.forEach(job => {
      if (!jobsByEmail[job.toEmail]) jobsByEmail[job.toEmail] = [];
      jobsByEmail[job.toEmail].push(job);
    });

    const contactsWithStats = contacts.map((contact: any) => {
      const contactJobs = jobsByEmail[contact.email] || [];

      const sent = contactJobs.filter((j: any) => j.status === 'SENT').length;
      const opened = contactJobs.filter((j: any) => j.trackingEvents.some((e: any) => e.eventType === 'OPEN')).length;
      const clicked = contactJobs.filter((j: any) => j.trackingEvents.some((e: any) => e.eventType === 'CLICK')).length;
      const replied = contactJobs.filter((j: any) => j.isReplied).length;

      // Score = (Sent * 1) + (Opened * 5) + (Clicked * 10) + (Replied * 20)
      const engagementScore = (sent * 1) + (opened * 5) + (clicked * 10) + (replied * 20);

      return {
        ...contact,
        engagementScore,
        _count: {
          emailsSent: sent,
          emailsOpened: opened,
          emailsClicked: clicked,
          emailsReplied: replied,
        }
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

    const contact = await (prisma as any).contact.findFirst({
      where: { id, userId },
      include: {
        tags: true,
        notes: {
          orderBy: { createdAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const jobs = await prisma.emailJob.findMany({
      where: { toEmail: (contact as any).email, campaign: { userId } },
      include: {
        trackingEvents: true,
      },
    });

    const sent = jobs.filter((j: any) => j.status === 'SENT').length;
    const opened = jobs.filter((j: any) => j.trackingEvents.some((e: any) => e.eventType === 'OPEN')).length;
    const clicked = jobs.filter((j: any) => j.trackingEvents.some((e: any) => e.eventType === 'CLICK')).length;
    const replied = jobs.filter((j: any) => j.isReplied).length;

    // Score = (Sent * 1) + (Opened * 5) + (Clicked * 10) + (Replied * 20)
    const engagementScore = (sent * 1) + (opened * 5) + (clicked * 10) + (replied * 20);

    const contactWithStats = {
      ...contact,
      engagementScore,
      _count: {
        emailsSent: sent,
        emailsOpened: opened,
        emailsClicked: clicked,
        emailsReplied: replied,
      }
    };

    res.json(contactWithStats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
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
    const oldContact = await (prisma as any).contact.findFirst({ where: { id, userId } });
    if (!oldContact) return res.status(404).json({ message: "Contact not found" });

    const contact = await (prisma as any).contact.update({
      where: { id },
      data: {
        firstName,
        lastName,
        company,
        jobTitle,
        stage,
        tags: tags ? {
          set: tags.map((tagId: string) => ({ id: tagId })),
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    if (stage && stage !== oldContact.stage) {
      await logContactActivity(id, "STAGE_CHANGED" as any, { from: oldContact.stage, to: stage });
    }

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    await (prisma as any).contact.delete({
      where: { id, userId },
    });

    res.json({ message: "Contact deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

    const result = await (prisma as any).contact.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data: {
        stage,
      },
    });

    if (tags && Array.isArray(tags)) {
      // updateMany doesn't support many-to-many relations in Prisma
      // We have to do it individually or use a different approach.
      // For simplicity and since it's a small number usually:
      for (const id of ids) {
        await (prisma as any).contact.update({
          where: { id, userId },
          data: {
            tags: {
              set: tags.map((tagId: string) => ({ id: tagId })),
            },
          },
        });
      }
    }

    if (stage) {
      for (const id of ids) {
        await logContactActivity(id, "STAGE_CHANGED" as any, { to: stage });
      }
    }

    res.json({ message: `${result.count} contacts updated` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkDeleteContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const result = await (prisma as any).contact.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    res.json({ message: `${result.count} contacts deleted` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
