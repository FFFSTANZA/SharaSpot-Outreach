import dotenv from "dotenv";
import path from "path";

// Explicitly load .env from server directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import crypto from "crypto";
import { prisma } from "../config/prisma";
import { emailQueue } from "../queues/emailQueue";
import { priorityQueue, PRIORITY_QUEUE_NAME } from "../queues/priorityQueue";
import { inboxQueue } from "../queues/inboxQueue";
import { processSchedulerJob } from "./sequenceScheduler";
import { autoResumePausedCampaigns } from "./autoResumeJob";
import { processReplyDetectionJob, startIdleSessions, stopIdleSessions, performInitialCatchupScan } from "./replyDetector";
import { startTrackingBuffer, stopTrackingBuffer } from "../controllers/trackingControllers";
import { pruneOldTrackingEvents } from "./trackingPruner";
import { aggregateAnalytics, ensureAnalyticsUpToDate } from "./analyticsAggregator";
import { processInboxSyncJob } from "./inboxWorker";
import { sysLog } from "../utils/systemLogger";
import { checkAndCompleteCampaign } from "../utils/campaignCompletion";
import { Queue, Worker, Job } from "bullmq";
import { redis } from "../config/redis";
import os from "os";
import { logger } from "../utils/logger";
import { SubscriptionStatus } from "@prisma/client";
import { PREMIUM_CACHE_PREFIX } from "../config/subscription";

type SmtpAcceptedMarker = {
  sentAt?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
};

async function recoverSmtpAcceptedJob(job: { id: string; campaignId: string }): Promise<boolean> {
  const markerKey = `emailJob:smtp_accepted:${job.id}`;
  const rawMarker = await redis.get(markerKey);
  if (!rawMarker) return false;

  let marker: SmtpAcceptedMarker = {};
  try {
    marker = JSON.parse(rawMarker) as SmtpAcceptedMarker;
  } catch (err) {
    logger.error({ err, emailJobId: job.id }, "Invalid SMTP accepted marker");
  }

  const sentAt = marker.sentAt && !Number.isNaN(new Date(marker.sentAt).getTime())
    ? new Date(marker.sentAt)
    : new Date();

  const result = await prisma.emailJob.updateMany({
    where: { id: job.id, status: "SENDING" },
    data: {
      status: "SENT",
      sentAt,
      ...(marker.messageId ? { messageId: marker.messageId } : {}),
      ...(marker.inReplyTo ? { inReplyTo: marker.inReplyTo } : {}),
      ...(marker.references ? { references: marker.references } : {}),
    },
  });

  if (result.count > 0) {
    logger.warn({ emailJobId: job.id }, "Recovered SMTP-accepted SENDING job as SENT");
    await checkAndCompleteCampaign(job.campaignId);
  }

  return true;
}


logger.info(`[SHARASPOT-WORKER] TRACKING_BASE_URL: ${process.env.TRACKING_BASE_URL || "NOT SET - tracking will be disabled!"}`);
logger.info(`[SHARASPOT-WORKER] NODE_ENV: ${process.env.NODE_ENV}`);

/**
 * Startup Recovery Sweep
 * 
 * WHY: If the worker process crashes while processing a job, that job's
 * status will be stuck in SENDING forever — it was claimed but never
 * completed. This sweep runs BEFORE the worker starts accepting new jobs,
 * resetting all orphaned SENDING jobs back to PENDING so BullMQ can
 * re-process them.
 * 
 * This is safe to run on every startup because:
 * - If there are no SENDING jobs, it's a no-op
 * - The updateMany WHERE clause ensures we only reset SENDING jobs
 * - Re-enqueuing with delay 0 means they're picked up immediately
 */
