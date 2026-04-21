import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export interface AuthResult<T> {
  resource: T;
  userId: string;
}

export async function verifyCampaignOwnership(
  req: Request,
  res: Response
): Promise<{ id: string } | null> {
  const campaignId = req.params.id as string || req.params.campaignId as string;
  const userId = req.user!.id;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, userId: true },
  });

  if (!campaign) {
    res.status(404).json({ message: "Campaign not found" });
    return null;
  }
  if (campaign.userId !== userId) {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }
  return campaign;
}

export async function verifySenderOwnership(
  req: Request,
  res: Response,
  senderId: string
): Promise<boolean> {
  const userId = req.user!.id;
  const sender = await prisma.sender.findUnique({
    where: { id: senderId },
    select: { id: true, userId: true },
  });

  if (!sender) {
    res.status(404).json({ message: "Sender not found" });
    return false;
  }
  if (sender.userId !== userId) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
}