import { prisma } from "../config/prisma";
import { syncInboxForSender } from "../utils/inboxService";
import { Job } from "bullmq";
import { inboxQueue } from "../queues/inboxQueue";

const INBOX_SYNC_INTERVAL_MS = parseInt(
  process.env.INBOX_SYNC_INTERVAL_MS || "300000",
  10,
);

interface InboxSyncJobData {
  senderId: string;
}

export async function processInboxSyncJob(job: Job<InboxSyncJobData>): Promise<void> {
  const { senderId } = job.data;

  // ---------------------------------------------------------------------------
  // Premium Enforcement logic — prevent sync if subscription/trial expired
  // ---------------------------------------------------------------------------
  const senderRecord = await prisma.sender.findUnique({
    where: { id: senderId },
    select: { userId: true }
  });

  if (senderRecord) {
    const { requirePremium } = await import("../utils/premiumCheck");
    const premiumCheck = await requirePremium(senderRecord.userId, "Inbox Sync");
    if (!premiumCheck.allowed) {
      console.warn(`Premium check failed for user ${senderRecord.userId}. Skipping inbox sync for sender ${senderId}.`);
      return;
    }
  }

  console.log(`[InboxWorker] Starting sync for sender: ${senderId}`);

  const syncJobRecord = await prisma.inboxSyncJob.create({
    data: {
      senderId,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const result = await syncInboxForSender(senderId);

    await prisma.inboxSyncJob.update({
      where: { id: syncJobRecord.id },
      data: {
        status: result.errors.length > 0 ? "FAILED" : "COMPLETED",
        messagesProcessed: result.synced,
        completedAt: new Date(),
        error: result.errors.length > 0 ? result.errors.join("; ") : null,
      },
    });

    console.log(`[InboxWorker] Synced ${result.synced} emails for sender: ${senderId}`);
  } catch (err: any) {
    await prisma.inboxSyncJob.update({
      where: { id: syncJobRecord.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: err.message || "Unknown error",
      },
    });

    console.error(`[InboxWorker] Sync failed for sender ${senderId}:`, err);
    throw err;
  }
}

export async function scheduleInboxSync(senderId: string): Promise<void> {
  await inboxQueue.add(
    "sync-inbox",
    { senderId },
    {
      repeat: {
        every: INBOX_SYNC_INTERVAL_MS,
      },
    }
  );
}

export async function cancelInboxSync(senderId: string): Promise<void> {
  const jobs = await inboxQueue.getJobs(["waiting", "active", "delayed"]);

  for (const job of jobs) {
    if (job.data.senderId === senderId) {
      await job.remove();
    }
  }
}

export async function syncAllInboxes(): Promise<void> {
  const senders = await prisma.sender.findMany({
    where: { isVerified: true },
    select: { id: true },
  });

  for (const sender of senders) {
    await inboxQueue.add(
      "sync-inbox",
      { senderId: sender.id },
      {
        jobId: `sync-${sender.id}-${Date.now()}`,
      }
    );
  }

  console.log(`[InboxWorker] Queued inbox sync for ${senders.length} senders`);
}