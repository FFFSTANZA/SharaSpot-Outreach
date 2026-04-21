
process.env.ENCRYPTION_KEY = "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1";
process.env.JWT_ACCESS_SECRET = "7c4e9a2b5f8d1c3e6a9b2d5f8c1e4a7b0d3f6c9e2a5b8d1f4c7e0a3b6d9f2c5";
process.env.JWT_REFRESH_SECRET = "2b5d8f1e4a7c0d3f6b9e2c5a8d1f4e7b0c3a6d9f2e5b8c1d4f7a0e3b6d9f2c5";
process.env.ACCESS_TOKEN_EXPIRES = "1h";
process.env.REFRESH_TOKEN_EXPIRES = "7d";
process.env.TRACKING_BASE_URL = "http://localhost:8000";

// Mock ioredis before anything else
const redisList: string[] = [];
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    lpush: jest.fn().mockImplementation((key, val) => {
      redisList.push(val);
      return Promise.resolve(redisList.length);
    }),
    rpop: jest.fn().mockImplementation((key) => {
      return Promise.resolve(redisList.shift() || null);
    }),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    set: jest.fn().mockResolvedValue("OK"),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  }));
});

import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../config/prisma";
import nodemailer from "nodemailer";
import { signAccessToken } from "../../utils/jwt";
import { SubscriptionStatus } from "@prisma/client";
import { processEmailJob } from "../../worker/emailWorker";
import { flushTrackingBuffer } from "../../controllers/trackingControllers";
import { encrypt } from "../../utils/encryption";

// Mock nodemailer
jest.mock("nodemailer");

// Mock BullMQ
jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
    Job: jest.fn(),
  };
});

// Mock individual queues
jest.mock("../../queues/emailQueue", () => ({
  emailQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  }
}));
jest.mock("../../queues/priorityQueue", () => ({
  priorityQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  }
}));

describe("Email Delivery and Tracking End-to-End Flow", () => {
  let token: string;
  let userId: string;
  let senderId: string;

  beforeAll(async () => {
    // Clean up in correct order
    await prisma.user.deleteMany();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: "test-integration-unique-3@example.com",
        name: "Test User",
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
        email: "sender-unique-3@example.com",
        name: "Test Sender",
        appPassword: encrypt("password"),
        smtpHost: "smtp.example.com",
        smtpPort: 465,
        isVerified: true,
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
      await prisma.tag.deleteMany();
      await prisma.emailTemplate.deleteMany();
      await prisma.refreshToken.deleteMany();
      await prisma.senderCooldown.deleteMany();
      await prisma.warmupSchedule.deleteMany();
      await prisma.sender.deleteMany();
      await prisma.subscription.deleteMany();
      await prisma.user.deleteMany();
    } catch (e) { }

    await prisma.$disconnect();
  });

  it("should complete the full email flow from creation to tracking", async () => {
    // 1. Campaign Creation via API
    const campaignPayload = {
      senderId,
      subject: "Hello {{FirstName}}",
      body: "Hi {{FirstName}}, click <a href='https://example.com'>here</a>",
      startTime: new Date().toISOString(),
      delaySeconds: 0,
      hourlyLimit: 100,
      emails: [
        {
          email: "recipient-unique-3@example.com",
          columnData: { FirstName: "John" },
        },
      ],
      trackOpens: true,
      trackClicks: true,
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

    // 2. Email Processing
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: "test-msg-id" });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn(),
    });

    const fakeJob = {
      data: { emailJobId: emailJob!.id },
    } as any;

    await processEmailJob(fakeJob);

    // Verify sent mail
    expect(mockSendMail).toHaveBeenCalled();
    const sentMailArgs = mockSendMail.mock.calls[0][0];
    expect(sentMailArgs.subject).toBe("Hello John");
    expect(sentMailArgs.html).toContain(`http://localhost:8000/track/open/${emailJob!.id}`);

    // 3. Tracking OPEN
    await request(app).get(`/track/open/${emailJob!.id}`);
    await flushTrackingBuffer();

    const openEvent = await prisma.trackingEvent.findFirst({
      where: { emailJobId: emailJob!.id, eventType: "OPEN" }
    });
    expect(openEvent).toBeDefined();

    // 4. Tracking CLICK
    await request(app).get(`/track/click/${emailJob!.id}?url=https%3A%2F%2Fexample.com`);
    await flushTrackingBuffer();

    const clickEvent = await prisma.trackingEvent.findFirst({
      where: { emailJobId: emailJob!.id, eventType: "CLICK" }
    });
    expect(clickEvent).toBeDefined();

    // 5. Campaign Status
    const updatedCampaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
    expect(updatedCampaign?.status).toBe("COMPLETED");
  });
});
