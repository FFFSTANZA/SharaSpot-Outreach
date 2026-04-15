import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getTags = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const tags = await (prisma as any).tag.findMany({
      where: { userId },
    });
    res.json(tags);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, color } = req.body;

    const tag = await prisma.tag.create({
      data: {
        userId,
        name,
        color,
      },
    });

    res.status(201).json(tag);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;
    const { name, color } = req.body;

    const tag = await prisma.tag.update({
      where: { id, userId },
      data: {
        name,
        color,
      },
    });

    res.json(tag);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;

    await prisma.tag.delete({
      where: { id, userId },
    });

    res.json({ message: "Tag deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
