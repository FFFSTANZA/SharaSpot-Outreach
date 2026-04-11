import { Request, Response } from "express";
import { prisma } from "../config/prisma";

/**
 * Helper: verify campaign exists and is owned by the authenticated user.
 */
async function verifyCampaignOwnership(req: Request, res: Response): Promise<{ id: string; trackOpens: boolean; trackClicks: boolean } | null> {
  const campaignId = req.params.campaignId as string;
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, userId: true, trackOpens: true, trackClicks: true },
  });
  if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return null; }
  if (campaign.userId !== req.user!.id) { res.status(403).json({ message: "Forbidden" }); return null; }
  return campaign;
}

/**
 * GET /api/tracking/campaigns/:campaignId
 * Returns campaign-level tracking metrics.
 */
export const getCampaignTrackingMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const totalSent = await prisma.emailJob.count({
      where: { campaignId: campaign.id, status: "SENT" },
    });

    const repliedCount = await prisma.emailJob.count({
      where: { campaignId: campaign.id, status: "SENT", isReplied: true },
    });

    const uniqueOpens = await prisma.trackingEvent.groupBy({
      by: ["emailJobId"],
      where: { emailJob: { campaignId: campaign.id }, eventType: "OPEN" },
    });

    const uniqueClicks = await prisma.trackingEvent.groupBy({
      by: ["emailJobId"],
      where: { emailJob: { campaignId: campaign.id }, eventType: "CLICK" },
    });

    const openRate = totalSent > 0
      ? Math.round((uniqueOpens.length / totalSent) * 1000) / 10
      : 0;
    const clickRate = totalSent > 0
      ? Math.round((uniqueClicks.length / totalSent) * 1000) / 10
      : 0;
    const replyRate = totalSent > 0
      ? Math.round((repliedCount / totalSent) * 1000) / 10
      : 0;

    res.status(200).json({
      campaignId: campaign.id,
      totalSent,
      repliedCount,
      uniqueOpens: uniqueOpens.length,
      uniqueClicks: uniqueClicks.length,
      notOpened: totalSent - uniqueOpens.length,
      openRate,
      clickRate,
      replyRate,
      trackOpens: campaign.trackOpens,
      trackClicks: campaign.trackClicks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tracking metrics" });
  }
};

/**
 * GET /api/tracking/campaigns/:campaignId/emails
 * Returns per-email tracking details.
 */
export const getCampaignTrackingEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const emailJobs = await prisma.emailJob.findMany({
      where: { campaignId: campaign.id, status: "SENT" },
      select: {
        id: true,
        toEmail: true,
        trackingEvents: {
          select: { eventType: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    const emails = emailJobs.map((job) => {
      const opens = job.trackingEvents.filter((e) => e.eventType === "OPEN");
      const clicks = job.trackingEvents.filter((e) => e.eventType === "CLICK");
      return {
        emailJobId: job.id,
        toEmail: job.toEmail,
        openCount: opens.length,
        clickCount: clicks.length,
        lastOpenAt: opens[0]?.createdAt?.toISOString() ?? null,
        lastClickAt: clicks[0]?.createdAt?.toISOString() ?? null,
      };
    });

    res.status(200).json({ emails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tracking emails" });
  }
};

/**
 * GET /api/tracking/campaigns/:campaignId/links
 * Returns per-link click counts.
 */
export const getCampaignTrackingLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const clickEvents = await prisma.trackingEvent.findMany({
      where: {
        emailJob: { campaignId: campaign.id },
        eventType: "CLICK",
        url: { not: null },
      },
      select: { url: true },
    });

    // Aggregate click counts by URL
    const urlCounts = new Map<string, number>();
    for (const event of clickEvents) {
      if (event.url) {
        urlCounts.set(event.url, (urlCounts.get(event.url) ?? 0) + 1);
      }
    }

    const links = Array.from(urlCounts.entries())
      .map(([url, clickCount]) => ({ url, clickCount }))
      .sort((a, b) => b.clickCount - a.clickCount);

    res.status(200).json({ links });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tracking links" });
  }
};

/**
 * GET /api/tracking/campaigns/:campaignId/link-analytics
 * Returns detailed link analytics with per-email breakdown.
 */
export const getCampaignLinkAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const clickEvents = await prisma.trackingEvent.findMany({
      where: {
        emailJob: { campaignId: campaign.id },
        eventType: "CLICK",
        url: { not: null },
      },
      select: {
        url: true,
        createdAt: true,
        emailJob: {
          select: {
            id: true,
            toEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    interface LinkEmailDetail {
      emailJobId: string;
      toEmail: string;
      clickedAt: string;
    }

    interface LinkAnalyticsInternal {
      url: string;
      totalClicks: number;
      uniqueEmailIds: Set<string>;
      emails: LinkEmailDetail[];
    }

    interface LinkAnalytics {
      url: string;
      totalClicks: number;
      uniqueEmails: number;
      emails: LinkEmailDetail[];
    }

    const linkMap = new Map<string, LinkAnalyticsInternal>();

    for (const event of clickEvents) {
      if (!event.url) continue;

      if (!linkMap.has(event.url)) {
        linkMap.set(event.url, {
          url: event.url,
          totalClicks: 0,
          uniqueEmailIds: new Set<string>(),
          emails: [],
        });
      }

      const link = linkMap.get(event.url)!;
      link.totalClicks++;
      if (!link.uniqueEmailIds.has(event.emailJob.id)) {
        link.uniqueEmailIds.add(event.emailJob.id);
        link.emails.push({
          emailJobId: event.emailJob.id,
          toEmail: event.emailJob.toEmail,
          clickedAt: event.createdAt.toISOString(),
        });
      }
    }

    const links: LinkAnalytics[] = Array.from(linkMap.values())
      .map((l) => ({
        url: l.url,
        totalClicks: l.totalClicks,
        uniqueEmails: l.uniqueEmailIds.size,
        emails: l.emails,
      }))
      .sort((a, b) => b.totalClicks - a.totalClicks);

    res.status(200).json({ links });
  } catch (error) {
    res.status(500).json({ message: "Error fetching link analytics" });
  }
};
