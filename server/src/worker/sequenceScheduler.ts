import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { emailQueue } from "../queues/emailQueue";
import { evaluateConditions, StepCondition } from "../utils/sequenceConditions";
import { selectVariant } from "../utils/sequenceABTesting";
import { calculateSendTime, SendTimeConfig } from "../utils/sequenceTiming";

/**
 * Sequence Scheduler — runs on a recurring interval to evaluate which recipients
 * are due for their next follow-up step and enqueues the corresponding email jobs.
 */
export async function processSchedulerJob(): Promise<void> {
  console.log("[SequenceScheduler] Running scheduler tick...");

  // Find all campaigns that have sequence steps
  const campaigns = await prisma.emailCampaign.findMany({
    where: {
      sequenceSteps: { some: {} },
      status: { in: ["SCHEDULED", "SENDING"] },
    },
    include: {
      sequenceSteps: {
        orderBy: { stepNumber: "asc" },
        include: { variants: true },
      },
      campaignSenders: {
        orderBy: { rotationOrder: "asc" },
        select: { senderId: true, rotationOrder: true },
      },
    },
  });

  for (const campaign of campaigns) {
    const totalSteps = campaign.sequenceSteps.length;

    // Find recipients due for next step
    const recipients = await prisma.recipientSequenceState.findMany({
      where: {
        campaignId: campaign.id,
        completed: false,
        paused: false,
        replied: false,
      },
    });

    for (const recipient of recipients) {
      try {
        const statuses = recipient.stepStatuses as any[];
        const currentStatus = statuses[recipient.currentStep];

        // Current step must be SENT (or skipped) before we advance
        if (!currentStatus || !["SENT", "SKIPPED_CONDITION", "SKIPPED_MANUAL", "FORCED_SENT"].includes(currentStatus.status)) continue;

        const nextStepNumber = recipient.currentStep + 1;

        // Check if this is the last step — mark completed
        if (nextStepNumber >= totalSteps) {
          await prisma.recipientSequenceState.update({
            where: { id: recipient.id },
            data: { completed: true },
          });
          continue;
        }

        const nextStep = campaign.sequenceSteps.find((s) => s.stepNumber === nextStepNumber);
        if (!nextStep) continue;

        // Check for recipient override
        const override = await prisma.sequenceRecipientOverride.findUnique({
          where: {
            campaignId_recipientEmail_stepNumber: {
              campaignId: campaign.id,
              recipientEmail: recipient.recipientEmail,
              stepNumber: nextStepNumber,
            },
          },
        });

        let dueAt: Date;
        if (override?.scheduledAt) {
          dueAt = override.scheduledAt;
        } else {
          // Check if wait period has elapsed
          const lastActionAt = new Date(currentStatus.sentAt || currentStatus.updatedAt || recipient.updatedAt);
          
          let waitMs = nextStep.waitDays * 24 * 60 * 60 * 1000;
          if (nextStep.waitHours) {
            waitMs = nextStep.waitHours * 60 * 60 * 1000;
          }
          
          dueAt = new Date(lastActionAt.getTime() + waitMs);

          // Apply advanced timing config
          if (nextStep.sendTimeConfig) {
            dueAt = calculateSendTime(dueAt, nextStep.sendTimeConfig as unknown as SendTimeConfig);
          }
        }

        if (new Date() < dueAt && !override?.forced) continue;

        // Check conditions
        const metConditions = await evaluateConditions(
          recipient.recipientEmail,
          campaign.id,
          nextStep.conditions as unknown as StepCondition[]
        );

        if (!metConditions || override?.skipped) {
          // Skip this step
          const claimResult = await prisma.recipientSequenceState.updateMany({
            where: {
              id: recipient.id,
              currentStep: recipient.currentStep,
            },
            data: { currentStep: nextStepNumber },
          });

          if (claimResult.count > 0) {
            const updatedStatuses = [...statuses];
            updatedStatuses[nextStepNumber] = {
              stepNumber: nextStepNumber,
              status: override?.skipped ? "SKIPPED_MANUAL" : "SKIPPED_CONDITION",
              updatedAt: new Date(),
            };
            await prisma.recipientSequenceState.update({
              where: { id: recipient.id },
              data: { stepStatuses: updatedStatuses },
            });
            console.log(`[SequenceScheduler] Skipped step ${nextStepNumber} for ${recipient.recipientEmail} (Conditions not met or manual skip)`);
          }
          continue;
        }

        // Atomic claim: advance currentStep and set status to SCHEDULED
        const claimResult = await prisma.recipientSequenceState.updateMany({
          where: {
            id: recipient.id,
            currentStep: recipient.currentStep,
          },
          data: { currentStep: nextStepNumber },
        });

        if (claimResult.count === 0) continue;

        // Update step status to SCHEDULED
        const updatedStatuses = [...statuses];
        updatedStatuses[nextStepNumber] = {
          stepNumber: nextStepNumber,
          status: override?.forced ? "FORCED_SENT" : "SCHEDULED",
          updatedAt: new Date(),
        };
        await prisma.recipientSequenceState.update({
          where: { id: recipient.id },
          data: { stepStatuses: updatedStatuses },
        });

        // Handle A/B variant
        let selectedSubject = nextStep.subject;
        let selectedBody = nextStep.body;
        let variantId: string | undefined;

        if (nextStep.variants && nextStep.variants.length > 0) {
          const variant = selectVariant(recipient.recipientEmail, nextStep.id, nextStep.variants);
          if (variant) {
            selectedSubject = variant.subject;
            selectedBody = variant.body;
            variantId = variant.id;
          }
        }

        // Determine sender
        let assignedSenderId = nextStep.senderId;
        if (!assignedSenderId) {
          const poolSenders = campaign.campaignSenders;
          assignedSenderId = poolSenders.length > 0
            ? poolSenders[nextStepNumber % poolSenders.length].senderId
            : campaign.senderId;
        }

        const originalJob = await prisma.emailJob.findFirst({
          where: { campaignId: campaign.id, toEmail: recipient.recipientEmail, columnData: { not: Prisma.DbNull } },
          select: { columnData: true },
          orderBy: { createdAt: "asc" },
        });

        const emailJob = await prisma.emailJob.create({
          data: {
            campaignId: campaign.id,
            toEmail: recipient.recipientEmail,
            scheduledAt: new Date(),
            sequenceStepId: nextStep.id,
            sequenceABVariantId: variantId,
            ...(assignedSenderId ? { senderId: assignedSenderId } : {}),
            ...(originalJob?.columnData ? { columnData: originalJob.columnData } : {}),
          },
        });

        // Update step status with emailJobId
        updatedStatuses[nextStepNumber].emailJobId = emailJob.id;
        await prisma.recipientSequenceState.update({
          where: { id: recipient.id },
          data: { stepStatuses: updatedStatuses },
        });

        // Enqueue into BullMQ
        await emailQueue.add(
          "send-email",
          { emailJobId: emailJob.id },
          { jobId: `${emailJob.id}-${crypto.randomUUID()}`, delay: 0 }
        );

        console.log(
          `[SequenceScheduler] Enqueued step ${nextStepNumber} for ${recipient.recipientEmail} in campaign ${campaign.id}`
        );
      } catch (err) {
        console.error(
          `[SequenceScheduler] Error processing recipient ${recipient.recipientEmail}:`,
          err
        );
      }
    }
    
    // Check if the overall campaign is complete.
    try {
      const activeStatesCount = await prisma.recipientSequenceState.count({
        where: {
          campaignId: campaign.id,
          completed: false,
          paused: false,
          replied: false,
        },
      });

      const nonTerminalJobsCount = await prisma.emailJob.count({
        where: {
          campaignId: campaign.id,
          status: { notIn: ["SENT", "FAILED", "CANCELLED"] },
        },
      });

      if (activeStatesCount === 0 && nonTerminalJobsCount === 0) {
        await prisma.emailCampaign.updateMany({
          where: { id: campaign.id, status: "SENDING" },
          data: { status: "COMPLETED" },
        });
        console.log(`[SequenceScheduler] Campaign ${campaign.id} marked as COMPLETED`);
      }
    } catch (err) {
      console.error(`[SequenceScheduler] Error checking completion for campaign ${campaign.id}:`, err);
    }
  }

  console.log("[SequenceScheduler] Scheduler tick complete.");
}
