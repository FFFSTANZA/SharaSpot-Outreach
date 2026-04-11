import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const PRIORITY_QUEUE_NAME = "priority-mail-queue";

/**
 * BullMQ Priority Mail queue
 * 
 * Higher priority than regular email queue
 * Uses separate queue for priority-optimized delivery
 * 
 * Configuration:
 * - Higher priority (lower number = higher priority)
 * - Remove completed jobs faster (1 hour instead of 24)
 * - Fewer max failures before manual intervention
 * - Special job options for priority sends
 */
export const priorityQueue = new Queue(PRIORITY_QUEUE_NAME, {
  connection: redisConnection,

  defaultJobOptions: {
    // Remove completed after 1 hour for priority (faster cleanup)
    removeOnComplete: { age: 3600, count: 500 },
    // Keep failed jobs for 2 days for investigation
    removeOnFail: { age: 172800, count: 200 },
    // Priority jobs have their own retry logic
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 60000, // 1 minute initial delay
    },
  },
});

/**
 * Priority levels for jobs
 */
export enum PriorityLevel {
  URGENT = 1,      // Very high priority
  HIGH = 2,          // High priority  
  NORMAL = 3,        // Normal priority (default)
  LOW = 4,           // Low priority
}

/**
 * Get BullMQ priority from our priority level
 */
export function getBullMqPriority(level: PriorityLevel): number {
  // BullMQ: lower = higher priority
  // Our PriorityLevel already matches this
  return level;
}

/**
 * Add job to priority queue
 */
export async function addPriorityJob(
  emailJobId: string,
  userId: string,
  priority: PriorityLevel = PriorityLevel.NORMAL,
  delay?: number
): Promise<void> {
  await priorityQueue.add(
    "send-priority-email",
    { emailJobId, userId },
    {
      priority: getBullMqPriority(priority),
      delay: delay ?? 0,
      jobId: `priority-${emailJobId}`,
    }
  );
}

/**
 * Remove job from priority queue
 */
export async function removePriorityJob(emailJobId: string): Promise<void> {
  const job = await priorityQueue.getJob(`priority-${emailJobId}`);
  if (job) {
    await job.remove();
  }
}

/**
 * Get queue statistics
 */
export async function getPriorityQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  const [waiting, active, completed, failed] = await Promise.all([
    priorityQueue.getWaitingCount(),
    priorityQueue.getActiveCount(),
    priorityQueue.getCompletedCount(),
    priorityQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}