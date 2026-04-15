import { Request, Response } from "express";
import { PrismaClient, ActivityType } from "@prisma/client";
import { logContactActivity } from "../utils/contactService";

const prisma = new PrismaClient();

export const createNote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { contactId, content } = req.body;

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const note = await prisma.contactNote.create({
      data: {
        contactId,
        content,
      },
    });

    await logContactActivity(contactId, ActivityType.NOTE_ADDED, { noteId: note.id });

    res.status(201).json(note);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;
    const { content } = req.body;

    const note = await prisma.contactNote.findUnique({
      where: { id },
      include: { contact: true },
    }) as any;

    if (!note || note.contact.userId !== userId) {
      return res.status(404).json({ message: "Note not found" });
    }

    const updatedNote = await prisma.contactNote.update({
      where: { id },
      data: { content },
    });

    res.json(updatedNote);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;

    const note = await prisma.contactNote.findUnique({
      where: { id },
      include: { contact: true },
    }) as any;

    if (!note || note.contact.userId !== userId) {
      return res.status(404).json({ message: "Note not found" });
    }

    await prisma.contactNote.delete({
      where: { id },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
