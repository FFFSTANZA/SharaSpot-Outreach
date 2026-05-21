import { Request, Response } from "express";
import crypto from "crypto";
import { logger } from "../utils/logger";
import { trackingBuffer, TrackingEvent } from "../services/trackingBufferService";

export { trackingBuffer, TrackingEvent };
export const startTrackingBuffer = () => trackingBuffer.start();
export const stopTrackingBuffer = () => trackingBuffer.stop();
export const bufferTrackingEvent = (event: TrackingEvent) => trackingBuffer.buffer(event);
export const flushTrackingBuffer = () => trackingBuffer.flush();

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

/**
 * 1x1 transparent GIF — smallest valid GIF89a image (43 bytes).
 * Served as the tracking pixel response.
 */
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const ALLOWED_DOMAINS = process.env.ALLOWED_REDIRECT_DOMAINS
  ? process.env.ALLOWED_REDIRECT_DOMAINS.split(",").map(d => d.trim())
  : null;

function isSafeRedirectUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (ALLOWED_DOMAINS) {
      return ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith("." + d));
    }
    const dangerousPatterns = [
      /^https?:\/\/evil/i, /^https?:\/\/malicious/i, /^https?:\/\/phishing/i,
      /\.xyz$/, /\.top$/, /\.gq$/, /\.ml$/, /\.cf$/, /\.ga$/,
    ];
    return !dangerousPatterns.some(p => p.test(parsed.hostname));
  } catch {
    return false;
  }
}

function sendTrackingPixel(res: Response, trackingToken: string): void {
  res.set({
    "Content-Type": "image/gif",
    "Content-Length": String(TRANSPARENT_GIF.length),
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Set-Cookie": `tracking_id=${trackingToken}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=None`,
  });
  res.status(200).end(TRANSPARENT_GIF);
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
  const trackingToken = req.query.token as string || crypto.randomBytes(16).toString("hex");

  logger.info({ emailJobId, ipAddress, platform: platformInfo.platform, browser: platformInfo.browser }, "[Tracking] HIT: Open event");

  try {
    const { prisma } = await import("../config/prisma");
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
      trackingBuffer.buffer({
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

    sendTrackingPixel(res, trackingToken);
  } catch (err) {
    logger.error({ err }, "[Tracking] Open handler error");
    sendTrackingPixel(res, trackingToken);
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
  const trackingToken = req.query.token as string || null;

  if (!url) {
    logger.warn({ emailJobId }, "[Tracking] MISS: Click event - Missing URL");
    res.status(400).json({ message: "Missing url parameter" });
    return;
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    decodedUrl = url;
  }

  if (!isSafeRedirectUrl(decodedUrl)) {
    logger.warn({ emailJobId, url: decodedUrl }, "[Tracking] BLOCKED: Unsafe redirect URL");
    res.status(400).json({ message: "Invalid redirect URL" });
    return;
  }

  const parsedUrl = new URL(decodedUrl);
  if (utmSource) parsedUrl.searchParams.set("utm_source", utmSource);
  if (utmMedium) parsedUrl.searchParams.set("utm_medium", utmMedium);
  if (utmCampaign) parsedUrl.searchParams.set("utm_campaign", utmCampaign);
  const finalUrl = parsedUrl.toString();

  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
  const userAgent = (req.headers["user-agent"] as string) || null;
  const platformInfo = parseUserAgent(userAgent);

  logger.info({ emailJobId, url: finalUrl, ipAddress, platform: platformInfo.platform, browser: platformInfo.browser }, "[Tracking] HIT: Click event");

  try {
    trackingBuffer.buffer({
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
    logger.error({ err }, "[Tracking] Click handler error");
    res.redirect(302, finalUrl || "/");
  }
};
