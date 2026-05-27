process.env.ENCRYPTION_KEY = "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1";
process.env.JWT_ACCESS_SECRET = "7c4e9a2b5f8d1c3e6a9b2d5f8c1e4a7b0d3f6c9e2a5b8d1f4c7e0a3b6d9f2c5";
process.env.JWT_REFRESH_SECRET = "2b5d8f1e4a7c0d3f6b9e2c5a8d1f4e7b0c3a6d9f2e5b8c1d4f7a0e3b6d9f2c5";
process.env.ACCESS_TOKEN_EXPIRES = "1h";
process.env.REFRESH_TOKEN_EXPIRES = "7d";
process.env.TRACKING_BASE_URL = "http://localhost:8000";

const redisList: string[] = [];
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    lpush: jest.fn().mockImplementation((_key, val) => {
      redisList.push(val);
      return Promise.resolve(redisList.length);
    }),
    rpop: jest.fn().mockImplementation(() => Promise.resolve(redisList.shift() || null)),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue("OK"),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});

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

jest.mock("../../queues/emailQueue", () => ({
  emailQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  }
}));

jest.mock("../../queues/priorityQueue", () => ({
  priorityQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-priority-job-id" }),
  }
}));

jest.mock("nodemailer");

import request from "supertest";
import nodemailer from "nodemailer";
import { SubscriptionStatus } from "@prisma/client";
import { app } from "../../index";
import { prisma } from "../../config/prisma";
import { signAccessToken } from "../../utils/jwt";
import { encrypt } from "../../utils/encryption";
import { processEmailJob } from "../../worker/emailWorker";
import { processSchedulerJob } from "../../worker/sequenceScheduler";

if (!process.env.DATABASE_URL) {
  describe("Follow-up End-to-End Flow", () => {
    it("skipped — DATABASE_URL not set", () => {
      console.warn("[SKIP] Follow-up integration test requires DATABASE_URL");
    });
  });
} else {
  describe("Follow-up End-to-End Flow", () => {
    let token: string;
    let userId: string;
    let senderId: string;
    const runId = Date.now().toString();

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          email: `followup-user-${runId}@example.com`,
          name: "Follow-up User",
        },
      });
      userId = user.id;

      await prisma.subscription.create({
        data: {
          userId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });

      const sender = await prisma.sender.create({
        data: {
          userId,
          email: `followup-sender-${runId}@example.com`,
          name: "Follow-up Sender",
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
      } catch (_e) {}
      await prisma.$disconnect();
    });

    it("saves enhanced follow-up config and schedules branch target correctly", async () => {
      const now = new Date();
      const utcDay = now.getUTCDay();
      const utcSendHour = (now.getUTCHours() + 1) % 24;

      const createRes = await request(app)
        .post("/api/campaigns")
        .set("Authorization", `Bearer ${token}`)
        .send({
          senderId,
          subject: "Initial {{FirstName}}",
          body: "Hi {{FirstName}}",
          startTime: new Date().toISOString(),
          delaySeconds: 0,
          hourlyLimit: 100,
          emails: [{ email: `followup-recipient-${runId}@example.com`, columnData: { FirstName: "Ava" } }],
          steps: [
            { subject: "Follow-up 1", body: "Checking in", waitDays: 1 },
            { subject: "Follow-up 2", body: "On open path", waitDays: 1 },
            { subject: "Follow-up 3", body: "On no-open path", waitDays: 1 },
          ],
          sequenceGraph: {
            startNodeId: "n1",
            nodes: [
              {
                id: "n1",
                subject: "Follow-up 1",
                body: "Checking in",
                waitDays: 1,
                rules: { operator: "AND", operands: [{ type: "opened" }] },
              },
              { id: "n2", subject: "Follow-up 2", body: "On open path", waitDays: 1 },
              { id: "n3", subject: "Follow-up 3", body: "On no-open path", waitDays: 1 },
            ],
            edges: {
              n1: { onMatch: "n2", onNoMatch: "n3" },
              n2: { onMatch: null, onNoMatch: null },
              n3: { onMatch: null, onNoMatch: null },
            },
          },
          sequenceSchedule: {
            sendHour: utcSendHour,
            allowedDaysOfWeek: [utcDay],
            timezone: "UTC",
          },
          frequencyCaps: {
            maxPerRecipient: 1,
            maxPerDay: 0,
            maxPerWeek: 0,
          },
        });

      expect(createRes.status).toBe(201);
      const campaignId = createRes.body.campaignId as string;

      const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
      expect(campaign).toBeTruthy();
      const config = campaign?.sequenceConfig as any;
      expect(config?.schedule?.sendHour).toBe(utcSendHour);
      expect(config?.frequencyCaps?.maxPerRecipient).toBe(1);

      const steps = await prisma.sequenceStep.findMany({
        where: { campaignId },
        orderBy: { stepNumber: "asc" },
      });
      expect(steps.length).toBe(4);

      const firstJob = await prisma.emailJob.findFirst({
        where: { campaignId, sequenceStep: { stepNumber: 0 } },
      });
      expect(firstJob).toBeTruthy();

      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: "msg-followup-initial" }),
        close: jest.fn(),
      });
      await processEmailJob({ data: { emailJobId: firstJob!.id } } as any);

      const state = await prisma.recipientSequenceState.findFirst({
        where: { campaignId, recipientEmail: `followup-recipient-${runId}@example.com` },
      });
      expect(state).toBeTruthy();

      const statuses = [...((state!.stepStatuses as any[]) || [])];
      statuses[0] = {
        ...statuses[0],
        status: "SENT",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        emailJobId: firstJob!.id,
      };
      await prisma.recipientSequenceState.update({
        where: { id: state!.id },
        data: { stepStatuses: statuses, currentStep: 0 },
      });

      await processSchedulerJob();

      const scheduledFollowUp = await prisma.emailJob.findFirst({
        where: { campaignId, sequenceStep: { stepNumber: 3 } },
        include: { sequenceStep: true },
      });
      expect(scheduledFollowUp).toBeTruthy();
      expect(scheduledFollowUp!.sequenceStep?.subject).toBe("Follow-up 3");
    });
  });
}
