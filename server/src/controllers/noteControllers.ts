import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logContactActivity } from "../utils/contactService";
import { getOrgScope, orgCreateData } from "../utils/orgScope";

const prisma = new PrismaClient();

export const createNote = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const { contactId, content } = req.body;

    // Verify contact belongs to user's scope
    const contact = await (prisma as any).contact.findFirst({
      where: { id: contactId, ...scope },
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const note = await (prisma as any).note.create({
      data: {
        contactId,
        content,
      },
    });

    await logContactActivity(contactId, "NOTE_ADDED" as any, { noteId: note.id, content });

    res.status(201).json(note);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;
    const { content } = req.body;

    const note = await (prisma as any).note.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!note) return res.status(404).json({ message: "Note not found" });

    const scopedContact = await (prisma as any).contact.findFirst({
      where: { id: note.contactId, ...scope },
      select: { id: true },
    });
    if (!scopedContact) return res.status(404).json({ message: "Note not found" });

    const updatedNote = await (prisma as any).note.update({
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
    const scope = getOrgScope(req);
    const id = req.params.id as string;

    const note = await (prisma as any).note.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!note) return res.status(404).json({ message: "Note not found" });

    const scopedContact = await (prisma as any).contact.findFirst({
      where: { id: note.contactId, ...scope },
      select: { id: true },
    });
    if (!scopedContact) return res.status(404).json({ message: "Note not found" });

    await (prisma as any).note.delete({
      where: { id },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
