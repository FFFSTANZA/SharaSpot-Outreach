import { prisma } from "../config/prisma";
import { sysLog } from "./systemLogger";

export async function checkAndCompleteCampaign(campaignId: string, options?: { skipSequences?: boolean }): Promise<boolean> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: { sequenceSteps: { select: { id: true } } },
  });

  if (!campaign) return false;
  if (campaign.status === "PAUSED" || campaign.status === "CANCELLED" || campaign.status === "COMPLETED") return false;

  if (options?.skipSequences && campaign.sequenceSteps.length > 0) return false;

  const nonTerminalCount = await prisma.emailJob.count({
    where: {
      campaignId,
      status: { notIn: ["SENT", "FAILED", "CANCELLED"] },
    },
  });

  if (nonTerminalCount > 0) return false;

  if (campaign.sequenceSteps.length > 0) {
    const activeStatesCount = await prisma.recipientSequenceState.count({
      where: {
        campaignId,
        completed: false,
        paused: false,
        replied: false,
      },
    });
    if (activeStatesCount > 0) return false;
  }

  await prisma.emailCampaign.updateMany({
    where: { id: campaignId, status: { in: ["SENDING", "SCHEDULED"] } },
    data: { status: "COMPLETED" },
  });

  sysLog.info("CAMPAIGN", `Campaign ${campaignId} auto-completed`, { campaignId });
  return true;
}
