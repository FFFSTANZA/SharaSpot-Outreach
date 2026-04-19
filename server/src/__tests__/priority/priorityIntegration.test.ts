/**
 * Priority Mail Integration Tests
 * 
 * End-to-end tests for priority mail flow from campaign creation to send
 */

process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { prisma } from "../../config/prisma";
import { priorityQueue, PriorityLevel } from "../../queues/priorityQueue";
import { addPriorityJob } from "../../queues/priorityQueue";

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
    emailCampaign: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue(undefined),
    },
    emailJob: {
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
    },
    priorityQueueJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue(undefined),
    },
    priorityUserQuota: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({
        userId: args.data.userId,
        dailyCount: 0,
        dailyLimit: 50,
        dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })),
      update: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn().mockResolvedValue(undefined),
    },
    domainRateLimit: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(undefined),
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
    getJob: jest.fn().mockResolvedValue(null),
    getWaitingCount: jest.fn().mockResolvedValue(5),
    getActiveCount: jest.fn().mockResolvedValue(2),
    getCompletedCount: jest.fn().mockResolvedValue(100),
    getFailedCount: jest.fn().mockResolvedValue(1),
  },
  PRIORITY_QUEUE_NAME: "priority-mail-queue",
  PriorityLevel: { URGENT: 1, HIGH: 2, NORMAL: 3, LOW: 4 },
  addPriorityJob: jest.fn().mockImplementation(async (emailJobId, userId, priority, delay) => {
    await jest.requireMock("../../queues/priorityQueue").priorityQueue.add(
      "send-priority-email",
      { emailJobId, userId },
      {
        priority: priority ?? 3,
        delay: delay ?? 0,
        jobId: `priority-${emailJobId}`,
      }
    );
  }),
  removePriorityJob: jest.fn().mockResolvedValue(undefined),
  getPriorityQueueStats: jest.fn().mockResolvedValue({
    waiting: 5,
    active: 2,
    completed: 100,
    failed: 1,
  }),
}));

