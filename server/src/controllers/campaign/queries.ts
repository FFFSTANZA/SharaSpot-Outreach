import { Request, Response } from "express";
import { Prisma, CampaignStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import { checkAndCompleteCampaign } from "../../utils/campaignCompletion";
import { getEffectiveLimits } from "../../utils/throttleEngine";
import {
  validateSearchQuery,
  validateStatusParam,
  validateDateRange,
} from "../../utils/searchValidation";
import { getOrgScope } from "../../utils/orgScope";

const CAMPAIGN_STATUS_VALUES = ["SCHEDULED", "SENDING", "PAUSED", "CANCELLED", "COMPLETED"];

export const getAllCampaigns = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const scope = getOrgScope(req);
    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where: { ...scope },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              name: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              emails: {
                where: {
                  status: {
                    in: ["PENDING", "SENDING"]
                  }
                }
              }
            }
          },
          sequenceSteps: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.emailCampaign.count({
        where: { ...scope },
      }),
    ]);

    const enrichedCampaigns = await Promise.all(campaigns.map(async (c) => {
      if ((c.status === "SENDING" || c.status === "SCHEDULED") && c._count.emails === 0) {
        const completed = await checkAndCompleteCampaign(c.id);
        if (completed) c.status = "COMPLETED";
      }

      const { sequenceSteps, ...campaignData } = c;
      return campaignData;
    }));

    res.status(200).json({
      data: enrichedCampaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({
      message: "An error occurred while fetching campaigns",
    });
  }
};

export const getCompletedCampaigns = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        ...getOrgScope(req),
        status: "COMPLETED",
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(campaigns);
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while fetching completed campaigns",
    });
  }
};

export const getCampaignById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, ...getOrgScope(req) },
      include: {
        sender: { select: { id: true, email: true, name: true, isVerified: true } },
        emails: {
          orderBy: { scheduledAt: "asc" },
          include: { sender: { select: { id: true, email: true, name: true } } },
        },
        campaignSenders: {
          orderBy: { rotationOrder: "asc" },
          include: { sender: { select: { id: true, email: true, name: true, dailyLimit: true } } },
        },
      },
    });

    if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return; }

    const _count = campaign.emails.reduce((acc, e) => {
      if (e.status === "PENDING") acc.pending++;
      else if (e.status === "SENDING") acc.sending++;
      else if (e.status === "SENT") acc.sent++;
      else if (e.status === "FAILED") acc.failed++;
      else if (e.status === "CANCELLED") acc.cancelled++;
      return acc;
    }, { pending: 0, sending: 0, sent: 0, failed: 0, cancelled: 0 });

    if (
      (campaign.status === "SENDING" || campaign.status === "SCHEDULED") &&
      _count.pending === 0 &&
      _count.sending === 0
    ) {
      const completed = await checkAndCompleteCampaign(id);
      if (completed) campaign.status = "COMPLETED";
    }

    let senderPool = campaign.campaignSenders.map(cs => ({
      senderId: cs.sender.id,
      email: cs.sender.email,
      name: cs.sender.name,
      dailyLimit: cs.sender.dailyLimit,
      rotationOrder: cs.rotationOrder,
    }));

    if (senderPool.length === 0 && campaign.sender) {
      senderPool = [{
        senderId: campaign.sender.id,
        email: campaign.sender.email,
        name: campaign.sender.name,
        dailyLimit: 0,
        rotationOrder: 0,
      }];
    }

    const senderStatsMap = new Map<string, { sent: number; failed: number; pending: number }>();
    for (const s of senderPool) {
      senderStatsMap.set(s.senderId, { sent: 0, failed: 0, pending: 0 });
    }
    for (const email of campaign.emails) {
      const sid = email.senderId;
      if (!sid) continue;
      const stats = senderStatsMap.get(sid);
      if (!stats) continue;
      if (email.status === "SENT") stats.sent++;
      else if (email.status === "FAILED") stats.failed++;
      else if (email.status === "PENDING" || email.status === "SENDING") stats.pending++;
    }
    const senderStats = senderPool.map(s => ({
      ...s,
      ...senderStatsMap.get(s.senderId)!,
    }));

    let effectiveSendRate = 0;
    const activeThrottleReasons: string[] = [];

    for (const s of senderPool) {
      const limits = await getEffectiveLimits(s.senderId);
      effectiveSendRate += limits.perMinute;

      if (limits.isThrottled && !activeThrottleReasons.includes("error-throttled")) {
        activeThrottleReasons.push("error-throttled");
      }
      if (limits.isWarmup && !activeThrottleReasons.includes("warmup")) {
        activeThrottleReasons.push("warmup");
      }
      if (limits.isCooldown && !activeThrottleReasons.includes("rate-limited")) {
        activeThrottleReasons.push("rate-limited");
      }
    }

    const pendingCount = _count.pending + _count.sending;
    const estimatedCompletionTime =
      effectiveSendRate > 0 ? Math.ceil(pendingCount / effectiveSendRate) : null;

    res.status(200).json({
      ...campaign,
      senderPool,
      senderStats,
      _count,
      effectiveSendRate,
      activeThrottleReasons,
      estimatedCompletionTime,
    });
  } catch (error: any) {
    logger.error({ err: error }, "Error in getCampaignById");
    res.status(500).json({ message: "Error fetching campaign" });
  }
};

export const searchCampaigns = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const q = req.query.q as string | undefined;
    const status = req.query.status as string | undefined;
    const senderId = req.query.senderId as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    for (const check of [
      validateSearchQuery(q),
      validateStatusParam(status, CAMPAIGN_STATUS_VALUES),
      validateDateRange(dateFrom, dateTo),
    ]) {
      if (!check.valid) {
        res.status(check.error!.status).json({ message: check.error!.message });
        return;
      }
    }

    const conditions: Prisma.EmailCampaignWhereInput[] = [];

    if (q) {
      conditions.push({
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (status) conditions.push({ status: status as CampaignStatus });
    if (senderId) conditions.push({ senderId });
    if (dateFrom) conditions.push({ createdAt: { gte: new Date(dateFrom) } });
    if (dateTo) conditions.push({ createdAt: { lte: new Date(dateTo) } });

    const where: Prisma.EmailCampaignWhereInput = { ...scope };
    if (conditions.length > 0) where.AND = conditions;

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        include: {
          sender: { select: { id: true, email: true, name: true, isVerified: true } },
          _count: { select: { emails: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    const campaignIds = campaigns.map(c => c.id);
    const emailCounts = campaignIds.length > 0 ? await prisma.emailJob.groupBy({
      by: ["campaignId", "status"],
      where: { campaignId: { in: campaignIds } },
      _count: { _all: true },
    }) : [];

    const countMap: Record<string, Record<string, number>> = {};
    for (const c of emailCounts) {
      if (!countMap[c.campaignId]) countMap[c.campaignId] = {};
      countMap[c.campaignId][c.status] = c._count._all;
    }

    const results = campaigns.map(c => ({
      ...c,
      emailCounts: {
        pending: countMap[c.id]?.PENDING ?? 0,
        sending: countMap[c.id]?.SENDING ?? 0,
        sent: countMap[c.id]?.SENT ?? 0,
        failed: countMap[c.id]?.FAILED ?? 0,
        cancelled: countMap[c.id]?.CANCELLED ?? 0,
      },
    }));

    res.status(200).json({
      results,
      total,
      filters: { q, status, senderId, dateFrom, dateTo },
    });
  } catch (error: any) {
    res.status(500).json({ message: "An error occurred while searching" });
  }
};
