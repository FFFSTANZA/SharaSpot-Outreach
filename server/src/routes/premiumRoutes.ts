import { Router, Request, Response } from "express";
import { analyzeSpamScore } from "../utils/spamDetector";
import { generateCalendlyUrl, verifyCalendlyLink } from "../utils/calendlyIntegration";
import { prisma } from "../config/prisma";
import { requirePremium } from "../utils/premiumCheck";
import { getPriorityQuotaStatus } from "../utils/prioritySafetyLimits";
import { logger } from "../utils/logger";

const router = Router();

// ---------------------------------------------------------------------------
// SPAM CHECK ENDPOINT
// ---------------------------------------------------------------------------
// POST /api/premium/analyze-spam
// Body: { subject: string, body: string, html?: string }
// Returns: { score: number, level: string, checks: [], suggestions: [] }
// ---------------------------------------------------------------------------
router.post(
  "/analyze-spam",
  async (req: Request, res: Response) => {
    try {
      const { subject, body, html } = req.body as {
        subject?: string;
        body?: string;
        html?: string;
      };

      if (!subject && !body) {
        return res.status(400).json({
          error: "At least subject or body is required",
        });
      }

      const result = analyzeSpamScore(
        subject || "",
        body || ""
      );

      res.json(result);
    } catch (error) {
      logger.error({ error }, "[SPAM ANALYZE ERROR]");
      res.status(500).json({ error: "Failed to analyze spam score" });
    }
  }
);

// ---------------------------------------------------------------------------
// CALENDLY LINK GENERATOR
// ---------------------------------------------------------------------------
// POST /api/premium/calendly/generate
// Body: { username: string, eventType?: string, prefill?: { name, email, company } }
// Returns: { url: string, button: { html, text } }
// ---------------------------------------------------------------------------
router.post(
  "/calendly/generate",
  async (req: Request, res: Response) => {
    try {
      const { username, eventType, prefill } = req.body as {
        username: string;
        eventType?: string;
        prefill?: {
          name?: string;
          email?: string;
          company?: string;
        };
      };

      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const url = generateCalendlyUrl(
        { username, eventType },
        prefill || {}
      );

      const button = prefill
        ? {
          html: `<a href="${url}" style="display:inline-block;padding:12px 24px;background-color:#3B82F6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Book a Time</a>`,
          text: `Book a time: ${url}`,
        }
        : { html: "", text: "" };

      res.json({ url, button });
    } catch (error) {
      logger.error({ error }, "[CALENDLY GEN ERROR]");
      res.status(500).json({ error: "Failed to generate Calendly URL" });
    }
  }
);

// ---------------------------------------------------------------------------
// CALENDLY LINK VERIFIER
// ---------------------------------------------------------------------------
// POST /api/premium/calendly/verify
// Body: { calendlyUrl: string, apiToken?: string }
// Returns: { valid: boolean, username?: string, eventType?: string }
// ---------------------------------------------------------------------------
router.post(
  "/calendly/verify",
  async (req: Request, res: Response) => {
    try {
      const { calendlyUrl, apiToken } = req.body as {
        calendlyUrl: string;
        apiToken?: string;
      };

      if (!calendlyUrl) {
        return res.status(400).json({ error: "Calendly URL is required" });
      }

      const result = verifyCalendlyLink(calendlyUrl, apiToken);

      res.json(result);
    } catch (error) {
      logger.error({ error }, "[CALENDLY VERIFY ERROR]");
      res.status(500).json({ error: "Failed to verify Calendly link" });
    }
  }
);