async function recoverOrphanedJobs(): Promise<Set<string>> {
  const orphanedJobs = await prisma.emailJob.findMany({
    where: { status: "SENDING" },
    select: { id: true, campaignId: true },
  });

  if (orphanedJobs.length === 0) {
    logger.info("📋 Startup recovery: No orphaned SENDING jobs found");
    return new Set();
  }

  logger.info(`📋 Startup recovery: Found ${orphanedJobs.length} orphaned SENDING jobs`);
  const recoveredIds = new Set<string>();

  for (const job of orphanedJobs) {
    if (await recoverSmtpAcceptedJob(job)) continue;

    await prisma.emailJob.updateMany({
      where: { id: job.id, status: "SENDING" },
      data: { status: "PENDING" },
    });

    recoveredIds.add(job.id);

    await emailQueue.add(
      "send-email",
      { emailJobId: job.id },
      {
        jobId: `${job.id}-recovery-${crypto.randomUUID()}`,
        delay: 0,
      },
    );
  }

  logger.info(`✅ Startup recovery: Recovered ${orphanedJobs.length} orphaned jobs (${recoveredIds.size} re-enqueued)`);
  return recoveredIds;
}

/**
 * PENDING Job Sync
 * 
 * WHY: If the API process crashes immediately after creating a job in the DB
 * but before adding it to BullMQ, the job will be stuck in PENDING forever.
 * This syncs all PENDING jobs from the DB into the queue on worker startup.
 * 
 * WHY excludeIds: recoverOrphanedJobs() already re-enqueued these — skipping
 * them here prevents a startup double-enqueue where a recovered job gets
 * queued twice (once by recovery, once by the blanket PENDING sync).
 */
async function syncPendingJobs(excludeIds: Set<string> = new Set()): Promise<void> {
  const pendingJobs = await prisma.emailJob.findMany({
    where: { status: "PENDING" },
    select: { id: true, scheduledAt: true },
  });

  const filtered = excludeIds.size > 0
    ? pendingJobs.filter((j) => !excludeIds.has(j.id))
    : pendingJobs;

  if (filtered.length === 0) {
    if (pendingJobs.length > 0) {
      logger.info(`📋 Pending sync: All ${pendingJobs.length} PENDING jobs were already recovered, skipping`);
    } else {
      logger.info("📋 Pending sync: No PENDING jobs to enqueue");
    }
    return;
  }

  logger.info(`📋 Pending sync: Enqueuing ${filtered.length} jobs${excludeIds.size > 0 ? ` (skipping ${pendingJobs.length - filtered.length} already recovered)` : ''}`);

  for (const job of filtered) {
    const delay = Math.max(0, new Date(job.scheduledAt).getTime() - Date.now());

    await emailQueue.add(
      "send-email",
      { emailJobId: job.id },
      {
        jobId: `${job.id}-startup-sync-${crypto.randomUUID()}`,
        delay,
      },
    );
  }

  logger.info(`✅ Pending sync: Enqueued ${filtered.length} jobs`);
}


/**
 * Periodic Stale-Job Sweep
 *
 * WHY: If an SMTP call hangs or the worker encounters an unhandled error
 * mid-send, a job can remain stuck in SENDING indefinitely — even while
 * the worker process is still alive. The startup sweep only catches these
 * on restart. This periodic sweep finds jobs that have been in SENDING
 * for longer than STALE_SENDING_THRESHOLD_MS (default 5 min) and resets
 * them back to PENDING so they get retried automatically.
 */
const STALE_SENDING_THRESHOLD_MS = parseInt(
  process.env.STALE_SENDING_THRESHOLD_MS || "300000", // 5 minutes
  10,
);
const STALE_SWEEP_INTERVAL_MS = parseInt(
  process.env.STALE_SWEEP_INTERVAL_MS || "120000", // 2 minutes
  10,
);

async function sweepStaleSendingJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_SENDING_THRESHOLD_MS);

  const staleJobs = await prisma.emailJob.findMany({
    where: {
      status: "SENDING",
      updatedAt: { lt: cutoff },
    },
    select: { id: true, campaignId: true },
  });

  if (staleJobs.length === 0) return;

    logger.info(`🔍 Stale sweep: Found ${staleJobs.length} SENDING jobs older than ${STALE_SENDING_THRESHOLD_MS / 1000}s`);

  for (const job of staleJobs) {
    if (await recoverSmtpAcceptedJob(job)) continue;

    await prisma.emailJob.updateMany({
      where: { id: job.id, status: "SENDING" },
      data: { status: "PENDING" },
    });

    await emailQueue.add(
      "send-email",
      { emailJobId: job.id },
      {
        jobId: `${job.id}-stale-recovery-${crypto.randomUUID()}`,
        delay: 0,
      },
    );
  }

    logger.info(`✅ Stale sweep: Recovered ${staleJobs.length} jobs`);
}

