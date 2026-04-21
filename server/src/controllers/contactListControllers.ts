import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "List name is required" });
        }

        const list = await (prisma as any).contactList.create({
            data: {
                userId,
                name,
            },
        });

        res.status(201).json(list);
    } catch (error: any) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "A list with this name already exists" });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getLists = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const lists = await (prisma as any).contactList.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { contacts: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(lists);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { name } = req.body;

        const list = await (prisma as any).contactList.updateMany({
            where: { id, userId },
            data: { name },
        });

        if (list.count === 0) {
            return res.status(404).json({ message: "List not found" });
        }

        res.json({ message: "List updated successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        const list = await (prisma as any).contactList.deleteMany({
            where: { id, userId },
        });

        if (list.count === 0) {
            return res.status(404).json({ message: "List not found" });
        }

        res.json({ message: "List deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addContactsToList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params; // List ID
        const { contactIds } = req.body;

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ message: "No contacts selected" });
        }

        // Verify list belongs to user
        const list = await (prisma as any).contactList.findFirst({
            where: { id, userId },
        });

        if (!list) {
            return res.status(404).json({ message: "List not found" });
        }

        // Add contacts to list
        await (prisma as any).contactList.update({
            where: { id },
            data: {
                contacts: {
                    connect: contactIds.map((id: string) => ({ id })),
                },
            },
        });

        res.json({ message: `${contactIds.length} contacts added to list` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const removeContactsFromList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params; // List ID
        const { contactIds } = req.body;

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ message: "No contacts selected" });
        }

        // Verify list belongs to user
        const list = await (prisma as any).contactList.findFirst({
            where: { id, userId },
        });

        if (!list) {
            return res.status(404).json({ message: "List not found" });
        }

        // Remove contacts from list
        await (prisma as any).contactList.update({
            where: { id },
            data: {
                contacts: {
                    disconnect: contactIds.map((id: string) => ({ id })),
                },
            },
        });

        res.json({ message: `${contactIds.length} contacts removed from list` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
