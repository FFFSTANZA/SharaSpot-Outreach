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
      sequenceGraph,
      sequenceSchedule,
      frequencyCaps,
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
      sequenceGraph,
      sequenceSchedule,
      frequencyCaps,
      trackOpens,
      trackClicks,
      timezone,
      businessStartHour,
      businessEndHour,
      isPriority,
      replyTo,
    });

    const queue = isPriority === true ? priorityQueue : emailQueue;
    const prefix = isPriority === true ? "priority" : "email";
    let enqueueErrors = 0;
    for (const emailJob of result.emailJobs) {
      try {
        const delay = Math.max(0, new Date(emailJob.scheduledAt).getTime() - Date.now());
        const jobData = isPriority === true
          ? { emailJobId: emailJob.id, userId: req.user!.id }
          : { emailJobId: emailJob.id };
        await queue.add(
          isPriority === true ? "send-priority-email" : "send-email",
          jobData,
          { jobId: `${prefix}-${emailJob.id}-${crypto.randomUUID()}`, delay },
        );
      } catch (err) {
        enqueueErrors++;
        logger.error({ err, emailJobId: emailJob.id }, "Failed to enqueue email job");
      }
    }
    if (enqueueErrors > 0) {
      logger.warn({ total: result.emailJobs.length, failed: enqueueErrors }, "Some email jobs failed to enqueue — startup sweep will recover");
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
