import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user!.id;

    if (!name) {
      res.status(400).json({ message: "Folder name is required" });
      return;
    }

    const folder = await prisma.templateFolder.create({
      data: {
        userId,
        name,
        parentId,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: "Error creating folder" });
  }
};

export const getFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const folders = await prisma.templateFolder.findMany({
      where: { userId },
      include: { children: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching folders" });
  }
};

export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const existing = await prisma.templateFolder.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }

    await prisma.templateFolder.delete({ where: { id } });
    res.status(200).json({ message: "Folder deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting folder" });
  }
};
