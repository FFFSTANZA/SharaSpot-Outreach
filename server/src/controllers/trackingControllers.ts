import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { logContactActivityByEmail } from "../utils/contactService";
import { triggerWebhook } from "../services/webhookService";

interface PlatformInfo {
  platform: string;
  isMobile: boolean;
  isDesktop: boolean;
  isBot: boolean;
  browser: string;
}

function parseUserAgent(userAgent: string | null): PlatformInfo {
  if (!userAgent) return { platform: "unknown", isMobile: false, isDesktop: false, isBot: false, browser: "unknown" };

  const ua = userAgent.toLowerCase();

  let platform = "unknown";
  let isMobile = false;
  let isDesktop = false;
  let isBot = false;
  let browser = "unknown";

  if (/bot|spider|crawler|slurp|duckduckbot|baiduspider|facebookexternalhit|twitterbot/.test(ua)) {
    isBot = true;
    platform = "bot";
  } else if (/iphone|ipad|ipod|android|mobile|windows phone|blackberry|playbook/.test(ua)) {
    isMobile = true;
    if (/iphone|ipad|ipod/.test(ua)) platform = "iOS";
    else if (/android/.test(ua)) platform = "Android";
    else if (/windows phone/.test(ua)) platform = "Windows Phone";
    else if (/blackberry|playbook/.test(ua)) platform = "BlackBerry";
    else platform = "Mobile";
  } else if (/mac|windows|linux|ubuntu|fedora|centos/.test(ua)) {
    isDesktop = true;
    if (/mac/.test(ua)) platform = "macOS";
    else if (/windows/.test(ua)) platform = "Windows";
    else if (/linux/.test(ua)) platform = "Linux";
    else platform = "Desktop";
  }

  if (/chrome/.test(ua) && !/edge/.test(ua)) browser = "Chrome";
  else if (/firefox/.test(ua)) browser = "Firefox";
  else if (/safari/.test(ua) && !/chrome/.test(ua)) browser = "Safari";
  else if (/edge/.test(ua)) browser = "Edge";
  else if (/opera|opr/.test(ua)) browser = "Opera";
  else if (/msie|trident/.test(ua)) browser = "IE";

  return { platform, isMobile, isDesktop, isBot, browser };
}

function getClientId(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"] as string;
  const ip = forwarded?.split(",")[0]?.trim() || req.ip || "unknown";
  const cookieId = req.headers["cookie"]?.toString().includes("tracking_id")
    ? req.headers["cookie"].toString().match(/tracking_id=([^;]+)/)?.[1]
    : null;
  return `${ip}:${cookieId || "anonymous"}`;
}

function generateTrackingToken(emailJobId: string): string {
  const crypto = require("crypto");
  return crypto.randomBytes(16).toString("hex");
}

/**
 * 1x1 transparent GIF — smallest valid GIF89a image (43 bytes).
 * Served as the tracking pixel response.
 */
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// ---------------------------------------------------------------------------
// Redis-Buffered Batch Insert for Tracking Events
// ---------------------------------------------------------------------------
// Instead of writing every OPEN/CLICK event directly to Postgres, events are
// pushed to a Redis list. A background flusher batches them and inserts in
// bulk, reducing DB disk I/O by ~90% at scale.
// ---------------------------------------------------------------------------

const TRACKING_BUFFER_KEY = "tracking:events:buffer";
const TRACKING_BATCH_SIZE = parseInt(process.env.TRACKING_BATCH_SIZE || "100", 10);
const TRACKING_FLUSH_INTERVAL_MS = parseInt(process.env.TRACKING_FLUSH_INTERVAL_MS || "5000", 10);

