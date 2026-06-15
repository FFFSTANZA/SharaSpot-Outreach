import { Router } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { SubscriptionStatus, CampaignStatus, EmailStatus, TrackingEventType } from "@prisma/client";
import { logger } from "../utils/logger";

const router = Router();

if (!process.env.ADMIN_SECRET_KEY) {
  logger.error("[ADMIN] CRITICAL: ADMIN_SECRET_KEY environment variable is not set. Admin endpoints are disabled.");
}

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

function verifyAdminSecret(req: any, res: any, next: any) {
  if (!ADMIN_SECRET) {
    return res.status(503).json({ error: "Admin interface not configured" });
  }

  const secret = req.headers["x-admin-secret"];

  if (!secret || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

router.get("/metrics", verifyAdminSecret, async (req, res) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      premiumUsers,
      trialUsers,
      totalSenders,
      verifiedSenders,
      totalCampaigns,
      campaignByStatus,
      totalEmails,
      emailByStatus,
      trackingByType,
      totalContacts,
      totalSequences,
      recentUsers,
      recentCampaigns,
      recentEmails,
      redisPing,
      lastHeartbeat,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({
        where: {
          OR: [
            { status: SubscriptionStatus.ACTIVE, currentPeriodEnd: { gt: new Date() } },
            { trialEnd: { gt: new Date() } },
          ],
        },
      }),
      prisma.subscription.count({
        where: { trialEnd: { gt: new Date() } },
      }),
      prisma.sender.count(),
      prisma.sender.count({ where: { isVerified: true } }),
      prisma.emailCampaign.count(),
      prisma.emailCampaign.groupBy({ by: ["status"], _count: true }),
      prisma.emailJob.count(),
      prisma.emailJob.groupBy({ by: ["status"], _count: true }),
      prisma.trackingEvent.groupBy({ by: ["eventType"], _count: true }),
      prisma.contact.count(),
      prisma.sequenceStep.count(),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.emailCampaign.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.emailJob.count({
        where: { status: EmailStatus.SENT, sentAt: { gte: last7Days } },
      }),
      redis.ping().catch(() => "down"),
      redis.get("worker:last_heartbeat").catch(() => null),
    ]);

    const isRedisUp = redisPing === "PONG";
    let workerStatus = "down";
    if (lastHeartbeat) {
      const diff = Date.now() - parseInt(lastHeartbeat, 10);
      workerStatus = diff < 65000 ? "up" : "stale";
    }

    const campaignStatusMap = campaignByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const emailStatusMap = emailByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const trackingMap = trackingByType.reduce((acc, item) => {
      acc[item.eventType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const metrics = {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: totalUsers - premiumUsers,
        trial: trialUsers,
      },
      senders: {
        total: totalSenders,
        verified: verifiedSenders,
        unverified: totalSenders - verifiedSenders,
      },
      campaigns: {
        total: totalCampaigns,
        scheduled: campaignStatusMap[CampaignStatus.SCHEDULED] || 0,
        sending: campaignStatusMap[CampaignStatus.SENDING] || 0,
        paused: campaignStatusMap[CampaignStatus.PAUSED] || 0,
        cancelled: campaignStatusMap[CampaignStatus.CANCELLED] || 0,
        completed: campaignStatusMap[CampaignStatus.COMPLETED] || 0,
      },
      emails: {
        total: totalEmails,
        pending: emailStatusMap[EmailStatus.PENDING] || 0,
        sending: emailStatusMap[EmailStatus.SENDING] || 0,
        sent: emailStatusMap[EmailStatus.SENT] || 0,
        failed: emailStatusMap[EmailStatus.FAILED] || 0,
      },
      tracking: {
        opens: trackingMap[TrackingEventType.OPEN] || 0,
        clicks: trackingMap[TrackingEventType.CLICK] || 0,
        replies: trackingMap[TrackingEventType.REPLY] || 0,
        bounces: trackingMap[TrackingEventType.BOUNCE] || 0,
      },
      contacts: {
        total: totalContacts,
      },
      sequences: {
        total: totalSequences,
      },
      recentActivity: {
        usersCreated: recentUsers,
        campaignsCreated: recentCampaigns,
        emailsSent: recentEmails,
      },
      calculated: {
        openRate: (emailStatusMap[EmailStatus.SENT] || 0) > 0
          ? ((trackingMap[TrackingEventType.OPEN] || 0) / (emailStatusMap[EmailStatus.SENT] || 1) * 100).toFixed(1)
          : "0.0",
      },
      system: {
        redis: isRedisUp ? "up" : "down",
        worker: workerStatus,
      },
    };

    res.json(metrics);
  } catch (error) {
    logger.error({ error }, "[ADMIN-METRICS] Error:");
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

export default router;