import { Request, Response } from "express";
import crypto from "crypto";
import { logger } from "../../utils/logger";
import { emailQueue } from "../../queues/emailQueue";
import { priorityQueue } from "../../queues/priorityQueue";
import { campaignBodySchema } from "../../validation/campaign";
import { campaignService, CampaignError } from "../../services/campaignService";

export const createCampaign = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = campaignBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0].message });
      return;
    }

    const {
      senderIds: rawSenderIds,
      senderId: legacySenderId,
      subject,
      body,
      startTime,
      delaySeconds,
      hourlyLimit,
      emails,
      attachments,
      steps,
      trackOpens,
      trackClicks,
      timezone,
      businessStartHour,
      businessEndHour,
      isPriority,
      replyTo,
    } = parsed.data;

    let senderIds: string[];
    if (Array.isArray(rawSenderIds) && rawSenderIds.length > 0) {
      senderIds = rawSenderIds;
    } else if (typeof legacySenderId === "string" && legacySenderId) {
      senderIds = [legacySenderId];
    } else {
      res.status(400).json({ message: "At least one sender is required" });
      return;
    }

    const result = await campaignService.createCampaign(req.user!.id, {
      senderIds,
      subject,
      body,
      startTime,
      delaySeconds,
      hourlyLimit,
      emails,
      attachments,
      steps,
      trackOpens,
      trackClicks,
      timezone,
      businessStartHour,
      businessEndHour,
      isPriority,
      replyTo,
    });

    if (isPriority === true) {
      for (const emailJob of result.emailJobs) {
        const delay = Math.max(0, new Date(emailJob.scheduledAt).getTime() - Date.now());
        await priorityQueue.add(
          "send-priority-email",
          { emailJobId: emailJob.id, userId: req.user!.id },
          {
            jobId: `priority-${emailJob.id}-${crypto.randomUUID()}`,
            delay,
            priority: 3,
          },
        );
      }
    } else {
      for (const emailJob of result.emailJobs) {
        const delay = Math.max(0, new Date(emailJob.scheduledAt).getTime() - Date.now());
        await emailQueue.add(
          "send-email",
          { emailJobId: emailJob.id },
          {
            jobId: `${emailJob.id}-${crypto.randomUUID()}`,
            delay,
          },
        );
      }
    }

    res.status(201).json({
      message: "Campaign scheduled successfully",
      campaignId: result.campaignId,
      senderPool: result.senderPool,
    });
  } catch (error: unknown) {
    if (error instanceof CampaignError) {
      res.status(error.statusCode).json({
        message: error.message,
        upgradeRequired: error.upgradeRequired,
      });
      return;
    }

    logger.error({ err: error }, "Error in createCampaign");
    res.status(500).json({ message: "Error creating campaign" });
  }
};
