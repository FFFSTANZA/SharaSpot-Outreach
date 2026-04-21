import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const INBOX_QUEUE_NAME = "inbox-queue";

export const inboxQueue = new Queue(INBOX_QUEUE_NAME, {
  connection: redisConnection,

  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86400, count: 100 },
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 30000,
    },
  },
});