import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getOrgScope, orgCreateData } from "../utils/orgScope";

const prisma = new PrismaClient();

export const getTags = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const tags = await (prisma as any).tag.findMany({
      where: { ...scope },
    });
    res.json(tags);
  } catch (error: any) {
        res.status(500).json({ message: "An error occurred" });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;

    const tag = await (prisma as any).tag.create({
      data: orgCreateData(req, { userId: req.user!.id, name, color }),
    });

    res.status(201).json(tag);
  } catch (error: any) {
        res.status(500).json({ message: "An error occurred" });
  }
};

export const updateTag = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;
    const { name, color } = req.body;

    const existing = await (prisma as any).tag.findFirst({ where: { id, ...scope } });
    if (!existing) return res.status(404).json({ message: "Tag not found" });

    const tag = await (prisma as any).tag.update({
      where: { id },
      data: {
        name,
        color,
      },
    });

    res.json(tag);
  } catch (error: any) {
        res.status(500).json({ message: "An error occurred" });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;

    const result = await (prisma as any).tag.deleteMany({
      where: { id, ...scope },
    });

    if (result.count === 0) return res.status(404).json({ message: "Tag not found" });

    res.json({ message: "Tag deleted successfully" });
  } catch (error: any) {
        res.status(500).json({ message: "An error occurred" });
  }
};
