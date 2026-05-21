jest.mock("../../config/prisma", () => ({
  prisma: {
    emailCampaign: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    emailJob: {
      count: jest.fn(),
    },
    recipientSequenceState: {
      count: jest.fn(),
    },
  },
}));

jest.mock("../../utils/systemLogger", () => ({
  sysLog: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), critical: jest.fn() },
}));

import { checkAndCompleteCampaign } from "../../utils/campaignCompletion";
import { prisma } from "../../config/prisma";

const mockFindUnique = prisma.emailCampaign.findUnique as jest.Mock;
const mockUpdateMany = prisma.emailCampaign.updateMany as jest.Mock;
const mockJobCount = prisma.emailJob.count as jest.Mock;
const mockSeqCount = prisma.recipientSequenceState.count as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("checkAndCompleteCampaign", () => {
  it("returns false if campaign not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await checkAndCompleteCampaign("camp-1")).toBe(false);
  });

  it("returns false if campaign is PAUSED", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "PAUSED", sequenceSteps: [] });
    expect(await checkAndCompleteCampaign("camp-1")).toBe(false);
  });

  it("returns false if campaign is CANCELLED", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "CANCELLED", sequenceSteps: [] });
    expect(await checkAndCompleteCampaign("camp-1")).toBe(false);
  });

  it("returns false if campaign is COMPLETED", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "COMPLETED", sequenceSteps: [] });
    expect(await checkAndCompleteCampaign("camp-1")).toBe(false);
  });

  it("returns false if non-terminal jobs exist", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "SENDING", sequenceSteps: [] });
    mockJobCount.mockResolvedValue(3);
    expect(await checkAndCompleteCampaign("camp-1")).toBe(false);
    expect(mockJobCount).toHaveBeenCalledWith({
      where: { campaignId: "camp-1", status: { notIn: ["SENT", "FAILED", "CANCELLED"] } },
    });
  });

  it("completes campaign when all jobs are terminal and no sequence", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "SENDING", sequenceSteps: [] });
    mockJobCount.mockResolvedValue(0);
    mockUpdateMany.mockResolvedValue({ count: 1 });

    expect(await checkAndCompleteCampaign("camp-1")).toBe(true);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "camp-1", status: { in: ["SENDING", "SCHEDULED"] } },
      data: { status: "COMPLETED" },
    });
  });

  it("checks sequence states for sequence campaigns", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "SENDING", sequenceSteps: [{ id: "s1" }] });
    mockJobCount.mockResolvedValue(0);
    mockSeqCount.mockResolvedValue(1);

    expect(await checkAndCompleteCampaign("camp-1")).toBe(false);
    expect(mockSeqCount).toHaveBeenCalledWith({
      where: { campaignId: "camp-1", completed: false, paused: false, replied: false },
    });
  });

  it("completes sequence campaign when all recipients done", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "SCHEDULED", sequenceSteps: [{ id: "s1" }] });
    mockJobCount.mockResolvedValue(0);
    mockSeqCount.mockResolvedValue(0);
    mockUpdateMany.mockResolvedValue({ count: 1 });

    expect(await checkAndCompleteCampaign("camp-1")).toBe(true);
    expect(mockUpdateMany).toHaveBeenCalled();
  });

  it("skips sequence check when skipSequences option is set", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp-1", status: "SENDING", sequenceSteps: [{ id: "s1" }] });
    mockJobCount.mockResolvedValue(0);

    expect(await checkAndCompleteCampaign("camp-1", { skipSequences: true })).toBe(false);
    expect(mockSeqCount).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
