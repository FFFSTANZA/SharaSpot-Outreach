import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getOrgScope, orgCreateData } from "../utils/orgScope";

const prisma = new PrismaClient();

export const createList = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "List name is required" });
        }

        const list = await (prisma as any).contactList.create({
            data: orgCreateData(req, { userId: req.user!.id, name }),
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
        const scope = getOrgScope(req);

        const lists = await (prisma as any).contactList.findMany({
            where: { ...scope },
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
        const scope = getOrgScope(req);
        const { id } = req.params;
        const { name } = req.body;

        const result = await (prisma as any).contactList.updateMany({
            where: { id, ...scope },
            data: { name },
        });

        if (result.count === 0) {
            return res.status(404).json({ message: "List not found" });
        }

        res.json({ message: "List updated successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteList = async (req: Request, res: Response) => {
    try {
        const scope = getOrgScope(req);
        const { id } = req.params;

        const result = await (prisma as any).contactList.deleteMany({
            where: { id, ...scope },
        });

        if (result.count === 0) {
            return res.status(404).json({ message: "List not found" });
        }

        res.json({ message: "List deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addContactsToList = async (req: Request, res: Response) => {
    try {
        const scope = getOrgScope(req);
        const { id } = req.params; // List ID
        const { contactIds } = req.body;

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ message: "No contacts selected" });
        }

        // Verify list belongs to user's scope
        const list = await (prisma as any).contactList.findFirst({
            where: { id, ...scope },
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
        const scope = getOrgScope(req);
        const { id } = req.params; // List ID
        const { contactIds } = req.body;

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ message: "No contacts selected" });
        }

        // Verify list belongs to user's scope
        const list = await (prisma as any).contactList.findFirst({
            where: { id, ...scope },
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
