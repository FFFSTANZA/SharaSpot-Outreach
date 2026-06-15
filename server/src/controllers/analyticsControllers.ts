import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { getOrgScope } from "../utils/orgScope";
import os from "os";
import { logger } from "../utils/logger";

interface PlatformBreakdown {
  platform: string;
  count: number;
  percentage: number;
}

interface DeviceBreakdown {
  device: string;
  count: number;
  percentage: number;
}

interface TimeSeriesPoint {
  date: string;
  opens: number;
  clicks: number;
  replies: number;
  sent: number;
}

async function verifyUser(req: Request, res: Response): Promise<string | null> {
  if (!req.user?.id) { res.status(401).json({ message: "Unauthorized" }); return null; }
  return req.user.id;
}

async function getPlatformBreakdown(campaignIds: string[]): Promise<PlatformBreakdown[]> {
  const events = await prisma.trackingEvent.findMany({
    where: { emailJob: { campaignId: { in: campaignIds } }, NOT: [{ platform: null }] },
    select: { platform: true },
  });

  const countMap = new Map<string, number>();
  for (const e of events) {
    const p = e.platform || "unknown";
    countMap.set(p, (countMap.get(p) || 0) + 1);
  }

  const total = events.length;
  return Array.from(countMap.entries()).map(([platform, count]) => ({
    platform,
    count,
    percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
  })).sort((a, b) => b.count - a.count);
}

async function getDeviceBreakdown(campaignIds: string[]): Promise<DeviceBreakdown[]> {
  const mobileEvents = await prisma.trackingEvent.count({
    where: { emailJob: { campaignId: { in: campaignIds } }, isMobile: true },
  });
  const desktopEvents = await prisma.trackingEvent.count({
    where: { emailJob: { campaignId: { in: campaignIds } }, isDesktop: true },
  });
  const botEvents = await prisma.trackingEvent.count({
    where: { emailJob: { campaignId: { in: campaignIds } }, isBot: true },
  });

  const total = mobileEvents + desktopEvents + botEvents;
  const breakdown: DeviceBreakdown[] = [
    { device: "desktop", count: desktopEvents, percentage: total > 0 ? Math.round((desktopEvents / total) * 1000) / 10 : 0 },
    { device: "mobile", count: mobileEvents, percentage: total > 0 ? Math.round((mobileEvents / total) * 1000) / 10 : 0 },
    { device: "bot", count: botEvents, percentage: total > 0 ? Math.round((botEvents / total) * 1000) / 10 : 0 },
  ];
  return breakdown.filter(d => d.count > 0).sort((a, b) => b.count - a.count);
}

async function getEngagementScore(totalSent: number, opens: number, clicks: number, replies: number): Promise<number> {
  if (totalSent === 0) return 0;
  const openWeight = 0.3;
  const clickWeight = 0.4;
  const replyWeight = 0.3;

  const openScore = (opens / totalSent) * 100 * openWeight;
  const clickScore = (clicks / totalSent) * 100 * clickWeight;
  const replyScore = (replies / totalSent) * 100 * replyWeight;

  return Math.min(100, Math.round(openScore + clickScore + replyScore));
}

