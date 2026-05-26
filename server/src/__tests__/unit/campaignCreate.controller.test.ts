import { createCampaign } from "../../controllers/campaign/create";

jest.mock("../../services/campaignService", () => ({
  campaignService: {
    createCampaign: jest.fn().mockResolvedValue({
      campaignId: "c1",
      emailJobs: [{ id: "j1", scheduledAt: new Date() }],
      senderPool: [],
    }),
  },
  CampaignError: class CampaignError extends Error {
    statusCode: number;
    upgradeRequired: boolean;
    constructor(message: string, _code: string, statusCode = 400, upgradeRequired = false) {
      super(message);
      this.statusCode = statusCode;
      this.upgradeRequired = upgradeRequired;
    }
  },
}));

jest.mock("../../queues/emailQueue", () => ({
  emailQueue: { add: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("../../queues/priorityQueue", () => ({
  priorityQueue: { add: jest.fn().mockResolvedValue(undefined) },
}));

describe("campaign create controller", () => {
  it("forwards sequenceSchedule and frequencyCaps to campaignService", async () => {
    const { campaignService } = await import("../../services/campaignService");

    const req = {
      user: { id: "u1" },
      body: {
        senderId: "s1",
        subject: "subject",
        body: "body",
        startTime: new Date().toISOString(),
        delaySeconds: 0,
        hourlyLimit: 50,
        emails: ["lead@example.com"],
        steps: [{ subject: "s", body: "b", waitDays: 1, condition: "none" }],
        sequenceSchedule: { sendHour: 10, allowedDaysOfWeek: [1, 2, 3], timezone: "UTC" },
        frequencyCaps: { maxPerRecipient: 3, maxPerDay: 2, maxPerWeek: 5 },
      },
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    await createCampaign(req, res);

    expect(campaignService.createCampaign).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        sequenceSchedule: { sendHour: 10, allowedDaysOfWeek: [1, 2, 3], timezone: "UTC" },
        frequencyCaps: { maxPerRecipient: 3, maxPerDay: 2, maxPerWeek: 5 },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