interface BufferedTrackingEvent {
  emailJobId: string;
  eventType: "OPEN" | "CLICK";
  url?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: number;
  platform?: string | null;
  isMobile?: boolean;
  isDesktop?: boolean;
  isBot?: boolean;
  browser?: string | null;
  trackingToken?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

let flushInterval: ReturnType<typeof setInterval> | null = null;

export function startTrackingBuffer(): void {
  flushInterval = setInterval(flushTrackingBuffer, TRACKING_FLUSH_INTERVAL_MS);
  console.log(`[Tracking] Redis buffer started (batch: ${TRACKING_BATCH_SIZE}, flush: ${TRACKING_FLUSH_INTERVAL_MS}ms)`);

  // Configuration check for local development
  const trackingBaseUrl = process.env.TRACKING_BASE_URL;
  if (!trackingBaseUrl) {
    console.warn("[Tracking] WARNING: TRACKING_BASE_URL is not set. Open/Click tracking will be disabled.");
  } else if (trackingBaseUrl.includes("localhost") || trackingBaseUrl.includes("127.0.0.1")) {
    console.log("[Tracking] INFO: TRACKING_BASE_URL is set to localhost. Ensure your email client can reach this URL.");
  } else {
    console.log(`[Tracking] INFO: TRACKING_BASE_URL is set to ${trackingBaseUrl}`);
  }
}

export function stopTrackingBuffer(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
  // Final flush on shutdown
  flushTrackingBuffer().catch((err) =>
    console.error("[Tracking] Final flush error:", err)
  );
}

export function bufferTrackingEvent(event: BufferedTrackingEvent): void {
  redis.lpush(TRACKING_BUFFER_KEY, JSON.stringify(event)).catch((err) => {
    console.error("[Tracking] Failed to buffer event:", err);
  });
}

export async function flushTrackingBuffer(): Promise<void> {
  try {
    const events: BufferedTrackingEvent[] = [];

    while (events.length < TRACKING_BATCH_SIZE) {
      const raw = await redis.rpop(TRACKING_BUFFER_KEY);
      if (!raw) break;
      try {
        events.push(JSON.parse(raw));
      } catch {
        // skip malformed entries
      }
    }

    if (events.length === 0) return;

    const data = events.map((e) => ({
      emailJobId: e.emailJobId,
      eventType: e.eventType,
      url: e.url ?? null,
      ipAddress: e.ipAddress ?? null,
      userAgent: e.userAgent ?? null,
      platform: e.platform ?? null,
      browser: e.browser ?? null,
      isMobile: e.isMobile ?? null,
      isDesktop: e.isDesktop ?? null,
      isBot: e.isBot ?? null,
      trackingToken: e.trackingToken ?? null,
      utmSource: e.utmSource ?? null,
      utmMedium: e.utmMedium ?? null,
      utmCampaign: e.utmCampaign ?? null,
      createdAt: new Date(e.timestamp),
    }));

    await prisma.trackingEvent.createMany({ data });

    // Log contact activity and trigger webhooks in parallel (with concurrency control)
    const jobIds = [...new Set(data.map((e) => e.emailJobId))];
    const jobs = await prisma.emailJob.findMany({
      where: { id: { in: jobIds } },
      include: { campaign: true },
    });
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    const CONCURRENCY_LIMIT = 10;
    const chunks = [];
    for (let i = 0; i < data.length; i += CONCURRENCY_LIMIT) {
      chunks.push(data.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (event) => {
          const job = jobMap.get(event.emailJobId);
          if (job) {
            const metadata: Record<string, any> = {
              emailJobId: event.emailJobId,
              campaignId: job.campaignId,
              url: event.url,
            };

            if (event.platform) metadata.platform = event.platform;
            if (event.browser) metadata.browser = event.browser;
            if (event.utmSource) metadata.utmSource = event.utmSource;

            // Log activity
            await logContactActivityByEmail(
              job.campaign.userId,
              job.toEmail,
              event.eventType === "OPEN" ? "EMAIL_OPENED" : "EMAIL_CLICKED",
              metadata
            );

            // Trigger webhook
            await triggerWebhook(
              job.campaign.userId,
              event.eventType === "OPEN" ? "email.opened" : "email.clicked",
              {
                emailJobId: event.emailJobId,
                toEmail: job.toEmail,
                campaignId: job.campaignId,
                url: event.url,
                platform: event.platform,
                browser: event.browser,
              }
            ).catch((err) => console.error("[Tracking] Webhook error:", err));
          }
        })
      );
    }

    console.log(`[Tracking] Flushed ${events.length} events to Postgres`);
  } catch (err) {
    console.error("[Tracking] Flush error:", err);
  }
}