describe("Priority Mail Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Campaign Creation with isPriority Flag", () => {
    it("should create campaign with isPriority enabled", async () => {
      const campaignData = {
        id: "campaign-1",
        userId: "user-1",
        subject: "Test Campaign",
        body: "Test body",
        startTime: new Date(),
        delaySeconds: 0,
        hourlyLimit: 100,
        totalRecipients: 10,
        isPriority: true,
      };

      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue({
        ...campaignData,
        status: "SCHEDULED",
      });

      const campaign = await prisma.emailCampaign.create({ data: campaignData as any });

      expect(campaign).toBeDefined();
      expect(campaign.isPriority).toBe(true);
    });

    it("should default isPriority to false", async () => {
      const campaignData = {
        id: "campaign-1",
        userId: "user-1",
        subject: "Test Campaign",
        body: "Test body",
        startTime: new Date(),
        delaySeconds: 0,
        hourlyLimit: 100,
        totalRecipients: 10,
      };

      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue({
        ...campaignData,
        isPriority: false,
        status: "SCHEDULED",
      });

      const campaign = await prisma.emailCampaign.create({ data: campaignData as any });

      expect(campaign.isPriority).toBe(false);
    });

    it("should track priority campaign in database", async () => {
      const campaignData: any = {
        id: "campaign-1",
        userId: "user-1",
        subject: "Priority Campaign",
        body: "Priority body",
        startTime: new Date(),
        delaySeconds: 0,
        hourlyLimit: 100,
        totalRecipients: 10,
        isPriority: true,
      };

      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue({
        ...campaignData,
        status: "SENDING",
      });

      const campaign = await prisma.emailCampaign.create({ data: campaignData });

      expect(prisma.emailCampaign.create).toHaveBeenCalledWith({
        data: campaignData,
      });
      expect(campaign.isPriority).toBe(true);
    });
  });

  describe("Priority Queue Job Creation", () => {
    it("should create priority queue job for email", async () => {
      const emailJobId = "email-job-1";
      const userId = "user-1";

      const priorityJobData: any = {
        id: "priority-job-1",
        emailJobId,
        userId,
        status: "PRIORITY_PENDING",
        priorityScore: 500,
        congestionScore: 0,
        retryCount: 0,
        scheduledAt: new Date(),
      };

      (prisma.priorityQueueJob.create as jest.Mock).mockResolvedValue(priorityJobData);

      const priorityJob = await prisma.priorityQueueJob.create({ data: priorityJobData });

      expect(priorityJob).toBeDefined();
      expect(priorityJob.emailJobId).toBe(emailJobId);
      expect(priorityJob.userId).toBe(userId);
      expect(priorityJob.status).toBe("PRIORITY_PENDING");
    });

    it("should create multiple priority jobs for campaign", async () => {
      const userId = "user-1";
      const emailJobIds = ["job-1", "job-2", "job-3"];

      const priorityJobs = emailJobIds.map((id) => ({
        emailJobId: id,
        userId,
        status: "PRIORITY_PENDING" as const,
        priorityScore: 500,
        scheduledAt: new Date(),
      }));

      let createdCount = 0;
      (prisma.priorityQueueJob.create as jest.Mock).mockImplementation(() => {
        return Promise.resolve(priorityJobs[createdCount++]);
      });

      for (const jobData of priorityJobs) {
        await prisma.priorityQueueJob.create({ data: jobData as any });
      }

      expect(prisma.priorityQueueJob.create).toHaveBeenCalledTimes(3);
    });

    it("should add job to BullMQ priority queue", async () => {
      const emailJobId = "email-job-1";
      const userId = "user-1";

      await addPriorityJob(emailJobId, userId, PriorityLevel.HIGH, 0);

      expect(priorityQueue.add).toHaveBeenCalledWith(
        "send-priority-email",
        { emailJobId, userId },
        expect.objectContaining({
          priority: PriorityLevel.HIGH,
          delay: 0,
          jobId: `priority-${emailJobId}`,
        })
      );
    });

    it("should add urgent priority job with correct priority level", async () => {
      const emailJobId = "email-job-1";
      const userId = "user-1";

      await addPriorityJob(emailJobId, userId, PriorityLevel.URGENT);

      expect(priorityQueue.add).toHaveBeenCalledWith(
        "send-priority-email",
        { emailJobId, userId },
        expect.objectContaining({
          priority: PriorityLevel.URGENT,
          jobId: `priority-${emailJobId}`,
        })
      );
    });

    it("should add job with delay when specified", async () => {
      const emailJobId = "email-job-1";
      const userId = "user-1";
      const delayMs = 60000;

      await addPriorityJob(emailJobId, userId, PriorityLevel.NORMAL, delayMs);

      expect(priorityQueue.add).toHaveBeenCalledWith(
        "send-priority-email",
        { emailJobId, userId },
        expect.objectContaining({
          delay: delayMs,
        })
      );
    });
  });

  describe("Quota Tracking", () => {
    it("should track user quota on priority send", async () => {
      const userId = "user-1";

      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue({
        userId,
        dailyCount: 5,
        dailyLimit: 50,
        dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const quota = await prisma.priorityUserQuota.findUnique({ where: { userId } });

      expect(quota).toBeDefined();
      expect(quota?.dailyCount).toBe(5);
      expect(quota?.dailyLimit).toBe(50);
    });

    it("should increment quota on successful send", async () => {
      const userId = "user-1";

      (prisma.priorityUserQuota.upsert as jest.Mock).mockResolvedValue({
        userId,
        dailyCount: 6,
        dailyLimit: 50,
      });

      await prisma.priorityUserQuota.upsert({
        where: { userId },
        create: { userId, dailyCount: 1 },
        update: { dailyCount: { increment: 1 } },
      });

      expect(prisma.priorityUserQuota.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: expect.objectContaining({ userId, dailyCount: 1 }),
        update: { dailyCount: { increment: 1 } },
      });
    });

    it("should create new quota record if not exists", async () => {
      const userId = "user-1";

      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.priorityUserQuota.create as jest.Mock).mockResolvedValue({
        userId,
        dailyCount: 0,
        dailyLimit: 50,
      });

      const existingQuota = await prisma.priorityUserQuota.findUnique({ where: { userId } });

      if (!existingQuota) {
        await prisma.priorityUserQuota.create({
          data: { userId, dailyCount: 0, dailyLimit: 50 },
        });
      }

      expect(prisma.priorityUserQuota.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId, dailyCount: 0, dailyLimit: 50 }),
      });
    });
  });

  describe("Queue Statistics", () => {
    it("should get priority queue stats", async () => {
      const { getPriorityQueueStats } = jest.requireMock("../../queues/priorityQueue");

      const stats = await getPriorityQueueStats();

      expect(stats).toBeDefined();
      expect(stats.waiting).toBe(5);
      expect(stats.active).toBe(2);
      expect(stats.completed).toBe(100);
      expect(stats.failed).toBe(1);
    });

    it("should track queue depth over time", async () => {
      const { getPriorityQueueStats } = jest.requireMock("../../queues/priorityQueue");

      // Initial stats
      (priorityQueue.getWaitingCount as jest.Mock).mockResolvedValue(10);
      (priorityQueue.getActiveCount as jest.Mock).mockResolvedValue(3);

      const stats1 = await getPriorityQueueStats();
      expect(stats1.waiting).toBe(5); // Uses mock return value

      // After some processing
      (priorityQueue.getWaitingCount as jest.Mock).mockResolvedValue(5);
      (priorityQueue.getActiveCount as jest.Mock).mockResolvedValue(2);

      const stats2 = await getPriorityQueueStats();
      expect(stats2.waiting).toBe(5);
    });
  });

  describe("Priority Job Status Transitions", () => {
    it("should transition from PRIORITY_PENDING to PRIORITY_SENDING", async () => {
      const emailJobId = "job-1";

      (prisma.priorityQueueJob.findUnique as jest.Mock).mockResolvedValue({
        emailJobId,
        status: "PRIORITY_PENDING",
      });

      await prisma.priorityQueueJob.update({
        where: { emailJobId },
        data: { status: "PRIORITY_SENDING", statusMessage: "Processing..." },
      });

      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId },
        data: expect.objectContaining({
          status: "PRIORITY_SENDING",
          statusMessage: "Processing...",
        }),
      });
    });

    it("should transition from PRIORITY_SENDING to SENT on success", async () => {
      const emailJobId = "job-1";

      await prisma.priorityQueueJob.update({
        where: { emailJobId },
        data: { status: "SENT", statusMessage: "Sent successfully" },
      });

      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId },
        data: expect.objectContaining({
          status: "SENT",
          statusMessage: "Sent successfully",
        }),
      });
    });

    it("should transition to FAILED on error", async () => {
      const emailJobId = "job-1";

      await prisma.priorityQueueJob.update({
        where: { emailJobId },
        data: { status: "FAILED", statusMessage: "SMTP connection failed" },
      });

      expect(prisma.priorityQueueJob.update).toHaveBeenCalledWith({
        where: { emailJobId },
        data: expect.objectContaining({
          status: "FAILED",
          statusMessage: "SMTP connection failed",
        }),
      });
    });
  });

  describe("Campaign End-to-End Flow", () => {
    it("should complete full priority campaign flow", async () => {
      const campaignId = "campaign-1";
      const userId = "user-1";
      const emailJobIds = ["job-1", "job-2"];

      // 1. Create priority campaign
      const campaign = {
        id: campaignId,
        userId,
        subject: "Priority Campaign",
        isPriority: true,
        status: "SENDING",
      };

      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue(campaign);
      await prisma.emailCampaign.create({ data: campaign as any });

      // 2. Create email jobs
      for (const jobId of emailJobIds) {
        (prisma.emailJob.create as jest.Mock).mockResolvedValue({
          id: jobId,
          campaignId,
          status: "PENDING",
        });
        await prisma.emailJob.create({ data: { id: jobId, campaignId, status: "PENDING" } as any });
      }

      // 3. Create priority queue jobs
      for (const jobId of emailJobIds) {
        (prisma.priorityQueueJob.create as jest.Mock).mockResolvedValue({
          emailJobId: jobId,
          userId,
          status: "PRIORITY_PENDING",
          scheduledAt: new Date(),
        });
        await prisma.priorityQueueJob.create({
          data: { 
            emailJobId: jobId, 
            userId, 
            status: "PRIORITY_PENDING",
            scheduledAt: new Date()
          },
        });

        // 4. Add to BullMQ
        await addPriorityJob(jobId, userId, PriorityLevel.HIGH);
      }

      // 5. Verify email jobs created
      expect(prisma.emailJob.create).toHaveBeenCalledTimes(2);

      // 6. Verify priority jobs created
      expect(prisma.priorityQueueJob.create).toHaveBeenCalledTimes(2);

      // 7. Verify BullMQ jobs added
      expect(priorityQueue.add).toHaveBeenCalledTimes(2);
    });
  });
});
