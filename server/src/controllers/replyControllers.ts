import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { verifyCampaignOwnership } from "../utils/authorization";

/**
 * GET /api/replies/campaigns/:campaignId
 * Returns reply metrics for a campaign.
 */
export const getCampaignReplyMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;
    const campaignId = campaign.id;

    const totalSent = await prisma.emailJob.count({
      where: { campaignId, status: "SENT" },
    });

    const repliedCount = await prisma.emailJob.count({
      where: { campaignId, status: "SENT", isReplied: true },
    });

    const replyRate = totalSent > 0
      ? Math.round((repliedCount / totalSent) * 1000) / 10
      : 0;

    // Get reply events with timestamps
    const replyEvents = await prisma.trackingEvent.findMany({
      where: {
        emailJob: { campaignId },
        eventType: "REPLY",
      },
      include: {
        emailJob: {
          select: { toEmail: true, sentAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const replies = replyEvents.map((event) => ({
      emailJobId: event.emailJobId,
      toEmail: event.emailJob.toEmail,
      repliedAt: event.createdAt.toISOString(),
      sentAt: event.emailJob.sentAt?.toISOString() ?? null,
    }));

    res.status(200).json({
      campaignId,
      totalSent,
      repliedCount,
      replyRate,
      replies,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching reply metrics" });
  }
};

/**
 * GET /api/replies/campaigns/:campaignId/replied-emails
 * Returns per-email reply details (which recipients replied).
 */
export const getCampaignRepliedEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;
    const campaignId = campaign.id;

    const repliedJobs = await prisma.emailJob.findMany({
      where: { campaignId, status: "SENT", isReplied: true },
      select: {
        id: true,
        toEmail: true,
        sentAt: true,
        sender: { select: { email: true, name: true } },
        trackingEvents: {
          where: { eventType: "REPLY" },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    const emails = repliedJobs.map((job) => ({
      emailJobId: job.id,
      toEmail: job.toEmail,
      sentAt: job.sentAt?.toISOString() ?? null,
      sender: job.sender,
      repliedAt: job.trackingEvents[0]?.createdAt.toISOString() ?? null,
      replyCount: job.trackingEvents.length,
    }));

    res.status(200).json({ emails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching replied emails" });
  }
};

/**
 * GET /api/replies/campaigns/:campaignId/unreplied-emails
 * Returns emails that were sent but haven't received a reply yet.
 */
export const getCampaignUnrepliedEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;
    const campaignId = campaign.id;

    const unrepliedJobs = await prisma.emailJob.findMany({
      where: { campaignId, status: "SENT", isReplied: false },
      select: {
        id: true,
        toEmail: true,
        sentAt: true,
        sender: { select: { email: true, name: true } },
      },
      orderBy: { sentAt: "desc" },
    });

    const emails = unrepliedJobs.map((job) => ({
      emailJobId: job.id,
      toEmail: job.toEmail,
      sentAt: job.sentAt?.toISOString() ?? null,
      sender: job.sender,
    }));

    res.status(200).json({ emails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching unreplied emails" });
  }
};
