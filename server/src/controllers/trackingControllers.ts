import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";

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
}

let flushInterval: ReturnType<typeof setInterval> | null = null;

export function startTrackingBuffer(): void {
  flushInterval = setInterval(flushTrackingBuffer, TRACKING_FLUSH_INTERVAL_MS);
  console.log(`[Tracking] Redis buffer started (batch: ${TRACKING_BATCH_SIZE}, flush: ${TRACKING_FLUSH_INTERVAL_MS}ms)`);
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

async function flushTrackingBuffer(): Promise<void> {
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
      createdAt: new Date(e.timestamp),
    }));

    await prisma.trackingEvent.createMany({ data });
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

  // Buffer to Redis — fire-and-forget, never block the pixel response
  bufferTrackingEvent({
    emailJobId,
    eventType: "OPEN",
    ipAddress,
    userAgent,
    timestamp: Date.now(),
  });

  res.set({
    "Content-Type": "image/gif",
    "Content-Length": String(TRANSPARENT_GIF.length),
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.status(200).end(TRANSPARENT_GIF);
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

  if (!url) {
    res.status(400).json({ message: "Missing url parameter" });
    return;
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    decodedUrl = url;
  }

  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
  const userAgent = (req.headers["user-agent"] as string) || null;

  // Buffer to Redis — fire-and-forget, never block the redirect
  bufferTrackingEvent({
    emailJobId,
    eventType: "CLICK",
    url: decodedUrl,
    ipAddress,
    userAgent,
    timestamp: Date.now(),
  });

  res.redirect(302, decodedUrl || "/");
};
