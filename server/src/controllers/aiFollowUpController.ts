import { Request, Response } from "express";
import { generateFollowUps as generateFollowUpsAI } from "../utils/aiFollowUpService";

export const generateAIFollowUps = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { campaignId, subject, body, recipientName, customVariables } = req.body;

    let emailSubject = subject;
    let emailBody = body;
    let senderNm: string | undefined;

    if (campaignId && (!emailSubject || !emailBody)) {
      const { prisma } = await import("../config/prisma");
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: { sender: true },
      });

      if (!campaign || campaign.userId !== userId) {
        res.status(403).json({ message: "Campaign not found or access denied" });
        return;
      }

      emailSubject = campaign.subject;
      emailBody = campaign.body;
      senderNm = campaign.sender?.name || undefined;
    }

    if (!emailSubject || !emailBody) {
      res.status(400).json({ message: "subject and body are required" });
      return;
    }

    const followUps = await generateFollowUpsAI({
      subject: emailSubject,
      body: emailBody,
      senderName: senderNm,
      recipientName,
    });

    res.status(200).json({ followUps });
  } catch (error) {
    console.error("[AIFollowUp] Error generating follow-ups:", error);
    res.status(500).json({ message: "Failed to generate AI follow-ups" });
  }
};