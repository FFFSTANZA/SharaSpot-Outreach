import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { requirePremium } from "../utils/premiumCheck";

export const getTemplates = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const templates = await prisma.sequenceTemplate.findMany({
    where: {
      OR: [
        { userId },
        { isSystem: true }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(templates);
};

export const createTemplate = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { name, description, category, steps } = req.body;

  // Premium feature check
  const premiumStatus = await requirePremium(userId, "Sequence templates");
  if (!premiumStatus.allowed) {
    return res.status(403).json({ error: premiumStatus.message });
  }

  const template = await prisma.sequenceTemplate.create({
    data: {
      userId,
      name,
      description,
      category,
      steps,
    }
  });

  res.json(template);
};

export const deleteTemplate = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params as { id: string };

  const template = await prisma.sequenceTemplate.findFirst({
    where: { id, userId }
  });

  if (!template) {
    return res.status(404).json({ error: "Template not found or unauthorized." });
  }

  await prisma.sequenceTemplate.delete({
    where: { id }
  });

  res.json({ success: true });
};
