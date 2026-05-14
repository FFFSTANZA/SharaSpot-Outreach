
process.env.ENCRYPTION_KEY = "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1";
process.env.JWT_ACCESS_SECRET = "7c4e9a2b5f8d1c3e6a9b2d5f8c1e4a7b0d3f6c9e2a5b8d1f4c7e0a3b6d9f2c5";
process.env.JWT_REFRESH_SECRET = "2b5d8f1e4a7c0d3f6b9e2c5a8d1f4e7b0c3a6d9f2e5b8c1d4f7a0e3b6d9f2c5";
process.env.ACCESS_TOKEN_EXPIRES = "1h";
process.env.REFRESH_TOKEN_EXPIRES = "7d";

import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../config/prisma";
import nodemailer from "nodemailer";
import { signAccessToken } from "../../utils/jwt";
import { processPriorityJob } from "../../worker/priorityEmailWorker";
import { encrypt } from "../../utils/encryption";
import * as signalCollector from "../../utils/signalCollector";
import { priorityQueue } from "../../queues/priorityQueue";
import { SubscriptionStatus } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  describe("Priority Mail Flow Integration Test", () => {
    it("skipped — DATABASE_URL not set", () => {
      console.warn("[SKIP] Priority mail integration test requires DATABASE_URL");
    });
  });
} else {

// Mock ioredis before anything else
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    lpush: jest.fn().mockResolvedValue(1),
    rpop: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});

// Mock nodemailer
jest.mock("nodemailer");

// Mock BullMQ
jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: "mock-priority-job-id" }),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
    Job: jest.fn(),
  };
});

// Mock individual queues
jest.mock("../../queues/priorityQueue", () => ({
  priorityQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-priority-job-id" }),
  },
  PRIORITY_QUEUE_NAME: "priority-email-queue"
}));

jest.mock("../../queues/emailQueue", () => ({
  emailQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  }
}));

