jest.mock("../../config/prisma", () => ({
  prisma: {
    emailCampaign: { findMany: jest.fn(), updateMany: jest.fn() },
    emailJob: { groupBy: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    recipientSequenceState: { findMany: jest.fn(), updateMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    trackingEvent: { findMany: jest.fn(), findFirst: jest.fn() },
  },
}));

jest.mock("../../queues/emailQueue", () => ({
  emailQueue: { add: jest.fn().mockResolvedValue(undefined) },
}));

import { processSchedulerJob } from "../../worker/sequenceScheduler";
import { prisma } from "../../config/prisma";

const mockedPrisma = prisma as unknown as {
  emailCampaign: { findMany: jest.Mock; updateMany: jest.Mock };
  emailJob: { groupBy: jest.Mock; findMany: jest.Mock; create: jest.Mock; count: jest.Mock };
  recipientSequenceState: { findMany: jest.Mock; updateMany: jest.Mock; update: jest.Mock; count: jest.Mock };
  trackingEvent: { findMany: jest.Mock; findFirst: jest.Mock };
};

describe("sequenceScheduler branching", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("preserves SKIPPED branch state when scheduling branch target", async () => {
    mockedPrisma.emailCampaign.findMany.mockResolvedValue([
      {
        id: "c1",
        senderId: "sender-a",
        delaySeconds: 0,
        timezone: "UTC",
        sequenceConfig: null,
        campaignSenders: [{ senderId: "sender-a", rotationOrder: 0 }],
        sequenceSteps: [
          { id: "step0", stepNumber: 0, waitDays: 0, condition: null },
          {
            id: "step1",
            stepNumber: 1,
            waitDays: 0,
            condition: JSON.stringify({
              v: 2,
              kind: "advanced",
              rules: { operator: "AND", operands: [{ type: "opened" }] },
              onMatchStepNumber: null,
              onNoMatchStepNumber: 2,
            }),
          },
          { id: "step2", stepNumber: 2, waitDays: 0, condition: null },
        ],
      },
    ]);

    mockedPrisma.emailJob.groupBy.mockResolvedValue([]);
    mockedPrisma.emailJob.findMany.mockResolvedValue([]);
    mockedPrisma.recipientSequenceState.findMany.mockResolvedValue([
      {
        id: "r1",
        campaignId: "c1",
        recipientEmail: "lead@example.com",
        currentStep: 0,
        completed: false,
        paused: false,
        replied: false,
        stepStatuses: [
          { stepNumber: 0, status: "SENT", sentAt: new Date(Date.now() - 86400000).toISOString(), emailJobId: "job0" },
          { stepNumber: 1, status: "PENDING" },
          { stepNumber: 2, status: "PENDING" },
        ],
      },
    ]);

    mockedPrisma.trackingEvent.findMany.mockResolvedValue([]);
    mockedPrisma.recipientSequenceState.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.emailJob.create.mockResolvedValue({ id: "job-next" });
    mockedPrisma.recipientSequenceState.count.mockResolvedValue(1);
    mockedPrisma.emailJob.count.mockResolvedValue(1);

    await processSchedulerJob();

    const calls = mockedPrisma.recipientSequenceState.update.mock.calls;
    const finalUpdateCall = calls[calls.length - 1];
    expect(finalUpdateCall).toBeDefined();

    const stepStatuses = finalUpdateCall[0].data.stepStatuses;
    expect(stepStatuses[1].status).toBe("SKIPPED");
    expect(stepStatuses[2].status).toBe("SCHEDULED");
    expect(stepStatuses[2].emailJobId).toBe("job-next");
  });

  it("respects frequency caps and completes recipient without enqueuing new follow-up", async () => {
    mockedPrisma.emailCampaign.findMany.mockResolvedValue([
      {
        id: "c1",
        senderId: "sender-a",
        delaySeconds: 0,
        timezone: "UTC",
        sequenceConfig: { frequencyCaps: { maxPerRecipient: 1, maxPerDay: 0, maxPerWeek: 0 }, schedule: null },
        campaignSenders: [{ senderId: "sender-a", rotationOrder: 0 }],
        sequenceSteps: [
          { id: "step0", stepNumber: 0, waitDays: 0, condition: null },
          { id: "step1", stepNumber: 1, waitDays: 0, condition: null },
          { id: "step2", stepNumber: 2, waitDays: 0, condition: null },
        ],
      },
    ]);

    mockedPrisma.emailJob.groupBy.mockResolvedValue([]);
    mockedPrisma.emailJob.findMany.mockResolvedValue([]);
    mockedPrisma.recipientSequenceState.findMany.mockResolvedValue([
      {
        id: "r1",
        campaignId: "c1",
        recipientEmail: "lead@example.com",
        currentStep: 1,
        completed: false,
        paused: false,
        replied: false,
        stepStatuses: [
          { stepNumber: 0, status: "SENT", sentAt: new Date(Date.now() - 3 * 86400000).toISOString(), emailJobId: "job0" },
          { stepNumber: 1, status: "SENT", sentAt: new Date(Date.now() - 86400000).toISOString(), emailJobId: "job1" },
          { stepNumber: 2, status: "PENDING" },
        ],
      },
    ]);

    mockedPrisma.recipientSequenceState.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.recipientSequenceState.count.mockResolvedValue(0);
    mockedPrisma.emailJob.count.mockResolvedValue(0);
    mockedPrisma.emailCampaign.updateMany.mockResolvedValue({ count: 1 });

    await processSchedulerJob();

    expect(mockedPrisma.emailJob.create).not.toHaveBeenCalled();
    expect(mockedPrisma.recipientSequenceState.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { completed: true },
      })
    );
  });
});
