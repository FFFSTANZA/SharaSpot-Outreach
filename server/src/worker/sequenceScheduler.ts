import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { emailQueue } from "../queues/emailQueue";
import { logger } from "../utils/logger";
import { addBusinessDays } from "../utils/businessDays";

/**
 * Checks if a condition is satisfied for a given recipient's previous step email job.
 * Returns true if the condition is met (or if there is no condition).
 */
async function checkCondition(
  condition: string | null,
  emailJobId: string,
): Promise<boolean> {
  if (!condition || condition === "none") return true;
  if (!emailJobId) return false;

  const eventType = condition === "opened" ? "OPEN" : condition === "clicked" ? "CLICK" : "REPLY";
  const events = await prisma.trackingEvent.findMany({
    where: { emailJobId, eventType },
    take: 1,
  });

  return events.length > 0;
}

/**
 * Sequence Scheduler — runs on a recurring interval to evaluate which recipients
 * are due for their next follow-up step and enqueues the corresponding email jobs.
 *
 * Optimized with batch queries to avoid N+1 patterns on large campaigns.
 */
export async function processSchedulerJob(): Promise<void> {
  logger.info("[SequenceScheduler] Running scheduler tick...");

  // Find all campaigns that have sequence steps
  const campaigns = await prisma.emailCampaign.findMany({
    where: {
      sequenceSteps: { some: {} },
      status: { in: ["SCHEDULED", "SENDING"] },
    },
    select: {
      id: true,
      senderId: true,
      delaySeconds: true,
      sequenceSteps: { orderBy: { stepNumber: "asc" } },
      campaignSenders: {
        orderBy: { rotationOrder: "asc" },
        select: { senderId: true, rotationOrder: true },
      },
    },
  });

  for (const campaign of campaigns) {
    const totalSteps = campaign.sequenceSteps.length;
    const stepMap = new Map(campaign.sequenceSteps.map((s) => [s.stepNumber, s]));
    const poolSenders = campaign.campaignSenders;

    // Batch fetch step job counts for all steps in this campaign
    const stepJobCounts: Record<string, number> = {};
    if (poolSenders.length > 0) {
      const counts = await prisma.emailJob.groupBy({
        by: ["sequenceStepId"],
        _count: { id: true },
        where: { campaignId: campaign.id, sequenceStepId: { not: null } },
      });
      for (const c of counts) {
        if (c.sequenceStepId) stepJobCounts[c.sequenceStepId] = c._count.id;
      }
    }

    // Batch fetch original jobs (step 0) for all recipients in this campaign
    const originalJobs = await prisma.emailJob.findMany({
      where: { campaignId: campaign.id, columnData: { not: Prisma.DbNull } },
      select: { toEmail: true, columnData: true },
    });
    const columnDataMap = new Map<string, any>();
    for (const job of originalJobs) {
      if (!columnDataMap.has(job.toEmail)) {
        columnDataMap.set(job.toEmail, job.columnData);
      }
    }

    // Find recipients due for next step
    const recipients = await prisma.recipientSequenceState.findMany({
      where: {
        campaignId: campaign.id,
        completed: false,
        paused: false,
        replied: false,
      },
    });

    // Collect recipients that need updates
    const toComplete: string[] = [];
    const toSkipUpdates: Array<{ id: string; statuses: any[] }> = [];
    const toSchedule: Array<{
      recipientId: string;
      recipientEmail: string;
      currentStep: number;
      nextStepNumber: number;
      nextStep: any;
      currentStatus: any;
      statuses: any[];
    }> = [];

    for (const recipient of recipients) {
      try {
        let currentStep = recipient.currentStep;
        let statuses = recipient.stepStatuses as any[];
        let currentStatus = statuses[currentStep];

        // Handle SKIPPED steps — advance immediately in a loop
        while (currentStatus && currentStatus.status === "SKIPPED") {
          const nextStepNumber = currentStep + 1;
          if (nextStepNumber >= totalSteps) {
            toComplete.push(recipient.id);
            currentStatus = null;
            break;
          }
          const nextStep = stepMap.get(nextStepNumber);
          if (!nextStep) break;

          // Advance: set next step to PENDING
          const updatedStatuses = [...statuses];
          updatedStatuses[nextStepNumber] = { ...updatedStatuses[nextStepNumber], status: "PENDING" };
          statuses = updatedStatuses;
          currentStep = nextStepNumber;
          currentStatus = statuses[currentStep];
        }

        // Persist SKIPPED→PENDING advances
        if (currentStep !== recipient.currentStep && currentStatus !== null) {
          toSkipUpdates.push({ id: recipient.id, statuses });
        }

        if (!currentStatus || currentStatus.status !== "SENT") continue;

        const nextStepNumber = currentStep + 1;

        if (nextStepNumber >= totalSteps) {
          toComplete.push(recipient.id);
          continue;
        }

        const nextStep = stepMap.get(nextStepNumber);
        if (!nextStep) continue;

        // Check if wait period has elapsed (using business days)
        const sentAt = new Date(currentStatus.sentAt);
        const dueAt = addBusinessDays(sentAt, nextStep.waitDays);
        if (new Date() < dueAt) continue;

        // Evaluate condition if present
        if (nextStep.condition && nextStep.condition !== "none") {
          const conditionMet = await checkCondition(nextStep.condition, currentStatus.emailJobId);
          if (!conditionMet) {
            const updatedStatuses = [...statuses];
            updatedStatuses[nextStepNumber] = { ...updatedStatuses[nextStepNumber], status: "SKIPPED" };
            toSkipUpdates.push({ id: recipient.id, statuses: updatedStatuses });
            logger.info(
              `[SequenceScheduler] Step ${nextStepNumber} SKIPPED (condition "${nextStep.condition}" not met) for ${recipient.recipientEmail}`
            );
            continue;
          }
        }

        toSchedule.push({
          recipientId: recipient.id,
          recipientEmail: recipient.recipientEmail,
          currentStep,
          nextStepNumber,
          nextStep,
          currentStatus,
          statuses,
        });
      } catch (err) {
        logger.error({ err }, `[SequenceScheduler] Error evaluating recipient ${recipient.recipientEmail}`);
      }
    }

    // Batch: mark completed
    if (toComplete.length > 0) {
      await prisma.recipientSequenceState.updateMany({
        where: { id: { in: toComplete } },
        data: { completed: true },
      });
    }

    // Batch: persist skip/advance updates
    for (const skip of toSkipUpdates) {
      await prisma.recipientSequenceState.update({
        where: { id: skip.id },
        data: { stepStatuses: skip.statuses },
      });
    }

    // Process scheduling with atomic claims
    for (const item of toSchedule) {
      // Atomic claim: advance currentStep only if it hasn't changed
      const claimResult = await prisma.recipientSequenceState.updateMany({
        where: { id: item.recipientId, currentStep: item.currentStep },
        data: { currentStep: item.nextStepNumber },
      });

      if (claimResult.count === 0) continue;

      const { recipientId, recipientEmail, nextStepNumber, nextStep, statuses } = item;

      // Update step status to SCHEDULED
      const updatedStatuses = [...statuses];
      updatedStatuses[nextStepNumber] = { ...updatedStatuses[nextStepNumber], status: "SCHEDULED" };

      // Determine sender via round-robin (using pre-fetched counts)
      let assignedSenderId = campaign.senderId;
      if (poolSenders.length > 0) {
        const stepJobCount = stepJobCounts[nextStep.id] || 0;
        assignedSenderId = poolSenders[stepJobCount % poolSenders.length].senderId;
      }

      const columnData = columnDataMap.get(recipientEmail);

      const emailJob = await prisma.emailJob.create({
        data: {
          campaignId: campaign.id,
          toEmail: recipientEmail,
          scheduledAt: new Date(),
          sequenceStepId: nextStep.id,
          ...(assignedSenderId ? { senderId: assignedSenderId } : {}),
          ...(columnData ? { columnData } : {}),
        },
      });

      // Update step status with emailJobId
      updatedStatuses[nextStepNumber].emailJobId = emailJob.id;
      await prisma.recipientSequenceState.update({
        where: { id: recipientId },
        data: { stepStatuses: updatedStatuses },
      });

      // Increment step job count for round-robin
      stepJobCounts[nextStep.id] = (stepJobCounts[nextStep.id] || 0) + 1;

      // Enqueue into BullMQ
      await emailQueue.add(
        "send-email",
        { emailJobId: emailJob.id },
        { jobId: `${emailJob.id}-${crypto.randomUUID()}`, delay: 0 }
      );

      logger.info(
        `[SequenceScheduler] Enqueued step ${nextStepNumber} for ${recipientEmail} in campaign ${campaign.id}`
      );
    }

    // Check if the overall campaign is complete
    try {
      const [activeStatesCount, nonTerminalJobsCount] = await Promise.all([
        prisma.recipientSequenceState.count({
          where: { campaignId: campaign.id, completed: false, paused: false, replied: false },
        }),
        prisma.emailJob.count({
          where: { campaignId: campaign.id, status: { notIn: ["SENT", "FAILED", "CANCELLED"] } },
        }),
      ]);

      if (activeStatesCount === 0 && nonTerminalJobsCount === 0) {
        await prisma.emailCampaign.updateMany({
          where: { id: campaign.id, status: "SENDING" },
          data: { status: "COMPLETED" },
        });
        logger.info(`[SequenceScheduler] Campaign ${campaign.id} marked as COMPLETED`);
      }
    } catch (err) {
      logger.error({ err }, `[SequenceScheduler] Error checking completion for campaign ${campaign.id}`);
    }
  }

  logger.info("[SequenceScheduler] Scheduler tick complete.");
}