describe("Priority Mail Flow Integration Test", () => {
  let token: string;
  let userId: string;
  let senderId: string;

  beforeAll(async () => {
    // Clean up in correct order
    await prisma.user.deleteMany();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: "priority-test@example.com",
        name: "Priority User",
      },
    });
    userId = user.id;

    // Create premium subscription
    await prisma.subscription.create({
      data: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });

    // Create verified sender
    const sender = await prisma.sender.create({
      data: {
        userId,
        email: "priority-sender@example.com",
        name: "Priority Sender",
        appPassword: encrypt("password"),
        smtpHost: "smtp.example.com",
        smtpPort: 465,
        isVerified: true,
        dailyLimit: 200, // Ensure high enough for warmup check
      },
    });
    senderId = sender.id;

    token = signAccessToken({ id: userId, email: user.email });
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await prisma.trackingEvent.deleteMany();
      await prisma.priorityQueueJob.deleteMany();
      await prisma.priorityUserQuota.deleteMany();
      await prisma.domainRateLimit.deleteMany();
      await prisma.emailJob.deleteMany();
      await prisma.campaignSender.deleteMany();
      await prisma.attachment.deleteMany();
      await prisma.sequenceStep.deleteMany();
      await prisma.recipientSequenceState.deleteMany();
      await prisma.emailCampaign.deleteMany();
      await prisma.senderCooldown.deleteMany();
      await prisma.warmupSchedule.deleteMany();
      await prisma.sender.deleteMany();
      await prisma.subscription.deleteMany();
      await prisma.user.deleteMany();
    } catch (e) { }

    await prisma.$disconnect();
  });

  it("should complete the full priority mail flow (Happy Path)", async () => {
    // 1. Create priority campaign via API
    const campaignPayload = {
      senderId,
      subject: "Priority Subject",
      body: "Priority Body",
      startTime: new Date().toISOString(),
      delaySeconds: 0,
      hourlyLimit: 100,
      emails: ["recipient@gmail.com"],
      isPriority: true,
    };

    const createRes = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${token}`)
      .send(campaignPayload);

    expect(createRes.status).toBe(201);
    const campaignId = createRes.body.campaignId;

    const emailJob = await prisma.emailJob.findFirst({
      where: { campaignId },
    });
    expect(emailJob).toBeDefined();

    const priorityRecord = await prisma.priorityQueueJob.findUnique({
      where: { emailJobId: emailJob!.id },
    });
    expect(priorityRecord).toBeDefined();
    expect(priorityRecord?.status).toBe("PRIORITY_PENDING");

    // 2. Process priority job
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: "priority-msg-id" });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn(),
    });

    // Mock low congestion
    jest.spyOn(signalCollector, "collectSmtpTiming").mockResolvedValue({
      tcpConnectMs: 10,
      greetingDelayMs: 20,
      tlsHandshakeMs: 30,
      mailFromMs: 10,
      rcptToMs: 10,
      dataMs: 10,
      totalMs: 100,
    });

    const fakeJob = {
      data: { emailJobId: emailJob!.id, userId },
    } as any;

    await processPriorityJob(fakeJob);

    // 3. Verify outcomes
    const updatedEmailJob = await prisma.emailJob.findUnique({
      where: { id: emailJob!.id },
    });
    expect(updatedEmailJob?.status).toBe("SENT");

    const updatedPriorityRecord = await prisma.priorityQueueJob.findUnique({
      where: { emailJobId: emailJob!.id },
    });
    expect(updatedPriorityRecord?.status).toBe("SENT");

    const quota = await prisma.priorityUserQuota.findUnique({
      where: { userId },
    });
    expect(quota?.dailyCount).toBe(1);

    const domainLimit = await prisma.domainRateLimit.findUnique({
      where: { domain: "gmail.com" },
    });
    expect(domainLimit?.hourlyCount).toBe(1);
  });

  it("should handle congestion and retry in priority flow", async () => {
    // 1. Create another priority campaign/job
    const campaignPayload = {
      senderId,
      subject: "Congestion Subject",
      body: "Congestion Body",
      startTime: new Date().toISOString(),
      delaySeconds: 0,
      hourlyLimit: 100,
      emails: ["congested@outlook.com"],
      isPriority: true,
    };

    const createRes = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${token}`)
      .send(campaignPayload);

    const campaignId = createRes.body.campaignId;
    const emailJob = await prisma.emailJob.findFirst({
      where: { campaignId },
    });

    // 2. Mock high congestion
    jest.spyOn(signalCollector, "collectSmtpTiming").mockResolvedValue({
      tcpConnectMs: 1000,
      greetingDelayMs: 2000,
      tlsHandshakeMs: 1000,
      mailFromMs: 500,
      rcptToMs: 500,
      dataMs: 1000,
      totalMs: 6000,
    });

    const fakeJob = {
      data: { emailJobId: emailJob!.id, userId },
    } as any;

    const priorityQueueAddSpy = priorityQueue.add as jest.Mock;
    priorityQueueAddSpy.mockClear();

    await processPriorityJob(fakeJob);

    // 3. Verify it was re-queued due to congestion
    expect(priorityQueueAddSpy).toHaveBeenCalledWith(
      "send-priority-email",
      expect.objectContaining({ emailJobId: emailJob!.id }),
      expect.objectContaining({ delay: expect.any(Number) })
    );

    const updatedPriorityRecord = await prisma.priorityQueueJob.findUnique({
      where: { emailJobId: emailJob!.id },
    });
    expect(updatedPriorityRecord?.status).toBe("PRIORITY_SENDING");
    expect(updatedPriorityRecord?.statusMessage).toContain("High congestion");
    expect(updatedPriorityRecord?.statusMessage).toContain("Retrying in 5 minutes");
    expect(updatedPriorityRecord?.retryCount).toBe(1);
  });

  it("should enforce user priority quota", async () => {
    // 1. Create a job for a user at quota limit
    const userAtLimit = await prisma.user.create({
      data: {
        email: "limited-user@example.com",
        name: "Limited User",
      }
    });

    // Create premium subscription
    await prisma.subscription.create({
      data: {
        userId: userAtLimit.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });

    await prisma.priorityUserQuota.create({
      data: {
        userId: userAtLimit.id,
        dailyCount: 50,
        dailyLimit: 50,
        dailyResetAt: new Date(Date.now() + 3600000), // 1 hour from now
      }
    });

    const campaignPayload = {
      senderId,
      subject: "Quota Subject",
      body: "Quota Body",
      startTime: new Date().toISOString(),
      delaySeconds: 0,
      hourlyLimit: 100,
      emails: ["quota-test@gmail.com"],
      isPriority: true,
    };

    const createRes = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${signAccessToken({ id: userAtLimit.id, email: userAtLimit.email })}`)
      .send(campaignPayload);

    const campaignId = createRes.body.campaignId;
    const emailJob = await prisma.emailJob.findFirst({
      where: { campaignId },
    });

    const fakeJob = {
      data: { emailJobId: emailJob!.id, userId: userAtLimit.id },
    } as any;

    const priorityQueueAddSpy = priorityQueue.add as jest.Mock;
    priorityQueueAddSpy.mockClear();

    await processPriorityJob(fakeJob);

    // 2. Verify it was re-queued due to quota exceeded
    expect(priorityQueueAddSpy).toHaveBeenCalledWith(
      "send-priority-email",
      expect.objectContaining({ emailJobId: emailJob!.id }),
      expect.objectContaining({ delay: expect.any(Number) })
    );

    const updatedPriorityRecord = await prisma.priorityQueueJob.findUnique({
      where: { emailJobId: emailJob!.id },
    });
    expect(updatedPriorityRecord?.status).toBe("PRIORITY_PENDING");
    expect(updatedPriorityRecord?.statusMessage).toContain("Daily priority quota exceeded");
  });
});
}
