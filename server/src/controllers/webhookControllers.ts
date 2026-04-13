import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const createWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, events, secret } = req.body;
    const userId = req.user!.id;

    if (!url || !events || !Array.isArray(events)) {
      res.status(400).json({ message: "URL and events array are required" });
      return;
    }

    const webhook = await prisma.webhook.create({
      data: {
        userId,
        url,
        events,
        secret,
      },
    });

    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ message: "Error creating webhook" });
  }
};

export const getWebhooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const webhooks = await prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(webhooks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching webhooks" });
  }
};

export const deleteWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Webhook not found" });
      return;
    }

    await prisma.webhook.delete({ where: { id } });
    res.status(200).json({ message: "Webhook deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting webhook" });
  }
};