/**
 * GET /track/open/:emailJobId
 *
 * Records an OPEN tracking event via Redis buffer and returns a 1x1 transparent GIF.
 * Public endpoint — no authentication required.
 */
export const handleOpen = async (req: Request, res: Response): Promise<void> => {
  const emailJobId = req.params.emailJobId as string;
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
  const userAgent = (req.headers["user-agent"] as string) || null;
  const platformInfo = parseUserAgent(userAgent);
  const trackingToken = req.query.token as string || generateTrackingToken(emailJobId);

  console.log(`[Tracking] HIT: Open event for Job ${emailJobId} from ${ipAddress} (${platformInfo.platform}/${platformInfo.browser})`);

  try {
    const existingEvent = await prisma.trackingEvent.findFirst({
      where: {
        emailJobId,
        eventType: "OPEN",
        ipAddress: ipAddress || undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    if (!existingEvent) {
      bufferTrackingEvent({
        emailJobId,
        eventType: "OPEN",
        ipAddress,
        userAgent,
        timestamp: Date.now(),
        platform: platformInfo.platform,
        isMobile: platformInfo.isMobile,
        isDesktop: platformInfo.isDesktop,
        isBot: platformInfo.isBot,
        browser: platformInfo.browser,
        trackingToken,
      });

    }

    res.set({
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Set-Cookie": `tracking_id=${trackingToken}; Path=/; Max-Age=31536000; HttpOnly`,
    });
    res.status(200).end(TRANSPARENT_GIF);
  } catch (err) {
    console.error("[Tracking] Open handler error:", err);
    res.set({
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    res.status(200).end(TRANSPARENT_GIF);
  }
};

/**
 * GET /track/click/:emailJobId?url=<encoded>
 *
 * Records a CLICK tracking event via Redis buffer and redirects to the original URL.
 * Public endpoint — no authentication required.
 */
export const handleClick = async (req: Request, res: Response): Promise<void> => {
  const emailJobId = req.params.emailJobId as string;
  const url = req.query.url as string | undefined;
  const utmSource = req.query.utm_source as string | undefined;
  const utmMedium = req.query.utm_medium as string | undefined;
  const utmCampaign = req.query.utm_campaign as string | undefined;
  const utmContent = req.query.utm_content as string | undefined;
  const utmTerm = req.query.utm_term as string | undefined;
  const trackingToken = req.query.token as string || null;

  if (!url) {
    console.warn(`[Tracking] MISS: Click event for Job ${emailJobId} - Missing URL`);
    res.status(400).json({ message: "Missing url parameter" });
    return;
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    decodedUrl = url;
  }

  const parsedUrl = new URL(decodedUrl);
  if (utmSource) parsedUrl.searchParams.set("utm_source", utmSource);
  if (utmMedium) parsedUrl.searchParams.set("utm_medium", utmMedium);
  if (utmCampaign) parsedUrl.searchParams.set("utm_campaign", utmCampaign);
  if (utmContent) parsedUrl.searchParams.set("utm_content", utmContent);
  if (utmTerm) parsedUrl.searchParams.set("utm_term", utmTerm);
  const finalUrl = parsedUrl.toString();

  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
  const userAgent = (req.headers["user-agent"] as string) || null;
  const platformInfo = parseUserAgent(userAgent);

  console.log(`[Tracking] HIT: Click event for Job ${emailJobId} to ${finalUrl} from ${ipAddress} (${platformInfo.platform}/${platformInfo.browser})`);

  try {
    bufferTrackingEvent({
      emailJobId,
      eventType: "CLICK",
      url: finalUrl,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      platform: platformInfo.platform,
      isMobile: platformInfo.isMobile,
      isDesktop: platformInfo.isDesktop,
      isBot: platformInfo.isBot,
      browser: platformInfo.browser,
      trackingToken,
    });

    res.redirect(302, finalUrl);
  } catch (err) {
    console.error("[Tracking] Click handler error:", err);
    res.redirect(302, finalUrl || "/");
  }
};