// ---------------------------------------------------------------------------
// WEBHOOK HANDLER for Calendly events
// ---------------------------------------------------------------------------
// POST /api/premium/calendly/webhook
// Headers: Calendly-Signature (for verification)
// Body: Calendly webhook payload
// ---------------------------------------------------------------------------
router.post(
  "/calendly/webhook",
  async (req: Request, res: Response) => {
    try {
      const { event, payload } = req.body as {
        event: string;
        payload: {
          invitee: {
            email: string;
            name: string;
          };
          scheduling_link?: {
            name?: string;
          };
        };
      };

      // Verify webhook signature if token is configured
      const webhookToken = process.env.CALENDLY_WEBHOOK_SECRET;
      const signature = req.headers["calendly-signature"] as string;

      if (webhookToken && signature !== webhookToken) {
        logger.warn("[CALENDLY WEBHOOK] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      if (event === "invitee.created") {
        // Meeting was booked
        logger.info({ email: payload.invitee.email, name: payload.invitee.name, event: payload.scheduling_link?.name }, "[CALENDLY] Meeting booked:");
      } else if (event === "invitee.canceled") {
        // Meeting was cancelled
        logger.info({ email: payload.invitee.email, name: payload.invitee.name }, "[CALENDLY] Meeting cancelled:");
      }

      res.json({ received: true });
    } catch (error) {
      logger.error({ error }, "[CALENDLY WEBHOOK ERROR]");
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// ---------------------------------------------------------------------------
// PRIORITY MAIL - GET QUOTA
// ---------------------------------------------------------------------------
// GET /api/premium/priority/quota
// Returns: { used, limit, remaining, resetTime }
router.get(
  "/priority/quota",
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Check premium
      const premiumCheck = await requirePremium(userId, "Priority Mail");
      if (!premiumCheck.allowed) {
        return res.status(403).json({ error: premiumCheck.message });
      }

      const quota = await getPriorityQuotaStatus(userId);

      res.json(quota);
    } catch (error) {
      logger.error({ error }, "[PRIORITY QUOTA ERROR]");
      res.status(500).json({ error: "Failed to get priority quota" });
    }
  }
);

// ---------------------------------------------------------------------------
// PRIORITY MAIL - GET CAMPAIGN STATUS
// ---------------------------------------------------------------------------
// GET /api/premium/priority/status/:campaignId
// Returns: { campaignId, priorityJobs: [], statusCounts: {} }
router.get(
  "/priority/status/:campaignId",
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const userId = req.user!.id;

      // Check premium
      const premiumCheck = await requirePremium(userId, "Priority Mail");
      if (!premiumCheck.allowed) {
        return res.status(403).json({ error: premiumCheck.message });
      }

      // Get campaign (ensure it's a string)
      const campaignIdStr = String(campaignId);

      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignIdStr },
      });

      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get email job IDs for this campaign first
      const emailJobs = await prisma.emailJob.findMany({
        where: { campaignId: campaignIdStr },
        select: { id: true },
      });

      const emailJobIds = emailJobs.map(j => j.id);

      // Get priority jobs for these email jobs
      const priorityJobs = await prisma.priorityQueueJob.findMany({
        where: {
          emailJobId: { in: emailJobIds },
        },
        orderBy: { createdAt: "desc" },
      });

      // Fetch email job details separately
      const emailJobMap = new Map(emailJobs.map(j => [j.id, j]));
      const emailJobDetails = await prisma.emailJob.findMany({
        where: { id: { in: emailJobIds } },
        select: { id: true, toEmail: true, status: true, scheduledAt: true, sentAt: true },
      });

      const emailJobDetailMap = new Map(emailJobDetails.map(j => [j.id, j]));

      // Combine priority jobs with email job details
      const priorityJobsWithEmail = priorityJobs.map(pj => ({
        ...pj,
        emailJob: emailJobDetailMap.get(pj.emailJobId),
      }));

      const statusCounts = {
        pending: priorityJobs.filter(j => j.status === "PRIORITY_PENDING").length,
        sending: priorityJobs.filter(j => j.status === "PRIORITY_SENDING").length,
        sent: priorityJobs.filter(j => j.status === "SENT").length,
        failed: priorityJobs.filter(j => j.status === "FAILED").length,
      };

      res.json({
        campaignId: campaignIdStr,
        isPriority: campaign.isPriority,
        priorityJobs: priorityJobsWithEmail,
        statusCounts,
      });
    } catch (error) {
      logger.error({ error }, "[PRIORITY STATUS ERROR]");
      res.status(500).json({ error: "Failed to get priority status" });
    }
  }
);

export default router;