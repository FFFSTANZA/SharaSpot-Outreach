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

        const withCount = await (prisma as any).contactList.findUnique({
            where: { id: list.id },
            include: { _count: { select: { contacts: true } } },
        });

        res.status(201).json(withCount);
    } catch (error: any) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "A list with this name already exists" });
        }
        res.status(500).json({ message: "An error occurred while creating the list" });
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
        res.status(500).json({ message: "An error occurred while fetching lists" });
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

        const updated = await (prisma as any).contactList.findUnique({
            where: { id },
            include: { _count: { select: { contacts: true } } },
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: "An error occurred while updating the list" });
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
        res.status(500).json({ message: "An error occurred while deleting the list" });
    }
};

export const addContactsToList = async (req: Request, res: Response) => {
    try {
        const scope = getOrgScope(req);
        const { id } = req.params;
        const { contactIds } = req.body;
        if (!Array.isArray(contactIds) || contactIds.length === 0)
            return res.status(400).json({ message: "No contacts selected" });
        // Verify list ownership
        const list = await (prisma as any).contactList.findFirst({ where: { id, ...scope } });
        if (!list) return res.status(404).json({ message: "List not found" });
        // Connect contacts via many-to-many
        await (prisma as any).contactList.update({
            where: { id },
            data: { contacts: { connect: contactIds.map((id: string) => ({ id })) } },
        });
        // Return updated list with count
        const updated = await (prisma as any).contactList.findUnique({
            where: { id },
            include: { _count: { select: { contacts: true } } },
        });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: "An error occurred while adding contacts to the list" });
    }
};

export const removeContactsFromList = async (req: Request, res: Response) => {
    try {
        const scope = getOrgScope(req);
        const { id } = req.params;
        const { contactIds } = req.body;
        if (!Array.isArray(contactIds) || contactIds.length === 0)
            return res.status(400).json({ message: "No contacts selected" });
        // Verify list ownership
        const list = await (prisma as any).contactList.findFirst({ where: { id, ...scope } });
        if (!list) return res.status(404).json({ message: "List not found" });
        // Disconnect contacts from list
        await (prisma as any).contactList.update({
            where: { id },
            data: { contacts: { disconnect: contactIds.map((id: string) => ({ id })) } },
        });
        // Return updated list with count
        const updated = await (prisma as any).contactList.findUnique({
            where: { id },
            include: { _count: { select: { contacts: true } } },
        });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: "An error occurred while removing contacts from the list" });
    }
};
