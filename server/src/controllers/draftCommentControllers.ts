import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId, content, parentId } = req.body;
    const userId = req.user!.id;

    if (!campaignId || !content) {
      res.status(400).json({ message: "Campaign ID and content are required" });
      return;
    }

    const comment = await prisma.draftComment.create({
      data: {
        campaignId,
        userId,
        content,
        parentId,
      },
      include: {
        user: {
          select: { name: true, email: true, avatarUrl: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment" });
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = req.params.campaignId as string;
    const comments = await prisma.draftComment.findMany({
      where: { campaignId },
      include: {
        user: {
          select: { name: true, email: true, avatarUrl: true }
        },
        replies: {
          include: {
            user: {
              select: { name: true, email: true, avatarUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments" });
  }
};
