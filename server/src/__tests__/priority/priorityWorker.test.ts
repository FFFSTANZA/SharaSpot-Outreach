/**
 * Priority Worker Tests
 * 
 * Tests for priority job processing flow, fallback logic, and status updates
 */

process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { Job } from "bullmq";
import { prisma } from "../../config/prisma";
import { priorityQueue } from "../../queues/priorityQueue";
import { processPriorityJob } from "../../worker/priorityEmailWorker";

// Mock dependencies
jest.mock("bullmq", () => ({
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Job: jest.fn(),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue(undefined),
    getJob: jest.fn().mockResolvedValue(null),
    getWaitingCount: jest.fn().mockResolvedValue(0),
    getActiveCount: jest.fn().mockResolvedValue(0),
    getCompletedCount: jest.fn().mockResolvedValue(0),
    getFailedCount: jest.fn().mockResolvedValue(0),
  })),
}));

jest.mock("../../config/prisma", () => ({
  prisma: {
    priorityQueueJob: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue(undefined),
    },
    emailJob: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue(undefined),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock("../../config/redis", () => ({
  redisConnection: { host: "localhost", port: 6379, maxRetriesPerRequest: null },
  redis: { quit: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("../../queues/priorityQueue", () => ({
  priorityQueue: {
    add: jest.fn().mockResolvedValue(undefined),
  },
  PRIORITY_QUEUE_NAME: "priority-mail-queue",
  PriorityLevel: { URGENT: 1, HIGH: 2, NORMAL: 3, LOW: 4 },
}));

jest.mock("../../utils/signalCollector", () => ({
  collectSmtpTiming: jest.fn().mockResolvedValue({
    tcpConnectMs: 50,
    greetingDelayMs: 100,
    tlsHandshakeMs: 150,
    mailFromMs: 80,
    rcptToMs: 60,
    dataMs: 120,
    totalMs: 560,
  }),
}));

jest.mock("../../utils/timingEngine", () => ({
  evaluateTiming: jest.fn().mockImplementation((score: number) => {
    if (score < 150) {
      return {
        action: "SEND_IMMEDIATELY" as const,
        reason: "Low congestion",
        suggestedDelayMs: 0,
        statusMessage: "Low congestion detected, sending immediately",
        congestionScore: score,
      };
    }
    return {
      action: "HOLD_AND_RETRY" as const,
      reason: "Medium congestion",
      suggestedDelayMs: 60000,
      statusMessage: "Optimizing delivery...",
      congestionScore: score,
    };
  }),
}));

jest.mock("../../utils/prioritySafetyLimits", () => ({
  performSafetyChecks: jest.fn().mockResolvedValue({ allowed: true }),
  incrementPriorityQuota: jest.fn().mockResolvedValue(undefined),
  incrementDomainRate: jest.fn().mockResolvedValue(undefined),
  getPriorityQuotaStatus: jest.fn().mockResolvedValue({
    used: 10,
    limit: 50,
    remaining: 40,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }),
}));

jest.mock("../../worker/emailWorker", () => ({
  processEmailJob: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/emailThreading", () => ({
  extractDomain: jest.fn((email: string) => email.split("@")[1]),
}));

// Helper to create a fake job
function fakeJob(data: { emailJobId: string; userId: string }): Job {
  return { data } as unknown as Job;
}

describe("Priority Worker Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processPriorityJob", () => {
    it("should fall back to normal processing when no priority record found", async () => {
      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue(null);
      const { processEmailJob } = jest.requireMock("../../worker/emailWorker");

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      expect(processEmailJob).toHaveBeenCalled();
      expect(prisma.priorityQueueJob.update).not.toHaveBeenCalled();
    });

    it("should process priority job successfully with low congestion", async () => {
      const { performSafetyChecks } = jest.requireMock("../../utils/prioritySafetyLimits");
      const { evaluateTiming } = jest.requireMock("../../utils/timingEngine");
      const { processEmailJob } = jest.requireMock("../../worker/emailWorker");
      const { incrementPriorityQuota, incrementDomainRate } = jest.requireMock("../../utils/prioritySafetyLimits");

      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_PENDING",
        retryCount: 0,
      });

      (prisma.emailJob.findUnique as jest.Mock).mockResolvedValue({
        id: "job-1",
        toEmail: "recipient@gmail.com",
        senderId: "sender-1",
        campaignId: "campaign-1",
        campaign: { senderId: "sender-1", sender: { id: "sender-1" } },
        sender: { id: "sender-1" },
      });

      (evaluateTiming as jest.Mock).mockReturnValue({
        action: "SEND_IMMEDIATELY",
        reason: "Low congestion",
        suggestedDelayMs: 0,
        statusMessage: "Low congestion detected, sending immediately",
        congestionScore: 100,
      });

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      // Should update status to PRIORITY_SENDING
      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId: "job-1" },
        data: expect.objectContaining({ status: "PRIORITY_SENDING" }),
      });

      // Should call processEmailJob to actually send
      expect(processEmailJob).toHaveBeenCalled();

      // Should increment quota and domain rate
      expect(incrementPriorityQuota).toHaveBeenCalledWith("user-1");
      expect(incrementDomainRate).toHaveBeenCalledWith("gmail.com");

      // Should update final status to SENT
      expect(prisma.priorityQueueJob.update).toHaveBeenLastCalledWith({
        where: { emailJobId: "job-1" },
        data: { status: "SENT", statusMessage: "Sent successfully" },
      });
    });

    it("should hold and retry on medium congestion", async () => {
      const { evaluateTiming } = jest.requireMock("../../utils/timingEngine");

      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_PENDING",
        retryCount: 0,
      });

      (prisma.emailJob.findUnique as jest.Mock).mockResolvedValue({
        id: "job-1",
        toEmail: "recipient@gmail.com",
        senderId: "sender-1",
        campaignId: "campaign-1",
        campaign: { senderId: "sender-1", sender: { id: "sender-1" } },
        sender: { id: "sender-1" },
      });

      (evaluateTiming as jest.Mock).mockReturnValue({
        action: "HOLD_AND_RETRY",
        reason: "Medium congestion",
        suggestedDelayMs: 60000,
        statusMessage: "Optimizing delivery...",
        congestionScore: 250,
      });

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      // Should update status to PRIORITY_SENDING initially
      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId: "job-1" },
        data: expect.objectContaining({ status: "PRIORITY_SENDING" }),
      });

      // Should requeue with delay (not send)
      expect(priorityQueue.add).toHaveBeenCalledWith(
        "send-priority-email",
        { emailJobId: "job-1", userId: "user-1" },
        expect.objectContaining({ delay: expect.any(Number) })
      );

      // Should NOT call processEmailJob
      const { processEmailJob } = jest.requireMock("../../worker/emailWorker");
      expect(processEmailJob).not.toHaveBeenCalled();
    });

    it("should fail after max retries exceeded", async () => {
      const { evaluateTiming } = jest.requireMock("../../utils/timingEngine");

      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_SENDING",
        retryCount: 2, // Already at max retries
      });

      (prisma.emailJob.findUnique as jest.Mock).mockResolvedValue({
        id: "job-1",
        toEmail: "recipient@gmail.com",
        senderId: "sender-1",
        campaignId: "campaign-1",
        campaign: { senderId: "sender-1", sender: { id: "sender-1" } },
        sender: { id: "sender-1" },
      });

      (evaluateTiming as jest.Mock).mockReturnValue({
        action: "HOLD_AND_RETRY",
        reason: "Medium congestion",
        suggestedDelayMs: 60000,
        statusMessage: "Optimizing delivery...",
        congestionScore: 250,
      });

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      // Should mark as FAILED
      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId: "job-1" },
        data: expect.objectContaining({
          status: "FAILED",
          statusMessage: "Max retries exceeded",
        }),
      });

      expect(prisma.emailJob.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "FAILED", error: "Priority Mail: Max retries exceeded" },
      });
    });

    it("should handle safety check failure with retry", async () => {
      const { performSafetyChecks } = jest.requireMock("../../utils/prioritySafetyLimits");

      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_PENDING",
        retryCount: 0,
      });

      (performSafetyChecks as jest.Mock).mockResolvedValue({
        allowed: false,
        reason: "Daily priority quota exceeded",
        retryAfterMs: 3600000,
      });

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      // Should update status to PRIORITY_PENDING with reason
      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId: "job-1" },
        data: expect.objectContaining({
          status: "PRIORITY_PENDING",
          statusMessage: "Daily priority quota exceeded",
        }),
      });

      // Should requeue with delay
      expect(priorityQueue.add).toHaveBeenCalledWith(
        "send-priority-email",
        { emailJobId: "job-1", userId: "user-1" },
        expect.objectContaining({ delay: 3600000 })
      );
    });

    it("should handle errors with retry logic", async () => {
      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_PENDING",
        retryCount: 0,
      });

      (prisma.emailJob.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      // Should update with error and retry
      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId: "job-1" },
        data: expect.objectContaining({
          retryCount: 1,
          statusMessage: expect.stringContaining("Error:"),
        }),
      });

      // Should requeue
      expect(priorityQueue.add).toHaveBeenCalled();
    });

    it("should fail after max error retries", async () => {
      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_SENDING",
        retryCount: 2, // At max retries
      });

      (prisma.emailJob.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      // Should mark as FAILED
      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId: "job-1" },
        data: expect.objectContaining({
          status: "FAILED",
          statusMessage: "Database error",
        }),
      });
    });

    it("should handle missing email job gracefully", async () => {
      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_PENDING",
        retryCount: 0,
      });

      (prisma.emailJob.findUnique as jest.Mock).mockResolvedValue(null);

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      
      // Error is caught and handled via retry logic
      await processPriorityJob(job);

      // Should update with error and schedule retry
      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId: "job-1" },
        data: expect.objectContaining({
          retryCount: 1,
          statusMessage: expect.stringContaining("Email job not found"),
        }),
      });

      // Should requeue for retry
      expect(priorityQueue.add).toHaveBeenCalled();
    });

    it("should use campaign senderId when job senderId is null", async () => {
      const { evaluateTiming } = jest.requireMock("../../utils/timingEngine");
      const { performSafetyChecks } = jest.requireMock("../../utils/prioritySafetyLimits");

      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId: "job-1",
        userId: "user-1",
        status: "PRIORITY_PENDING",
        retryCount: 0,
      });

      (prisma.emailJob.findUnique as jest.Mock).mockResolvedValue({
        id: "job-1",
        toEmail: "recipient@gmail.com",
        senderId: null, // No sender on job
        campaignId: "campaign-1",
        campaign: { senderId: "campaign-sender-1", sender: { id: "campaign-sender-1" } },
        sender: null,
      });

      (evaluateTiming as jest.Mock).mockReturnValue({
        action: "SEND_IMMEDIATELY",
        reason: "Low congestion",
        suggestedDelayMs: 0,
        statusMessage: "Low congestion detected, sending immediately",
        congestionScore: 100,
      });

      const job = fakeJob({ emailJobId: "job-1", userId: "user-1" });
      await processPriorityJob(job);

      // Should use campaign senderId for safety checks
      expect(performSafetyChecks).toHaveBeenCalledWith("user-1", "campaign-sender-1", "gmail.com");
    });
  });
});