async function getTimeSeriesData(campaignIds: string[], since: Date): Promise<TimeSeriesPoint[]> {
  const sentJobs = await prisma.emailJob.findMany({
    where: { campaignId: { in: campaignIds }, status: "SENT", scheduledAt: { gte: since } },
    select: { scheduledAt: true },
  });

  const openEvents = await prisma.trackingEvent.findMany({
    where: { emailJob: { campaignId: { in: campaignIds } }, eventType: "OPEN", createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const clickEvents = await prisma.trackingEvent.findMany({
    where: { emailJob: { campaignId: { in: campaignIds } }, eventType: "CLICK", createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const replyJobs = await prisma.emailJob.findMany({
    where: { campaignId: { in: campaignIds }, isReplied: true, updatedAt: { gte: since } },
    select: { updatedAt: true },
  });

  const dayMap = new Map<string, TimeSeriesPoint>();
  const addToDay = (date: Date | null, key: keyof TimeSeriesPoint, value: number) => {
    if (!date) return;
    const day = date.toISOString().slice(0, 10);
    if (!dayMap.has(day)) {
      dayMap.set(day, { date: day, opens: 0, clicks: 0, replies: 0, sent: 0 });
    }
    const entry = dayMap.get(day)!;
    if (key === "opens") entry.opens += value;
    else if (key === "clicks") entry.clicks += value;
    else if (key === "replies") entry.replies += value;
    else if (key === "sent") entry.sent += value;
  };

  for (const j of sentJobs) addToDay(j.scheduledAt, "sent", 1);
  for (const e of openEvents) addToDay(e.createdAt, "opens", 1);
  for (const e of clickEvents) addToDay(e.createdAt, "clicks", 1);
  for (const j of replyJobs) addToDay(j.updatedAt, "replies", 1);

  return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

interface HourlyHeatmapPoint {
  hour: number;
  opens: number;
  clicks: number;
}

function generateHourlyHeatmap(campaignIds: string[], since: Date): HourlyHeatmapPoint[] {
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, opens: 0, clicks: 0 }));
}

/**
 * GET /api/analytics/overview
 * Cross-campaign aggregate analytics with enhanced metrics.
 */
export const getAnalyticsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;

    const { days } = req.query;
    const dayCount = days ? parseInt(days as string, 10) : 30;
    const since = new Date();
    since.setDate(since.getDate() - dayCount);

    const scope = getOrgScope(req);
    const campaigns = await prisma.emailCampaign.findMany({
      where: { ...scope },
      select: { id: true, trackOpens: true, trackClicks: true, subject: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    const totalCampaigns = campaigns.length;
    const totalSent = await prisma.emailJob.count({
      where: { campaignId: { in: campaignIds }, status: "SENT" },
    });
    const totalBounced = await prisma.emailJob.count({
      where: { campaignId: { in: campaignIds }, status: "FAILED" },
    });
    const totalReplied = await prisma.emailJob.count({
      where: { campaignId: { in: campaignIds }, status: "SENT", isReplied: true },
    });

    const uniqueOpens = await prisma.trackingEvent.groupBy({
      by: ["emailJobId"],
      where: { emailJob: { campaignId: { in: campaignIds } }, eventType: "OPEN" },
    });

    const uniqueClicks = await prisma.trackingEvent.groupBy({
      by: ["emailJobId"],
      where: { emailJob: { campaignId: { in: campaignIds } }, eventType: "CLICK" },
    });

    const totalOpens = await prisma.trackingEvent.count({
      where: { emailJob: { campaignId: { in: campaignIds } }, eventType: "OPEN" },
    });
    const totalClicks = await prisma.trackingEvent.count({
      where: { emailJob: { campaignId: { in: campaignIds } }, eventType: "CLICK" },
    });

    const uniqueOpensCount = uniqueOpens.length;
    const uniqueClicksCount = uniqueClicks.length;
    const openRate = totalSent > 0 ? Math.round((uniqueOpensCount / totalSent) * 1000) / 10 : 0;
    const clickRate = totalSent > 0 ? Math.round((uniqueClicksCount / totalSent) * 1000) / 10 : 0;
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0;

    const uniqueClickers = uniqueClicksCount;
    const uniqueOpeners = uniqueOpensCount;
    const clickToOpenRatio = uniqueOpeners > 0 ? Math.round((uniqueClickers / uniqueOpeners) * 1000) / 10 : 0;

    const platformBreakdown = await getPlatformBreakdown(campaignIds);
    const deviceBreakdown = await getDeviceBreakdown(campaignIds);
    const timeSeries = await getTimeSeriesData(campaignIds, since);
    const engagementScore = await getEngagementScore(totalSent, totalOpens, totalClicks, totalReplied);

    const topCampaigns = await prisma.emailCampaign.findMany({
      where: { ...scope },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        trackOpens: true,
        trackClicks: true,
        _count: {
          select: {
            emails: { where: { status: "SENT" } }
          }
        }
      }
    });

    const enrichedCampaigns = await Promise.all(
      topCampaigns.map(async (c) => {
        const opens = await prisma.trackingEvent.count({
          where: { emailJob: { campaignId: c.id }, eventType: "OPEN" },
        });
        const clicks = await prisma.trackingEvent.count({
          where: { emailJob: { campaignId: c.id }, eventType: "CLICK" },
        });
        const replies = await prisma.emailJob.count({
          where: { campaignId: c.id, isReplied: true },
        });
        return {
          id: c.id,
          subject: c.subject,
          sent: c._count.emails,
          opens,
          clicks,
          replies,
          openRate: c._count.emails > 0 ? Math.round((opens / c._count.emails) * 1000) / 10 : 0,
          clickRate: c._count.emails > 0 ? Math.round((clicks / c._count.emails) * 1000) / 10 : 0,
          replyRate: c._count.emails > 0 ? Math.round((replies / c._count.emails) * 1000) / 10 : 0,
          createdAt: c.createdAt,
        };
      })
    );

    res.status(200).json({
      totalCampaigns,
      totalSent,
      totalOpens,
      totalClicks,
      uniqueOpens: uniqueOpensCount,
      uniqueClicks: uniqueClicksCount,
      totalReplied,
      totalBounced,
      openRate,
      clickRate,
      replyRate,
      dailySeries: timeSeries,
      hourlySeries: generateHourlyHeatmap(campaignIds, since),
      topCampaigns: enrichedCampaigns,
      platformBreakdown,
      deviceBreakdown,
      engagementScore,
      timeSeries,
    });
  } catch (error) {
    logger.error({ error }, "Analytics overview error");
    res.status(500).json({ message: "Error fetching analytics overview" });
  }
};

/**
 * GET /api/analytics/links
 * Aggregate click data across all campaigns.
 */
export const getAnalyticsLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;

    const scope = getOrgScope(req);
    const campaigns = await prisma.emailCampaign.findMany({
      where: { ...scope },
      select: { id: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    const clickEvents = await prisma.trackingEvent.findMany({
      where: {
        emailJob: { campaignId: { in: campaignIds } },
        eventType: "CLICK",
        url: { not: null },
      },
      select: { url: true, createdAt: true },
    });

    const urlMap = new Map<string, { count: number; lastClicked: string | null }>();
    for (const ev of clickEvents) {
      if (!ev.url) continue;
      const existing = urlMap.get(ev.url);
      if (existing) {
        existing.count++;
        if (ev.createdAt) {
          const ts = ev.createdAt.toISOString();
          if (!existing.lastClicked || ts > existing.lastClicked) {
            existing.lastClicked = ts;
          }
        }
      } else {
        urlMap.set(ev.url, { count: 1, lastClicked: ev.createdAt?.toISOString() ?? null });
      }
    }

    const links = Array.from(urlMap.entries())
      .map(([url, data]) => ({ url, ...data }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json({ links });
  } catch (error) {
    logger.error({ error }, "Analytics links error");
    res.status(500).json({ message: "Error fetching analytics links" });
  }
};

/**
 * GET /api/analytics/sender-health
 */
export const getSenderHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;

    const scope = getOrgScope(req);
    const health = await prisma.dailySenderHealth.findMany({
      where: { sender: { ...scope } },
      include: {
        sender: {
          select: { email: true, name: true }
        }
      },
      orderBy: { date: "desc" },
      take: 50 // Last 50 health checks
    });

    res.json({ health });
  } catch (error) {
    res.status(500).json({ message: "Error fetching sender health" });
  }
};

/**
 * GET /api/analytics/activity-logs
 * Paginated tracking events
 */
export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const scope = getOrgScope(req);
    const logs = await prisma.trackingEvent.findMany({
      where: {
        emailJob: { campaign: { ...scope } }
      },
      include: {
        emailJob: {
          select: {
            toEmail: true,
            campaign: { select: { subject: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit)
    });

    const total = await prisma.trackingEvent.count({
      where: { emailJob: { campaign: { ...scope } } }
    });

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs" });
  }
};

/**
 * GET /api/analytics/dashboard-stats
 * Lightweight summary for the main dashboard strip.
 * Includes worker health status.
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;

    const scope = getOrgScope(req);
    const campaigns = await prisma.emailCampaign.findMany({
      where: { ...scope },
      select: { id: true }
    });
    const campaignIds = campaigns.map(c => c.id);

    // 2. Fetch Aggregated Email Status Counts
    const counts = await prisma.emailJob.groupBy({
      by: ["status"],
      where: { campaignId: { in: campaignIds } },
      _count: { _all: true }
    });

    const statusMap: Record<string, number> = {
      SENT: 0,
      FAILED: 0,
      PENDING: 0,
      SENDING: 0,
      CANCELLED: 0
    };

    counts.forEach(c => {
      statusMap[c.status] = c._count._all;
    });

    // 3. Replied Count
    const totalReplied = await prisma.emailJob.count({
      where: { campaignId: { in: campaignIds }, status: "SENT", isReplied: true }
    });

    // 4. Calculate Efficiency & Rate
    const totalAttempted = statusMap.SENT + statusMap.FAILED;
    const efficiency = totalAttempted > 0 ? Math.round((statusMap.SENT / totalAttempted) * 100) : 100;
    const replyRate = statusMap.SENT > 0 ? Math.round((totalReplied / statusMap.SENT) * 1000) / 10 : 0;

    // 5. Worker Health (Redis Heartbeat)
    let workerStatus = "down";
    let workerTelemetry = null;
    try {
      const lastHeartbeat = await redis.get("worker:last_heartbeat");
      if (lastHeartbeat) {
        const diff = Date.now() - parseInt(lastHeartbeat, 10);
        workerStatus = diff < 65000 ? "up" : "stale"; // 65s buffer for 30s heartbeat

        if (workerStatus !== "down") {
          const stats = await redis.get("worker:stats");
          if (stats) workerTelemetry = JSON.parse(stats);
        }
      }
    } catch (err) {
      logger.error({ err }, "[Stats] Redis health check failed");
    }

    res.status(200).json({
      total: statusMap.SENT + statusMap.FAILED + statusMap.PENDING + statusMap.SENDING + statusMap.CANCELLED,
      sent: statusMap.SENT,
      failed: statusMap.FAILED,
      pending: statusMap.PENDING + statusMap.SENDING,
      replied: totalReplied,
      efficiency,
      replyRate,
      worker: {
        status: workerStatus,
        telemetry: workerTelemetry
      }
    });
  } catch (error) {
    logger.error({ error }, "Dashboard stats error");
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};
