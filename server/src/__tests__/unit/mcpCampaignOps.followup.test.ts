jest.mock("../../config/prisma", () => ({
  prisma: {
    emailCampaign: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    sequenceStep: {
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../../config/prisma";
import { registerCampaignOperatorTools } from "../../mcp/tools/campaignOps";
import { toolRegistry } from "../../mcp/toolRegistry";
import { MCPContext } from "../../mcp/types";

const mockPrisma = prisma as unknown as {
  emailCampaign: { findFirst: jest.Mock; update: jest.Mock };
  sequenceStep: { upsert: jest.Mock };
};

const ctx: MCPContext = { userId: "u1", requestId: "req1" };

describe("MCP campaignOps follow-up features", () => {
  beforeAll(() => {
    if (!toolRegistry.get("campaign_sequence_upsert")) {
      registerCampaignOperatorTools();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.emailCampaign.findFirst.mockResolvedValue({ id: "c1", status: "SCHEDULED", sequenceConfig: null });
    mockPrisma.sequenceStep.upsert.mockResolvedValue({ id: "s1" });
    mockPrisma.emailCampaign.update.mockResolvedValue({ id: "c1", sequenceConfig: { schedule: null, frequencyCaps: null } });
  });

  it("serializes advanced branching condition for sequence upsert", async () => {
    await toolRegistry.execute("campaign_sequence_upsert", ctx, {
      campaignId: "c1",
      stepNumber: 2,
      subject: "Follow up",
      body: "Body",
      waitDays: 2,
      rules: { operator: "AND", operands: [{ type: "opened", withinHours: 24 }] },
      onMatchStepNumber: 4,
      onNoMatchStepNumber: 3,
      altSubjects: ["A", "B"],
      sendHour: 11,
      waitHours: 2,
    });

    const call = mockPrisma.sequenceStep.upsert.mock.calls[0][0];
    const parsed = JSON.parse(call.create.condition);

    expect(parsed).toMatchObject({
      v: 2,
      kind: "advanced",
      onMatchStepNumber: 4,
      onNoMatchStepNumber: 3,
      sendHour: 11,
      waitHours: 2,
    });
    expect(parsed.altSubjects).toEqual(["A", "B"]);
    expect(parsed.rules).toEqual({ operator: "AND", operands: [{ type: "opened", withinHours: 24 }] });
  });

  it("supports simple extended condition fields", async () => {
    await toolRegistry.execute("campaign_sequence_upsert", ctx, {
      campaignId: "c1",
      stepNumber: 1,
      subject: "Follow up",
      body: "Body",
      waitDays: 1,
      condition: "clicked",
      altSubjects: ["A"],
      sendHour: 10,
    });

    const call = mockPrisma.sequenceStep.upsert.mock.calls[0][0];
    const parsed = JSON.parse(call.create.condition);

    expect(parsed).toMatchObject({
      v: 1,
      kind: "simple_extended",
      type: "clicked",
      sendHour: 10,
    });
    expect(parsed.altSubjects).toEqual(["A"]);
  });

  it("updates campaign sequence schedule and frequency caps", async () => {
    mockPrisma.emailCampaign.update.mockResolvedValue({
      id: "c1",
      sequenceConfig: {
        schedule: { sendHour: 9, allowedDaysOfWeek: [1, 2, 3, 4, 5], timezone: "UTC" },
        frequencyCaps: { maxPerRecipient: 3, maxPerDay: 1, maxPerWeek: 5 },
      },
    });

    await toolRegistry.execute("campaign_sequence_config_update", ctx, {
      campaignId: "c1",
      sequenceSchedule: { sendHour: 9, allowedDaysOfWeek: [1, 2, 3, 4, 5], timezone: "UTC" },
      frequencyCaps: { maxPerRecipient: 3, maxPerDay: 1, maxPerWeek: 5 },
    });

    expect(mockPrisma.emailCampaign.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: {
        sequenceConfig: {
          schedule: { sendHour: 9, allowedDaysOfWeek: [1, 2, 3, 4, 5], timezone: "UTC" },
          frequencyCaps: { maxPerRecipient: 3, maxPerDay: 1, maxPerWeek: 5 },
        },
      },
      select: { id: true, sequenceConfig: true },
    });
  });
});
