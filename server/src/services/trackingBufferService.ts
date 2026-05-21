import { redis } from "../config/redis";
import { logger } from "../utils/logger";

export interface TrackingEvent {
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

const TRACKING_BUFFER_KEY = "tracking:events:buffer";
const TRACKING_BATCH_SIZE = parseInt(process.env.TRACKING_BATCH_SIZE || "100", 10);
const TRACKING_FLUSH_INTERVAL_MS = parseInt(process.env.TRACKING_FLUSH_INTERVAL_MS || "5000", 10);

let flushInterval: ReturnType<typeof setInterval> | null = null;

export class TrackingBufferService {
  start(): void {
    flushInterval = setInterval(() => this.flush(), TRACKING_FLUSH_INTERVAL_MS);
    logger.info({ batchSize: TRACKING_BATCH_SIZE, flushMs: TRACKING_FLUSH_INTERVAL_MS }, "[Tracking] Redis buffer started");

    const trackingBaseUrl = process.env.TRACKING_BASE_URL;
    if (!trackingBaseUrl) {
      logger.warn("[Tracking] TRACKING_BASE_URL is not set. Open/Click tracking will be disabled.");
    } else if (trackingBaseUrl.includes("localhost") || trackingBaseUrl.includes("127.0.0.1")) {
      logger.info("[Tracking] TRACKING_BASE_URL is set to localhost. Ensure your email client can reach this URL.");
    } else {
      logger.info({ trackingBaseUrl }, "[Tracking] TRACKING_BASE_URL configured");
    }
  }

  stop(): void {
    if (flushInterval) {
      clearInterval(flushInterval);
      flushInterval = null;
    }
    this.flush().catch((err) =>
      logger.error({ err }, "[Tracking] Final flush error")
    );
  }

  buffer(event: TrackingEvent): void {
    redis.lpush(TRACKING_BUFFER_KEY, JSON.stringify(event)).catch((err) => {
      logger.error({ err }, "[Tracking] Failed to buffer event");
    });
  }

  async flush(): Promise<void> {
    try {
      const events: TrackingEvent[] = [];

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

      const { prisma } = await import("../config/prisma");
      const { logContactActivityByEmail } = await import("../utils/contactService");
      const { triggerWebhook } = await import("../services/webhookService");

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

              await logContactActivityByEmail(
                job.campaign.userId,
                job.toEmail,
                event.eventType === "OPEN" ? "EMAIL_OPENED" : "EMAIL_CLICKED",
                metadata
              );

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
              ).catch((err) => logger.error({ err }, "[Tracking] Webhook error"));
            }
          })
        );
      }

      logger.info({ count: events.length }, "[Tracking] Flushed events to Postgres");
    } catch (err) {
      logger.error({ err }, "[Tracking] Flush error");
    }
  }
}

export const trackingBuffer = new TrackingBufferService();