/**
 * Priority Queue Recovery Sweep
 * 
 * WHY: Similar to the email queue, priority queue jobs can be orphaned
 * if the worker crashes while processing. This sweeps PRIORITY_SENDING
 * jobs and resets them to PRIORITY_PENDING for reprocessing.
 */
async function recoverOrphanedPriorityJobs(): Promise<void> {
  const orphanedJobs = await prisma.priorityQueueJob.findMany({
    where: { status: "PRIORITY_SENDING" },
    select: { emailJobId: true, userId: true },
  });

  if (orphanedJobs.length === 0) {
    logger.info("📋 Priority recovery: No orphaned PRIORITY_SENDING jobs found");
    return;
  }

    logger.info(`📋 Priority recovery: Found ${orphanedJobs.length} orphaned PRIORITY_SENDING jobs`);

  for (const job of orphanedJobs) {
    await prisma.priorityQueueJob.updateMany({
      where: { emailJobId: job.emailJobId, status: "PRIORITY_SENDING" },
      data: { status: "PRIORITY_PENDING", statusMessage: "Recovered from crash" },
    });

    await priorityQueue.add(
      "send-priority-email",
      { emailJobId: job.emailJobId, userId: job.userId },
      {
        jobId: `priority-${job.emailJobId}-recovery-${crypto.randomUUID()}`,
        delay: 0,
      },
    );
  }

    logger.info(`✅ Priority recovery: Recovered ${orphanedJobs.length} orphaned priority jobs`);
}

/**
 * Periodic Stale Priority Job Sweep
 * 
 * WHY: Jobs can get stuck in PRIORITY_SENDING state if SMTP calls hang
 * or unhandled errors occur. This periodic sweep finds jobs that have
 * been in PRIORITY_SENDING for longer than the threshold and resets them.
 */
const PRIORITY_STALE_THRESHOLD_MS = parseInt(
  process.env.PRIORITY_STALE_THRESHOLD_MS || "300000", // 5 minutes
  10,
);

async function sweepStalePriorityJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - PRIORITY_STALE_THRESHOLD_MS);

  const staleJobs = await prisma.priorityQueueJob.findMany({
    where: {
      status: "PRIORITY_SENDING",
      updatedAt: { lt: cutoff },
    },
    select: { emailJobId: true, userId: true },
  });

  if (staleJobs.length === 0) return;

    logger.info(`🔍 Priority stale sweep: Found ${staleJobs.length} PRIORITY_SENDING jobs older than ${PRIORITY_STALE_THRESHOLD_MS / 1000}s`);

  for (const job of staleJobs) {
    await prisma.priorityQueueJob.updateMany({
      where: { emailJobId: job.emailJobId, status: "PRIORITY_SENDING" },
      data: { status: "PRIORITY_PENDING", statusMessage: "Recovered from stale state" },
    });

    await priorityQueue.add(
      "send-priority-email",
      { emailJobId: job.emailJobId, userId: job.userId },
      {
        jobId: `priority-${job.emailJobId}-stale-recovery-${crypto.randomUUID()}`,
        delay: 0,
      },
    );
  }

    logger.info(`✅ Priority stale sweep: Recovered ${staleJobs.length} jobs`);
}

/**
 * Stuck Campaign Cleanup Sweep
 * 
 * WHY: This is the failsafe for the "stuck in Sending" bug. 
 * If a worker crashes at the exact moment a campaign finishes, or if a
 * sequence scheduler tick is missed, the campaign stays in SENDING forever.
 * This sweep finds all SENDING campaigns and checks if they SHOULD be COMPLETED.
 */
async function sweepStuckCampaigns(): Promise<void> {
  const stuckCampaigns = await prisma.emailCampaign.findMany({
    where: { status: { in: ["SENDING", "SCHEDULED"] } },
    select: { id: true },
  });

  if (stuckCampaigns.length === 0) return;

  for (const campaign of stuckCampaigns) {
    try {
      await checkAndCompleteCampaign(campaign.id);
    } catch (err) {
      logger.error({ err }, `Error sweeping stuck campaign ${campaign.id}`);
    }
  }
}


