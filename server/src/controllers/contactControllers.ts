import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logContactActivity } from "../utils/contactService";

const prisma = new PrismaClient();

export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
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

    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getContactById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
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

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { email, firstName, lastName, company, jobTitle, stage, tags } = req.body;

    const contact = await (prisma as any).contact.create({
      data: {
        userId,
        email,
        firstName,
        lastName,
        company,
        jobTitle,
        stage: stage || "LEAD",
        tags: tags ? {
          connect: tags.map((tagId: string) => ({ id: tagId })),
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    res.status(201).json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
