import { Request, Response } from "express";
import { prisma } from "../config/prisma";

async function verifyUser(req: Request, res: Response): Promise<string | null> {
  if (!req.user?.id) { res.status(401).json({ message: "Unauthorized" }); return null; }
  return req.user.id;
}

/**
 * GET /api/analytics/overview
 * Cross-campaign aggregate analytics.
 */
export const getAnalyticsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;

    const { days } = req.query;
    const dayCount = days ? parseInt(days as string, 10) : 30;
    const since = new Date();
    since.setDate(since.getDate() - dayCount);

    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId },
      select: { id: true, trackOpens: true, trackClicks: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    const totalCampaigns = campaigns.length;
    const totalSent = await prisma.emailJob.count({
      where: { campaignId: { in: campaignIds }, status: "SENT" },
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

    const openRate = totalSent > 0 ? Math.round((uniqueOpens.length / totalSent) * 1000) / 10 : 0;
    const clickRate = totalSent > 0 ? Math.round((uniqueClicks.length / totalSent) * 1000) / 10 : 0;
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0;

    // Time-series data: daily open/click/reply counts
    const events = await prisma.trackingEvent.findMany({
      where: {
        emailJob: { campaignId: { in: campaignIds } },
        createdAt: { gte: since },
      },
      select: { eventType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<string, { opens: number; clicks: number; replies: number }>();
    for (let i = 0; i < dayCount; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (dayCount - 1 - i));
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { opens: 0, clicks: 0, replies: 0 });
    }

    for (const ev of events) {
      const key = ev.createdAt.toISOString().slice(0, 10);
      if (!dailyMap.has(key)) continue;
      const entry = dailyMap.get(key)!;
      if (ev.eventType === "OPEN") entry.opens++;
      else if (ev.eventType === "CLICK") entry.clicks++;
      else if (ev.eventType === "REPLY") entry.replies++;
    }

    const dailySeries = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Hourly heatmap: which hours get the most opens/clicks
    const hourlyMap = new Map<number, { opens: number; clicks: number }>();
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { opens: 0, clicks: 0 });
    }
    for (const ev of events) {
      const h = ev.createdAt.getUTCHours();
      const entry = hourlyMap.get(h)!;
      if (ev.eventType === "OPEN") entry.opens++;
      else if (ev.eventType === "CLICK") entry.clicks++;
    }
    const hourlySeries = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour - b.hour);

    // Top performing campaigns
    const campaignMetrics = await Promise.all(
      campaigns.map(async (c) => {
        const sent = await prisma.emailJob.count({
          where: { campaignId: c.id, status: "SENT" },
        });
        const opens = await prisma.trackingEvent.groupBy({
          by: ["emailJobId"],
          where: { emailJob: { campaignId: c.id }, eventType: "OPEN" },
        });
        const clicks = await prisma.trackingEvent.groupBy({
          by: ["emailJobId"],
          where: { emailJob: { campaignId: c.id }, eventType: "CLICK" },
        });
        const replied = await prisma.emailJob.count({
          where: { campaignId: c.id, status: "SENT", isReplied: true },
        });
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id: c.id },
          select: { subject: true, createdAt: true },
        });
        return {
          id: c.id,
          subject: campaign?.subject ?? "Untitled",
          sent,
          opens: opens.length,
          clicks: clicks.length,
          replied,
          openRate: sent > 0 ? Math.round((opens.length / sent) * 1000) / 10 : 0,
          clickRate: sent > 0 ? Math.round((clicks.length / sent) * 1000) / 10 : 0,
          replyRate: sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0,
          createdAt: campaign?.createdAt,
        };
      })
    );

    const topCampaigns = campaignMetrics
      .filter((c) => c.sent > 0)
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);

    res.status(200).json({
      totalCampaigns,
      totalSent,
      totalOpens,
      totalClicks,
      uniqueOpens: uniqueOpens.length,
      uniqueClicks: uniqueClicks.length,
      totalReplied,
      openRate,
      clickRate,
      replyRate,
      dailySeries,
      hourlySeries,
      topCampaigns,
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
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

    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId },
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
    console.error("Analytics links error:", error);
    res.status(500).json({ message: "Error fetching analytics links" });
  }
};