/**
 * Subscription Expiry Sweep
 *
 * WHY: When a subscription's currentPeriodEnd passes, the DB row stays at
 * ACTIVE or CANCELLED status forever. There's no webhook for silent expiry,
 * and Dodo may not send subscription.expired reliably. This sweep transitions
 * overdue subscriptions to EXPIRED so admin metrics, queries, and downstream
 * logic see the correct state. It also invalidates premium caches for the
 * affected users and their inherited org members.
 */
async function processExpiredSubscriptions(): Promise<void> {
  const now = new Date();

  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED] },
      currentPeriodEnd: { lte: now },
    },
    select: { id: true, userId: true, dodoSubscriptionId: true },
  });

  if (expiredSubs.length === 0) return;

  logger.info(`💳 Expiry sweep: Found ${expiredSubs.length} expired subscriptions`);

  const userIds = expiredSubs.map((s) => s.userId);

  await prisma.subscription.updateMany({
    where: {
      id: { in: expiredSubs.map((s) => s.id) },
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED] },
      currentPeriodEnd: { lte: now },
    },
    data: { status: SubscriptionStatus.EXPIRED },
  });

  // Invalidate premium cache for each affected user
  // and all members of orgs they own
  const cacheKeys = new Set<string>();
  for (const userId of userIds) {
    cacheKeys.add(`${PREMIUM_CACHE_PREFIX}${userId}`);
  }

  const ownedOrgs = await prisma.organization.findMany({
    where: { ownerId: { in: userIds } },
    select: {
      members: { select: { userId: true } },
    },
  });

  for (const org of ownedOrgs) {
    for (const member of org.members) {
      cacheKeys.add(`${PREMIUM_CACHE_PREFIX}${member.userId}`);
    }
  }

  await Promise.all(
    Array.from(cacheKeys).map((key) => redis.del(key).catch(() => {})),
  );

  logger.info(`✅ Expiry sweep: Expired ${expiredSubs.length} subs, invalidated ${cacheKeys.size} caches`);
}

async function checkRedisHealth(): Promise<boolean> {
  try {
    const ping = await redis.ping();
    if (ping !== "PONG") throw new Error("Redis PING failed");
    logger.info("📡 Redis health check: Connection verified");
    return true;
  } catch (err) {
    logger.error("❌ Redis health check: Failed to connect to Redis. Check REDIS_URL and firewall.");
    return false;
  }
}

async function checkPrismaHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("📡 Prisma health check: Connection verified");
    return true;
  } catch (err) {
    logger.error({ err }, "❌ Database health check failed");
    return false;
  }
}


async function performStartupSelfHealing(): Promise<void> {
  logger.info("\n--- SHARASPOT WORKER SELF-HEALING BOOT ---");
  await sysLog.info("INFRASTRUCTURE", "Worker self-healing boot sequence started.");

  const redisHealthy = await checkRedisHealth();
  const dbHealthy = await checkPrismaHealth();

  if (!redisHealthy || !dbHealthy) {
    const errorMsg = `Worker startup aborted: ${!redisHealthy ? "Redis DOWN" : ""} ${!dbHealthy ? "Postgres DOWN" : ""}`;
    logger.error(`[CRITICAL] ${errorMsg}`);
    await sysLog.critical("INFRASTRUCTURE", errorMsg);
    process.exit(1);
  }

  const recoveredIds = await recoverOrphanedJobs();
  await recoverOrphanedPriorityJobs();
  await syncPendingJobs(recoveredIds);
  await sweepStuckCampaigns();

  try {
    await performInitialCatchupScan();
  } catch (err: any) {
    await sysLog.error("INFRASTRUCTURE", `IMAP catch-up failed: ${err.message}`);
  }

  try {
    await ensureAnalyticsUpToDate();
  } catch (err: any) {
    await sysLog.warn("INFRASTRUCTURE", `Startup analytics catch-up failed: ${err.message}`);
  }

  logger.info("--- SELF-HEALING BOOT COMPLETE ---\n");
  await sysLog.info("INFRASTRUCTURE", "Worker self-healing boot sequence completed.");
}

