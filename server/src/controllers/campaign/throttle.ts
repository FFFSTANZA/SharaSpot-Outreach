import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import { getEffectiveLimits } from "../../utils/throttleEngine";
import { isInWarmup } from "../../utils/warmupEvaluator";
import { getAdaptiveState } from "../../utils/adaptiveThrottle";
import { getSentCountToday } from "../../utils/dailyLimitTracker";
import { getOrgScope } from "../../utils/orgScope";

export const getCampaignThrottleStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, ...getOrgScope(req) },
      include: {
        campaignSenders: {
          orderBy: { rotationOrder: "asc" },
          include: {
            sender: {
              select: { id: true, email: true, name: true, dailyLimit: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const senderStates = [];

    for (const cs of campaign.campaignSenders) {
      const senderId = cs.sender.id;
      const limits = await getEffectiveLimits(senderId);
      const warmupActive = await isInWarmup(senderId);
      const adaptiveState = await getAdaptiveState(senderId);
      const dailyCount = await getSentCountToday(senderId);

      const now = new Date();
      const hourWindow = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0)
      );
      const hourlyAggregate = await prisma.rateLimitCounter.aggregate({
        where: { senderId, hourWindow },
        _sum: { count: true },
      });
      const currentHourlyCount = hourlyAggregate._sum.count ?? 0;

      const warmupSchedule = await prisma.warmupSchedule.findUnique({
        where: { senderId },
      });
      let warmupStatus: string;
      if (warmupSchedule?.optedOut) {
        warmupStatus = "opted-out";
      } else if (warmupActive) {
        warmupStatus = "active";
      } else {
        warmupStatus = "inactive";
      }

      senderStates.push({
        senderId,
        email: cs.sender.email,
        name: cs.sender.name,
        currentHourlyCount,
        currentDailyCount: dailyCount,
        effectiveLimits: {
          perMinute: limits.perMinute,
          perHour: limits.perHour,
          perDay: limits.perDay,
        },
        warmupStatus,
        cooldownState: {
          status: adaptiveState.isCooldown ? "active" : "inactive",
          expiresAt: adaptiveState.cooldownExpiresAt ?? null,
        },
      });
    }

    res.status(200).json({
      campaignId: id,
      senders: senderStates,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching throttle status" });
  }
};
