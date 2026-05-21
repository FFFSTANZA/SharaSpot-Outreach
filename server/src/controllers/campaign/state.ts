import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import { isValidTransition } from "../../utils/campaignStateMachine";
import { emailQueue } from "../../queues/emailQueue";

export const pauseCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: { sender: { select: { id: true, email: true, name: true, isVerified: true } } },
    });

    if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return; }
    if (campaign.userId !== req.user!.id) { res.status(403).json({ message: "Forbidden" }); return; }
    if (!isValidTransition(campaign.status, "PAUSED")) {
      res.status(409).json({ message: `Cannot pause campaign in ${campaign.status} state` });
      return;
    }

    const result = await prisma.emailCampaign.updateMany({
      where: { id, status: campaign.status },
      data: { status: "PAUSED" },
    });

    if (result.count === 0) {
      res.status(409).json({ message: "Campaign state has changed, please retry" });
      return;
    }

    try {
      const pendingJobs = await prisma.emailJob.findMany({
        where: { campaignId: id, status: { in: ["PENDING", "SENDING"] } },
        select: { id: true }
      });
      const pendingJobIds = new Set(pendingJobs.map(j => j.id));

      const jobs = await emailQueue.getJobs(["delayed", "waiting"]);
      for (const job of jobs) {
        if (job.data.emailJobId && pendingJobIds.has(job.data.emailJobId)) {
          await job.remove().catch(() => {});
        }
      }
    } catch (err) {
      logger.error({ err }, "Error clearing BullMQ jobs on pause");
    }

    res.status(200).json({ ...campaign, status: "PAUSED" });
  } catch (error: any) {
    logger.error({ err: error }, "Error in pauseCampaign");
    res.status(500).json({ message: "Error pausing campaign" });
  }
};

export const resumeCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, email: true, name: true, isVerified: true } },
        emails: true,
      },
    });

    if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return; }
    if (campaign.userId !== req.user!.id) { res.status(403).json({ message: "Forbidden" }); return; }
    if (campaign.status !== "PAUSED") {
      res.status(409).json({ message: "Only paused campaigns can be resumed" });
      return;
    }

    const pendingJobs = campaign.emails.filter((e) => e.status === "PENDING");
    const sendingJobs = campaign.emails.filter((e) => e.status === "SENDING");
    const terminalJobs = campaign.emails.filter((e) =>
      ["SENT", "FAILED", "CANCELLED"].includes(e.status)
    );

    if (pendingJobs.length === 0 && sendingJobs.length === 0) {
      const result = await prisma.emailCampaign.updateMany({
        where: { id, status: "PAUSED" },
        data: { status: "COMPLETED" },
      });
      if (result.count === 0) {
        res.status(409).json({ message: "Campaign state has changed, please retry" });
        return;
      }
      res.status(200).json({ ...campaign, status: "COMPLETED" });
      return;
    }

    const now = new Date();

    if (pendingJobs.length > 0) {
      const sorted = [...pendingJobs].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      for (let i = 0; i < sorted.length; i++) {
        const newScheduledAt = new Date(now.getTime() + i * campaign.delaySeconds * 1000);
        await prisma.emailJob.update({
          where: { id: sorted[i].id },
          data: { scheduledAt: newScheduledAt },
        });

        const delay = Math.max(0, newScheduledAt.getTime() - Date.now());
        await emailQueue.add(
          "send-email",
          { emailJobId: sorted[i].id },
          { jobId: `${sorted[i].id}-${crypto.randomUUID()}`, delay }
        );
      }
    }

    const result = await prisma.emailCampaign.updateMany({
      where: { id, status: "PAUSED" },
      data: { status: "SENDING" },
    });

    if (result.count === 0) {
      res.status(409).json({ message: "Campaign state has changed, please retry" });
      return;
    }

    res.status(200).json({ ...campaign, status: "SENDING" });
  } catch (error: any) {
    logger.error({ err: error }, "Error in resumeCampaign");
    res.status(500).json({ message: "Error resuming campaign" });
  }
};

export const cancelCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: { sender: { select: { id: true, email: true, name: true, isVerified: true } } },
    });

    if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return; }
    if (campaign.userId !== req.user!.id) { res.status(403).json({ message: "Forbidden" }); return; }
    if (!isValidTransition(campaign.status, "CANCELLED")) {
      res.status(409).json({ message: `Cannot cancel campaign in ${campaign.status} state` });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.emailCampaign.updateMany({
        where: { id, status: campaign.status },
        data: { status: "CANCELLED" },
      });

      if (updated.count === 0) return null;

      await tx.emailJob.updateMany({
        where: { campaignId: id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      return updated;
    });

    if (!result) {
      res.status(409).json({ message: "Campaign state has changed, please retry" });
      return;
    }

    res.status(200).json({ ...campaign, status: "CANCELLED" });
  } catch (error: any) {
    logger.error({ err: error }, "Error in cancelCampaign");
    res.status(500).json({ message: "Error cancelling campaign" });
  }
};