async function main(): Promise<void> {
  await performStartupSelfHealing();

  // Import the worker modules AFTER recovery completes.
  // This ensures orphaned jobs are reset before workers start polling.
  await import("./emailWorker");

  // Start the priority email worker
  await import("./priorityEmailWorker");

  logger.info("📨 Email worker started and accepting jobs");
  logger.info("⭐ Priority email worker started and accepting jobs");

  // Start sequence scheduler as a repeatable job
  const schedulerInterval = parseInt(process.env.SEQUENCE_SCHEDULER_INTERVAL_MS || "900000", 10); // 15 min default
  const schedulerQueue = new Queue("sequence-scheduler", { connection: redis });

  // Remove any existing repeatable jobs to avoid duplicates on restart
  const existing = await schedulerQueue.getRepeatableJobs();
  for (const job of existing) {
    await schedulerQueue.removeRepeatableByKey(job.key);
  }

  await schedulerQueue.add("run-scheduler", {}, {
    repeat: { every: schedulerInterval },
  });

  new Worker("sequence-scheduler", async () => {
    await processSchedulerJob();
  }, { connection: redis });

  logger.info(`📅 Sequence scheduler started (interval: ${schedulerInterval}ms)`);

  // Start auto-resume job for paused campaigns (configurable interval, default: every 1 hour)
  const autoResumeInterval = parseInt(process.env.AUTO_RESUME_INTERVAL_MS || "3600000", 10);
  const autoResumeQueue = new Queue("auto-resume", { connection: redis });

  const existingAutoResume = await autoResumeQueue.getRepeatableJobs();
  for (const job of existingAutoResume) {
    await autoResumeQueue.removeRepeatableByKey(job.key);
  }

  await autoResumeQueue.add("resume-paused-campaigns", {}, {
    repeat: { every: autoResumeInterval },
  });

  new Worker("auto-resume", async () => {
    await autoResumePausedCampaigns();
  }, { connection: redis });

  logger.info(`🔄 Auto-resume scheduler started (interval: ${autoResumeInterval}ms)`);

  // Start reply detection job (configurable interval, default: every 5 minutes)
  const replyCheckInterval = parseInt(process.env.REPLY_CHECK_INTERVAL_MS || "300000", 10);
  const replyQueue = new Queue("reply-detector", { connection: redis });

  const existingReplyJobs = await replyQueue.getRepeatableJobs();
  for (const job of existingReplyJobs) {
    await replyQueue.removeRepeatableByKey(job.key);
  }

  await replyQueue.add("scan-replies", {}, {
    repeat: { every: replyCheckInterval },
  });

  new Worker("reply-detector", async () => {
    await processReplyDetectionJob();
  }, { connection: redis });

  logger.info(`📬 Reply detector started (interval: ${replyCheckInterval}ms)`);

  // Start IMAP IDLE sessions for real-time push-based reply detection
  startIdleSessions();

  // Start Redis-buffered tracking event batch insert
  startTrackingBuffer();

  // Start tracking event pruning (daily at startup, then every 24h)
  pruneOldTrackingEvents().catch((err) =>
    logger.error({ err }, "❌ Tracking prune error"),
  );
  setInterval(() => {
    pruneOldTrackingEvents().catch((err) =>
      logger.error({ err }, "❌ Tracking prune error"),
    );
  }, 86400000);

  // Start periodic stale-SENDING sweep
  setInterval(() => {
    sweepStaleSendingJobs().catch((err) =>
      logger.error({ err }, "❌ Stale sweep error"),
    );
  }, STALE_SWEEP_INTERVAL_MS);

  logger.info(`🔍 Stale-SENDING sweep started (interval: ${STALE_SWEEP_INTERVAL_MS / 1000}s, threshold: ${STALE_SENDING_THRESHOLD_MS / 1000}s)`);

  // Start periodic stale-PRIORITY_SENDING sweep
  setInterval(() => {
    sweepStalePriorityJobs().catch((err) =>
      logger.error({ err }, "❌ Priority stale sweep error"),
    );
  }, STALE_SWEEP_INTERVAL_MS);

  logger.info(`🔍 Priority stale sweep started (interval: ${STALE_SWEEP_INTERVAL_MS / 1000}s, threshold: ${PRIORITY_STALE_THRESHOLD_MS / 1000}s)`);

  // Start periodic stuck-campaign sweep (every 5 minutes)
  const STUCK_CAMPAIGN_INTERVAL_MS = 300000;
  setInterval(() => {
    sweepStuckCampaigns().catch((err) =>
      logger.error({ err }, "❌ Stuck campaign sweep error"),
    );
  }, STUCK_CAMPAIGN_INTERVAL_MS);

  logger.info(`🧹 Stuck-campaign sweep started (interval: ${STUCK_CAMPAIGN_INTERVAL_MS / 1000}s)`);

  // Start subscription expiry sweep (every hour)
  const SUBSCRIPTION_EXPIRY_INTERVAL_MS = parseInt(
    process.env.SUBSCRIPTION_EXPIRY_INTERVAL_MS || "3600000", // 1 hour default
    10,
  );
  setInterval(() => {
    processExpiredSubscriptions().catch((err) =>
      logger.error({ err }, "❌ Subscription expiry sweep error"),
    );
  }, SUBSCRIPTION_EXPIRY_INTERVAL_MS);
  logger.info(`💳 Subscription expiry sweep started (interval: ${SUBSCRIPTION_EXPIRY_INTERVAL_MS / 1000}s)`);

  // Start analytics aggregation (every 30 minutes)
  const analyticsInterval = parseInt(process.env.ANALYTICS_AGGREGATION_INTERVAL_MS || "1800000", 10);
  const analyticsQueue = new Queue("analytics-aggregator", { connection: redis });

  const existingAnalytics = await analyticsQueue.getRepeatableJobs();
  for (const job of existingAnalytics) {
    await analyticsQueue.removeRepeatableByKey(job.key);
  }

  await analyticsQueue.add("aggregate-stats", {}, {
    repeat: { every: analyticsInterval },
  });

  new Worker("analytics-aggregator", async () => {
    await aggregateAnalytics();
  }, { connection: redis });

  // Ensure analytics are up-to-date at startup
  ensureAnalyticsUpToDate().catch(err => logger.error({ err }, "❌ Startup analytics error"));

  logger.info(`📊 Analytics aggregator started (interval: ${analyticsInterval}ms)`);

  // Start worker heartbeat (every 30 seconds)
  // WHY: Allows the API to monitor worker health and warn if background processing is down.
  const HEARTBEAT_INTERVAL_MS = 30000;
  const updateHeartbeat = async () => {
    try {
      const stats = {
        timestamp: Date.now(),
        memory: process.memoryUsage().heapUsed,
        uptime: process.uptime(),
        load: os.loadavg()[0],
      };
      await redis.set("worker:last_heartbeat", Date.now().toString(), "EX", 120); // 2 minute TTL
      await redis.set("worker:stats", JSON.stringify(stats), "EX", 120);
    } catch (err) {
      logger.error({ err }, "❌ Heartbeat error");
    }
  };
  await updateHeartbeat();
  setInterval(updateHeartbeat, HEARTBEAT_INTERVAL_MS);
  logger.info("💓 Worker heartbeat started (with telemetry)");

  new Worker(inboxQueue.name, async (job: Job) => {
    await processInboxSyncJob(job);
  }, { connection: redis, concurrency: 2 });

  logger.info("📥 Inbox sync worker started");

  setInterval(async () => {
    const senders = await prisma.sender.findMany({
      where: { isVerified: true },
      select: { id: true },
    });

    for (const sender of senders) {
      await inboxQueue.add("sync-inbox", { senderId: sender.id }).catch(() => { });
    }
  }, 300000);


  // Graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, stopping services...");
    stopIdleSessions();
    stopTrackingBuffer();
  });
  process.on("SIGINT", () => {
    logger.info("Received SIGINT, stopping services...");
    stopIdleSessions();
    stopTrackingBuffer();
  });
}

main().catch((err) => {
  logger.error({ err }, "❌ Failed to start email worker");
  process.exit(1);
});
