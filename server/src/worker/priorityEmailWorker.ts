import { Worker, Job } from "bullmq";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { redisConnection, redis } from "../config/redis";
import { priorityQueue, PRIORITY_QUEUE_NAME } from "../queues/priorityQueue";
import { logger } from "../utils/logger";
import { collectSmtpTiming } from "../utils/signalCollector";
import { evaluateTiming } from "../utils/timingEngine";
import { performSafetyChecks, incrementPriorityQuota, incrementDomainRate } from "../utils/prioritySafetyLimits";
import { calculateRetryDelay, shouldRetry, MAX_PRIORITY_RETRIES } from "../utils/priorityRetry";
import { processEmailJob, checkCampaignCompletion } from "./emailWorker";
import { extractDomain } from "../utils/emailThreading";

/**
 * Priority Email Worker
 * 
 * Processes priority email jobs with delivery optimization:
 * 1. Safety checks (quota, domain limits, warmup)
 * 2. Signal collection (SMTP timing)
 * 3. Timing evaluation (congestion-based decision)
 * 4. Hold or send decision
 * 5. Success/failure handling
 * 6. Retry logic
 */

interface PriorityJobData {
  emailJobId: string;
  userId: string;
}

/**
 * Process priority email job
 */
export async function processPriorityJob(job: Job): Promise<void> {
  const { emailJobId, userId } = job.data as PriorityJobData;

  // Get the priority queue job record
  const priorityRecord = await prisma.priorityQueueJob.findUnique({
    where: { emailJobId },
  });

  if (!priorityRecord) {
    logger.warn(`[PRIORITY] No priority record found for ${emailJobId}, falling back to normal processing`);
    // Fall back to normal email queue
    await processEmailJob({ data: { emailJobId } } as any);
    return;
  }

  // Update status
  await prisma.priorityQueueJob.update({
    where: { emailJobId },
    data: { status: "PRIORITY_SENDING", statusMessage: "Processing priority email..." },
  });

  try {
    // Get the email job
    const emailJob = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
      include: {
        campaign: { include: { sender: true } },
        sender: true,
      },
    });

    if (!emailJob) {
      throw new Error("Email job not found");
    }

    // Extract recipient domain
    const recipientDomain = extractDomain(emailJob.toEmail);
    const senderId = emailJob.senderId ?? emailJob.campaign.senderId ?? "";

    // Perform safety checks
    const safetyCheck = await performSafetyChecks(userId, senderId, recipientDomain);
    
    if (!safetyCheck.allowed) {
      await updatePriorityStatus(emailJobId, "PRIORITY_PENDING", safetyCheck.reason || "Safety check failed");
      
      if (safetyCheck.retryAfterMs) {
        // Re-queue with delay
        await priorityQueue.add(
          "send-priority-email",
          { emailJobId, userId },
          { delay: safetyCheck.retryAfterMs }
        );
      }
      
      return;
    }

    // Collect SMTP timing signals
    const signals = await collectSmtpTiming(senderId, recipientDomain);
    const congestionScore = signals 
      ? Math.round((signals.tcpConnectMs + signals.greetingDelayMs + signals.dataMs) / 10)
      : 250;

    // Evaluate timing decision
    const decision = evaluateTiming(congestionScore);
    
    // Update with status message
    await updatePriorityStatus(
      emailJobId,
      "PRIORITY_SENDING",
      decision.statusMessage
    );

    if (decision.action === "DELAY_TO_NEXT_WINDOW" || decision.action === "HOLD_AND_RETRY") {
      // Hold and requeue
      const retryCount = priorityRecord.retryCount + 1;
      
      if (shouldRetry(retryCount)) {
        const delayMs = calculateRetryDelay(retryCount);
        
        await prisma.priorityQueueJob.update({
          where: { emailJobId },
          data: {
            retryCount,
            statusMessage: `${decision.statusMessage} - Retrying in ${Math.round(delayMs/60000)} minutes`,
          },
        });

        // Re-queue
        await priorityQueue.add(
          "send-priority-email",
          { emailJobId, userId },
          { jobId: `priority-${emailJobId}-${crypto.randomUUID()}`, delay: delayMs }
        );
        
        logger.info(`[PRIORITY] Delaying ${emailJobId} by ${delayMs}ms (retry ${retryCount})`);
      } else {
        // Max retries exceeded, fail
        await prisma.priorityQueueJob.update({
          where: { emailJobId },
          data: {
            status: "FAILED",
            statusMessage: "Max retries exceeded",
          },
        });
        
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: { status: "FAILED", error: "Priority Mail: Max retries exceeded" },
        });

        // Trigger completion check
        await checkCampaignCompletion(emailJob.campaignId);
      }
      
      return;
    }

    // Send the email (call existing email worker logic)
    // Pass attemptsMade so the retry claim logic works correctly
    await processEmailJob({
      data: { emailJobId },
      attemptsMade: priorityRecord.retryCount,
    } as any);

    // Fetch the email job to verify final status
    const finalEmailJob = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
    });

    if (finalEmailJob?.status === "SENT") {
      // Success - update quota
      await incrementPriorityQuota(userId);
      await incrementDomainRate(recipientDomain);

      // Update priority record
      await prisma.priorityQueueJob.update({
        where: { emailJobId },
        data: { status: "SENT", statusMessage: "Sent successfully" },
      });

      logger.info(`[PRIORITY] Email ${emailJobId} sent successfully`);
    } else if (finalEmailJob?.status === "FAILED") {
      // Permanent failure in email worker
      await prisma.priorityQueueJob.update({
        where: { emailJobId },
        data: { 
          status: "FAILED", 
          statusMessage: finalEmailJob.error || "Email delivery failed" 
        },
      });
      logger.error(`[PRIORITY] Email ${emailJobId} failed: ${finalEmailJob.error}`);
    } else {
      // Status might be PENDING or SENDING (if it was throttled or something else)
      // We'll treat this as a failure for the priority queue attempt and let the catch block handle retry
      throw new Error(`Email delivery not completed (status: ${finalEmailJob?.status || "unknown"})`);
    }
  } catch (error: any) {
    logger.error({ error }, `[PRIORITY] Error processing ${emailJobId}`);
    
    const retryCount = priorityRecord.retryCount + 1;
    
    if (shouldRetry(retryCount)) {
      const delayMs = calculateRetryDelay(retryCount);
      
      await prisma.priorityQueueJob.update({
        where: { emailJobId },
        data: {
          retryCount,
          statusMessage: `Error: ${error.message}, retrying...`,
        },
      });

      // Re-queue
      await priorityQueue.add(
        "send-priority-email",
        { emailJobId, userId },
        { jobId: `priority-${emailJobId}-retry-${crypto.randomUUID()}`, delay: delayMs }
      );
    } else {
      await prisma.priorityQueueJob.update({
        where: { emailJobId },
        data: {
          status: "FAILED",
          statusMessage: error.message,
        },
      });

      // Trigger completion check
      const jobRecord = await prisma.emailJob.findUnique({
        where: { id: emailJobId },
        select: { campaignId: true }
      });
      if (jobRecord) {
        await checkCampaignCompletion(jobRecord.campaignId);
      }
    }
  }
}

/**
 * Update priority queue job status
 */
async function updatePriorityStatus(
  emailJobId: string,
  status: "PRIORITY_PENDING" | "PRIORITY_SENDING" | "SENT" | "FAILED",
  message: string
): Promise<void> {
  await prisma.priorityQueueJob.update({
    where: { emailJobId },
    data: {
      status,
      statusMessage: message,
      updatedAt: new Date(),
    },
  });
}

/**
 * Priority Email Worker
 */
export const priorityWorker = new Worker(
  PRIORITY_QUEUE_NAME,
  processPriorityJob,
  {
    connection: redisConnection,
    // Lower concurrency for priority (more thorough processing)
    concurrency: 2,
    stalledInterval: 90000, // Longer stall detection
    lockDuration: 180000, // 3 minute lock
    limiter: {
      max: 1,
      duration: 2000,
    },
  }
);

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`[PRIORITY] Received ${signal}, shutting down...`);
  await priorityWorker.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

logger.info("[PRIORITY] Priority email worker started");

export default {};
