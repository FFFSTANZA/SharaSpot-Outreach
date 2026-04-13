import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const createSnippet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, content, category } = req.body;
    const userId = req.user!.id;

    if (!name || !content) {
      res.status(400).json({ message: "Name and content are required" });
      return;
    }

    const snippet = await prisma.contentSnippet.create({
      data: {
        userId,
        name,
        content,
        category,
      },
    });

    res.status(201).json(snippet);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(409).json({ message: "A snippet with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Error creating snippet" });
  }
};

export const getSnippets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const snippets = await prisma.contentSnippet.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    res.status(200).json(snippets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching snippets" });
  }
};

export const updateSnippet = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, content, category } = req.body;
    const userId = req.user!.id;

    const existing = await prisma.contentSnippet.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Snippet not found" });
      return;
    }

    const snippet = await prisma.contentSnippet.update({
      where: { id },
      data: { name, content, category },
    });

    res.status(200).json(snippet);
  } catch (error) {
    res.status(500).json({ message: "Error updating snippet" });
  }
};

export const deleteSnippet = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const existing = await prisma.contentSnippet.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Snippet not found" });
      return;
    }

    await prisma.contentSnippet.delete({ where: { id } });
    res.status(200).json({ message: "Snippet deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting snippet" });
  }
};
